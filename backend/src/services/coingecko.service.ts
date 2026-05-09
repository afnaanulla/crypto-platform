import axios, { AxiosError } from "axios";
import prisma from "../config/prisma";
import { safeGet, safeSet } from "../config/redis";
import logger from "../utils/logger";
import { CoinGeckoResponse, CoinPriceRecord } from "../types";

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "ripple",
  "dogecoin",
  "cardano",
  "tron",
  "litecoin",
  "polkadot",
  "chainlink",
  "avalanche-2",
  "shiba-inu",
  "uniswap",
  "stellar",
  "monero",
  "ethereum-classic",
  "bitcoin-cash",
  "cosmos",
  "filecoin",
  "aptos"
];

const COIN_META: Record<string, { symbol: string; name: string }> = {
  bitcoin:  { symbol: "BTC",  name: "Bitcoin"  },
  ethereum: { symbol: "ETH",  name: "Ethereum" },
  solana:   { symbol: "SOL",  name: "Solana"   },
  ripple:   { symbol: "XRP",  name: "XRP"      },
  dogecoin: { symbol: "DOGE", name: "Dogecoin" },
  cardano:  { symbol: "ADA",  name: "Cardano"  },
  tron:     { symbol: "TRX",  name: "TRON"     },
  litecoin: { symbol: "LTC",  name: "Litecoin" },
  polkadot: { symbol: "DOT",  name: "Polkadot" },
  chainlink:{ symbol: "LINK", name: "Chainlink"},
  "avalanche-2": { symbol: "AVAX", name: "Avalanche" },
  "shiba-inu": { symbol: "SHIB", name: "Shiba Inu" },
  "uniswap": { symbol: "UNI", name: "Uniswap" },
  "stellar": { symbol: "XLM", name: "Stellar" },
  "monero": { symbol: "XMR", name: "Monero" },
  "ethereum-classic": { symbol: "ETC", name: "Ethereum Classic" },
  "bitcoin-cash": { symbol: "BCH", name: "Bitcoin Cash" },
  "cosmos": { symbol: "ATOM", name: "Cosmos" },
  "filecoin": { symbol: "FIL", name: "Filecoin" },
  "aptos": { symbol: "APT", name: "Aptos" }
};

// CoinGecko free tier: 30 calls/min. Worker runs every 30s = 2 calls/min — safe.
const CACHE_KEY_LIVE = "prices:live";
const CACHE_TTL_SECONDS = 25;

let lastFetchedAt = 0;
const MIN_FETCH_INTERVAL_MS = 25_000;

// Tracks when we are allowed to call the API again after a 429
let rateLimitBlockedUntil = 0;

const callCoinGeckoApi = async (): Promise<CoinGeckoResponse> => {
  const baseUrl = process.env.COINGECKO_API || "https://api.coingecko.com/api/v3";

  let lastError: Error = new Error("Unknown error");

  // Retry only on network errors — never on 429 (rate limit)
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await axios.get<CoinGeckoResponse>(
        `${baseUrl}/simple/price`,
        {
          params: {
            ids: COIN_IDS.join(","),
            vs_currencies: "usd",
            include_market_cap: "true",
            include_24hr_vol: "true",
            include_24hr_change: "true",
          },
          timeout: 9000,
          headers: { Accept: "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      const axiosErr = error as AxiosError;

      // 429 = rate limited — honour Retry-After and block future calls
      if (axiosErr.response?.status === 429) {
        const retryAfterSec = Number(axiosErr.response.headers["retry-after"]) || 60;
        rateLimitBlockedUntil = Date.now() + retryAfterSec * 1000;
        logger.warn(
          `CoinGecko rate limit hit. Blocking worker for ${retryAfterSec}s`
        );
        throw error; // propagate immediately — no retry
      }

      lastError = error as Error;

      if (attempt < 2) {
        const delay = 1000 * Math.pow(2, attempt);
        logger.warn(`CoinGecko fetch attempt ${attempt + 1}/2 failed, retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export const fetchAndCachePrices = async (): Promise<CoinPriceRecord[]> => {
  const now = Date.now();

  // If still inside a rate-limit window, return cache without calling API
  if (now < rateLimitBlockedUntil) {
    const waitSec = Math.ceil((rateLimitBlockedUntil - now) / 1000);
    logger.warn(`Rate limit cooldown active — skipping fetch for ${waitSec}s`);
    const cached = await safeGet(CACHE_KEY_LIVE);
    if (cached) return JSON.parse(cached) as CoinPriceRecord[];
    return getLivePricesFromDb();
  }

  // Guard: skip API call if we fetched very recently (e.g. server restart)
  if (now - lastFetchedAt < MIN_FETCH_INTERVAL_MS) {
    const cached = await safeGet(CACHE_KEY_LIVE);
    if (cached) {
      logger.info("Price fetch skipped — using fresh cache");
      return JSON.parse(cached) as CoinPriceRecord[];
    }
    logger.info("Price fetch skipped — using DB fallback (cache miss/disabled)");
    return getLivePricesFromDb();
  }

  const data = await callCoinGeckoApi();

  const priceRecords: CoinPriceRecord[] = COIN_IDS.map((coinId) => ({
    coinId,
    symbol:    COIN_META[coinId]?.symbol ?? coinId.toUpperCase(),
    name:      COIN_META[coinId]?.name   ?? coinId,
    price:     data[coinId]?.usd              ?? 0,
    marketCap: data[coinId]?.usd_market_cap   ?? null,
    volume:    data[coinId]?.usd_24h_vol      ?? null,
    change24h: data[coinId]?.usd_24h_change   ?? null,
  })).filter((record) => record.price > 0);

  // Persist snapshot to DB
  await prisma.$transaction(
    priceRecords.map((record) => prisma.coinPrice.create({ data: record }))
  );

  // Update cache and last-fetch timestamp
  await safeSet(CACHE_KEY_LIVE, JSON.stringify(priceRecords), CACHE_TTL_SECONDS);
  lastFetchedAt = Date.now();

  logger.info(`Fetched and persisted ${priceRecords.length} coin prices`);
  return priceRecords;
};

// Separated so the rate-limit guard can call it without circular dependency
const getLivePricesFromDb = async (): Promise<CoinPriceRecord[]> => {
  const rows = await prisma.coinPrice.findMany({
    where: { coinId: { in: COIN_IDS } },
    orderBy: { createdAt: "desc" },
    distinct: ["coinId"],
  });

  // Enrich with name from COIN_META (avoids relying on stale Prisma client types)
  return rows.map((row) => ({
    ...row,
    name: COIN_META[row.coinId]?.name ?? row.coinId,
  })) as CoinPriceRecord[];
};

export const getLivePrices = async (): Promise<CoinPriceRecord[]> => {
  const cached = await safeGet(CACHE_KEY_LIVE);
  if (cached) return JSON.parse(cached) as CoinPriceRecord[];
  return getLivePricesFromDb();
};

export const getPriceHistory = async (
  coinId: string,
  days: number
): Promise<{ price: number; createdAt: Date; change24h: number | null }[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.coinPrice.findMany({
    where: { coinId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { price: true, createdAt: true, change24h: true },
  });
};

export { COIN_IDS, COIN_META };
