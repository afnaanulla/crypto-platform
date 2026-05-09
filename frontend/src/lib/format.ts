import { useUiStore, CURRENCIES } from "../store/useUiStore";

export const useFormat = () => {
  const currency = useUiStore((state) => state.currency);
  const cfg = CURRENCIES[currency] || CURRENCIES.USD;

  const formatPrice = (usd: number) => {
    const value = usd * cfg.rate;
    const fractionDigits =
      value >= 1000 ? 2 : value >= 1 ? (cfg.code === "JPY" ? 0 : 3) : 4;
    return `${cfg.symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  };

  const formatCompact = (usd: number) => {
    const value = usd * cfg.rate;
    if (value >= 1e12) return `${cfg.symbol}${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${cfg.symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${cfg.symbol}${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${cfg.symbol}${(value / 1e3).toFixed(2)}K`;
    return `${cfg.symbol}${value.toFixed(2)}`;
  };

  const convert = (usd: number) => usd * cfg.rate;

  return { formatPrice, formatCompact, convert, symbol: cfg.symbol, code: cfg.code, rate: cfg.rate };
};
