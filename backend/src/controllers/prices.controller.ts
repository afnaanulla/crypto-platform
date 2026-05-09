import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../types";
import {
  getLivePrices,
  getPriceHistory,
  COIN_IDS,
  COIN_META,
} from "../services/coingecko.service";
import { calculateVolatility, calculateCorrelation } from "../utils/analytics";
import prisma from "../config/prisma";
import { safeGet, safeSet } from "../config/redis";
import logger from "../utils/logger";

export const historyParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
});

export const getLivePricesHandler = async (
  _request: AuthRequest,
  response: Response
): Promise<void> => {
  try {
    const prices = await getLivePrices();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch 7-day history for sparklines — downsampled to 20 pts per coin in memory
    const sparklineSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historyRows = await prisma.coinPrice.findMany({
      where: { coinId: { in: COIN_IDS }, createdAt: { gte: sparklineSince } },
      orderBy: { createdAt: "asc" },
      select: { coinId: true, price: true, createdAt: true },
    });

    // 2. Fetch High/Low using DB-side aggregation (7 days)
    const statsSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const aggregations = await prisma.coinPrice.groupBy({
      by: ["coinId"],
      where: { coinId: { in: COIN_IDS }, createdAt: { gte: statsSince } },
      _max: { price: true },
      _min: { price: true },
    });

    // 3. For volatility, use last 24h (already fetched in historyRows)
    // No need for a separate volRows fetch, we can use historyRows!

    const historyMap: Record<string, { timeStamp: number; price: number }[]> = {};
    const aggMap: Record<string, { high: number; low: number }> = {};
    const volMap: Record<string, number[]> = {};

    aggregations.forEach((aggregation) => {
      aggMap[aggregation.coinId] = {
        high: aggregation._max.price ?? 0,
        low: aggregation._min.price ?? 0,
      };
    });

    // Group and Downsample history to ~20 points for sparklines
    historyRows.forEach((row) => {
      if (!volMap[row.coinId]) volMap[row.coinId] = [];
      volMap[row.coinId].push(row.price);

      if (!historyMap[row.coinId]) historyMap[row.coinId] = [];
      historyMap[row.coinId].push({ timeStamp: row.createdAt.getTime(), price: row.price });
    });

    const pricesWithHistory = prices.map((coinPrice) => {
      const stats = aggMap[coinPrice.coinId] || { high: coinPrice.price, low: coinPrice.price };
      const volPrices = volMap[coinPrice.coinId] || [];
      const volatility = calculateVolatility(volPrices);

      // Downsample history to exactly 20 points
      const rawHistory = historyMap[coinPrice.coinId] || [];
      const downsampledHistory: { timeStamp: number; price: number }[] = [];
      if (rawHistory.length <= 20) {
        downsampledHistory.push(...rawHistory);
      } else {
        const step = Math.floor(rawHistory.length / 20);
        for (let i = 0; i < 20; i++) {
          downsampledHistory.push(rawHistory[i * step]);
        }
      }

      return {
        ...coinPrice,
        history: downsampledHistory,
        stats: { ...stats, volatility },
      };
    });

    response.json({ success: true, data: pricesWithHistory });

  } catch (error) {
    logger.error("getLivePrices error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to fetch live prices" });
  }
};

export const getPriceHistoryHandler = async (
  request: AuthRequest,
  response: Response
): Promise<void> => {
  try {
    const { coinId } = request.params;
    const days = Number(request.query.days) || 7;

    if (!COIN_IDS.includes(coinId)) {
      response.status(400).json({ success: false, message: "Unsupported coin ID" });
      return;
    }

    const history = await getPriceHistory(coinId, days);
    const prices = history.map((priceEntry) => priceEntry.price);
    const volatility = calculateVolatility(prices);
    const high = prices.length ? Math.max(...prices) : 0;
    const low = prices.length ? Math.min(...prices) : 0;

    response.json({
      success: true,
      data: {
        coinId,
        name: COIN_META[coinId]?.name ?? coinId,
        symbol: COIN_META[coinId]?.symbol ?? coinId,
        history,
        stats: { high, low, volatility, dataPoints: history.length },
      },
    });
  } catch (error) {
    logger.error("getPriceHistory error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to fetch price history" });
  }
};

export const getVolatilityHandler = async (
  _request: AuthRequest,
  response: Response
): Promise<void> => {
  try {
    const CACHE_KEY = "analytics:volatility";
    const cached = await safeGet(CACHE_KEY);
    if (cached) {
      response.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h window
    const MIN_DATA_POINTS = 5; // fall back to all data if window is too thin

    const results = await Promise.all(
      COIN_IDS.map(async (coinId) => {
        let rows = await prisma.coinPrice.findMany({
          where: { coinId, createdAt: { gte: since } },
          orderBy: { createdAt: "asc" },
          select: { price: true },
        });

        // Fall back to all available data if the 48h window is too thin
        if (rows.length < MIN_DATA_POINTS) {
          rows = await prisma.coinPrice.findMany({
            where: { coinId },
            orderBy: { createdAt: "asc" },
            select: { price: true },
          });
        }

        const prices = rows.map((priceRow) => priceRow.price);
        return {
          coinId,
          name: COIN_META[coinId]?.name ?? coinId,
          symbol: COIN_META[coinId]?.symbol ?? coinId,
          volatility: calculateVolatility(prices),
          dataPoints: prices.length,
        };
      })
    );

    const data = results.sort((coinA, coinB) => coinB.volatility - coinA.volatility);
    await safeSet(CACHE_KEY, JSON.stringify(data), 600); // 10 min cache

    response.json({ success: true, data });
  } catch (error) {
    logger.error("getVolatility error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to compute volatility" });
  }
};

export const getCorrelationHandler = async (
  _request: AuthRequest,
  response: Response
): Promise<void> => {
  try {
    const CACHE_KEY = "analytics:correlations";
    const cached = await safeGet(CACHE_KEY);
    if (cached) {
      response.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h window
    const MIN_DATA_POINTS = 5;

    const seriesMap: Record<string, number[]> = {};
    for (const coinId of COIN_IDS) {
      let rows = await prisma.coinPrice.findMany({
        where: { coinId, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
        select: { price: true },
      });

      // Fall back to all available data if the 48h window is too thin
      if (rows.length < MIN_DATA_POINTS) {
        rows = await prisma.coinPrice.findMany({
          where: { coinId },
          orderBy: { createdAt: "asc" },
          select: { price: true },
        });
      }

      seriesMap[coinId] = rows.map((priceRow) => priceRow.price);
    }

    const matrix: Record<string, Record<string, number>> = {};
    for (const coin1 of COIN_IDS) {
      matrix[coin1] = {};
      for (const coin2 of COIN_IDS) {
        matrix[coin1][coin2] =
          coin1 === coin2 ? 1 : calculateCorrelation(seriesMap[coin1], seriesMap[coin2]);
      }
    }

    const data = { coins: COIN_IDS, matrix };
    await safeSet(CACHE_KEY, JSON.stringify(data), 1800); // 30 min cache

    response.json({ success: true, data });
  } catch (error) {
    logger.error("getCorrelation error", { message: (error as Error).message });
    response.status(500).json({ success: false, message: "Failed to compute correlations" });
  }
};
