import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
}

export interface CoinPriceRecord {
  coinId: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number | null;
  volume: number | null;
  change24h: number | null;
}

export interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
