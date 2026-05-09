import React from "react";
import { useNavigate } from "react-router-dom";
import { usePriceStore, Coin } from "../store/usePriceStore";
import { StatCard } from "../components/common/StatCard";
import { GlassCard } from "../components/common/GlassCard";
import { CoinBadge } from "../components/common/CoinBadge";
import { Sparkline } from "../components/common/Sparkline";
import { PriceFlash } from "../components/common/PriceFlash";
import { SkeletonRow, Skeleton } from "../components/common/Skeleton";
import { useFormat } from "../lib/format";
import { Search, ArrowUpRight, ArrowDownRight, Activity, BarChart3, Coins } from "lucide-react";

export default function Dashboard() {
  const { formatPrice, formatCompact, symbol, convert } = useFormat();
  // Stable ref so PriceFlash doesn't get a new `format` function every WebSocket tick
  const stableFormatPrice = React.useCallback((v: number) => formatPrice(v), [formatPrice]);
  const coins = usePriceStore((state) => state.coins);
  const loaded = usePriceStore((state) => state.loaded);
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [dominantCoinId, setDominantCoinId] = React.useState("bitcoin");
  const [marketCapCoinId, setMarketCapCoinId] = React.useState("all");
  const [volumeCoinId, setVolumeCoinId] = React.useState("all");

  const [limit, setLimit] = React.useState(7);

  const filtered = React.useMemo(() => {
    if (!query) return coins;
    const lowerQuery = query.toLowerCase();
    return coins.filter((c) => c.name.toLowerCase().includes(lowerQuery) || c.symbol.toLowerCase().includes(lowerQuery));
  }, [coins, query]);

  React.useEffect(() => {
    setLimit(7);
  }, [query]);

  const paginated = filtered.slice(0, limit);

  const totalMarketCap = coins.reduce((accumulator, coin) => accumulator + coin.marketCap, 0);
  const totalVolume = coins.reduce((accumulator, coin) => accumulator + coin.volume, 0);
  const totalChangeWeighted = totalMarketCap > 0 
    ? coins.reduce((accumulator, coin) => accumulator + (coin.change24h * coin.marketCap), 0) / totalMarketCap 
    : 0;
  
  const displayedMarketCap = marketCapCoinId === "all"
    ? totalMarketCap
    : coins.find(coin => coin.id === marketCapCoinId)?.marketCap || 0;

  const displayedChange = marketCapCoinId === "all"
    ? totalChangeWeighted
    : coins.find(coin => coin.id === marketCapCoinId)?.change24h || 0;

  const marketCapLabel = (
    <select
      value={marketCapCoinId}
      onChange={(event) => setMarketCapCoinId(event.target.value)}
      className="bg-transparent text-cyan-300 cursor-pointer focus:outline-none appearance-none pr-4 relative z-10 hover:text-cyan-200 transition-colors"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right center" }}
    >
      <option value="all" className="bg-ink-900 text-slate-300 normal-case tracking-normal">Total Market Cap</option>
      {coins.map(coin => <option key={coin.id} value={coin.id} className="bg-ink-900 text-slate-300 normal-case tracking-normal">{coin.symbol} Market Cap</option>)}
    </select>
  );

  const displayedVolume = volumeCoinId === "all" 
    ? totalVolume 
    : coins.find(coin => coin.id === volumeCoinId)?.volume || 0;

  const volumeLabel = (
    <select
      value={volumeCoinId}
      onChange={(event) => setVolumeCoinId(event.target.value)}
      className="bg-transparent text-purple-300 cursor-pointer focus:outline-none appearance-none pr-4 relative z-10 hover:text-purple-200 transition-colors"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d8b4fe' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right center" }}
    >
      <option value="all" className="bg-ink-900 text-slate-300 normal-case tracking-normal">All 24h Volume</option>
      {coins.map(coin => <option key={coin.id} value={coin.id} className="bg-ink-900 text-slate-300 normal-case tracking-normal">{coin.symbol} 24h Volume</option>)}
    </select>
  );
  
  const dominantCoin = coins.find((coin) => coin.id === dominantCoinId) || coins[0];
  const dominancePercent = dominantCoin && totalMarketCap ? (dominantCoin.marketCap / totalMarketCap) * 100 : 0;

  const dominanceLabel = (
    <select
      value={dominantCoinId}
      onChange={(event) => setDominantCoinId(event.target.value)}
      className="bg-transparent text-emerald-400 cursor-pointer focus:outline-none appearance-none pr-4 relative z-10 hover:text-emerald-300 transition-colors"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right center" }}
    >
      {coins.map(coin => <option key={coin.id} value={coin.id} className="bg-ink-900 text-slate-300 normal-case tracking-normal">{coin.symbol} Dominance</option>)}
    </select>
  );

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">// markets</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
            Live <span className="gradient-text">Market</span> Pulse
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time prices, volume, and momentum across the top 20 assets.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {!loaded ? (
          <>
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[148px] rounded-2xl" />)}
          </>
        ) : (
          <>
            <StatCard label={marketCapLabel} value={convert(displayedMarketCap) / 1e9} prefix={symbol} suffix="B" decimals={1} change={displayedChange} accent="cyan" testId="stat-market-cap" />
            <StatCard label={volumeLabel} value={convert(displayedVolume) / 1e9} prefix={symbol} suffix="B" decimals={1} accent="purple" testId="stat-volume" />
            <StatCard label={dominanceLabel} value={dominancePercent} suffix="%" decimals={2} accent="emerald" testId="stat-dominance" />
          </>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-medium">Markets</h3>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{filtered.length} ASSETS</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              data-testid="dashboard-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter assets…"
              className="bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all w-full sm:w-64"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="text-left py-3 px-6 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Asset</th>
                <th className="text-right py-3 px-4 font-medium">Price</th>
                <th className="text-right py-3 px-4 font-medium">24h</th>
                <th className="text-right py-3 px-4 font-medium">Market Cap</th>
                <th className="text-right py-3 px-4 font-medium">Volume</th>
                <th className="text-right py-3 px-4 font-medium">7d Chart</th>
                <th className="py-3 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                Array.from({ length: 7 }).map((_, index) => <SkeletonRow key={index} />)
              ) : (
                paginated.map((coin, idx) => (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/coins/${coin.id}`)}
                    className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    data-testid={`coin-row-${coin.id}`}
                  >
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <CoinBadge coin={coin} size={34} />
                        <div>
                          <div className="font-medium text-white">{coin.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <PriceFlash value={coin.price} format={stableFormatPrice} className="text-white" />
                    </td>
                    <td className={`py-4 px-4 text-right font-mono text-sm ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <span className="inline-flex items-center gap-0.5">
                        {coin.change24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-slate-300 font-mono text-sm">{formatCompact(coin.marketCap)}</td>
                    <td className="py-4 px-4 text-right text-slate-400 font-mono text-sm">{formatCompact(coin.volume)}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-block">
                        <Sparkline
                          data={coin.sparkline.map((state) => state.y)}
                          positive={coin.change24h >= 0}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-cyan-300 font-mono transition-opacity">
                        VIEW <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden p-4 space-y-3">
          {!loaded ? (
            Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-20" />)
          ) : (
            paginated.map((coin) => (
              <button
                key={coin.id}
                onClick={() => navigate(`/coins/${coin.id}`)}
                className="w-full glass p-4 flex items-center gap-3 text-left"
                data-testid={`coin-card-${coin.id}`}
              >
                <CoinBadge coin={coin} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{coin.symbol}</div>
                    <div className="font-mono text-sm text-white">${formatPrice(coin.price)}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-slate-500">{coin.name}</div>
                    <div className={`font-mono text-xs ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {loaded && filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-slate-400">No assets match "{query}"</div>
            <button onClick={() => setQuery("")} className="text-cyan-300 text-sm mt-2 hover:underline" data-testid="clear-filter">Clear filter</button>
          </div>
        )}

        {loaded && limit < filtered.length && (
          <div className="flex justify-center p-6 border-t border-white/5">
            <button
              onClick={() => setLimit((prev) => prev + 7)}
              className="glass px-6 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Show More
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
