import React from "react";
import { useNavigate } from "react-router-dom";
import { usePriceStore, Coin } from "../store/usePriceStore";
import { GlassCard } from "../components/common/GlassCard";
import { CoinBadge } from "../components/common/CoinBadge";
import { Skeleton } from "../components/common/Skeleton";
import { useFormat } from "../lib/format";
import { api } from "../lib/api";
import { TrendingUp, TrendingDown, Flame, Snowflake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface VolatilityData {
  name: string;
  volatility: number;
  color: string;
  id: string;
}

interface ExtendedCoin extends Coin {
  stats: {
    high: number;
    low: number;
    volatility: number;
  };
}

const heatmapColor = (value: number) => {
  if (value >= 0) {
    const intensity = Math.min(value, 1);
    const r = Math.round(34 + (16 - 34) * intensity);
    const g = Math.round(45 + (185 - 45) * intensity);
    const b = Math.round(60 + (129 - 60) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${0.25 + intensity * 0.6})`;
  } else {
    const intensity = Math.min(-value, 1);
    const r = Math.round(60 + (239 - 60) * intensity);
    const g = Math.round(45 + (68 - 45) * intensity);
    const b = Math.round(60 + (68 - 60) * intensity);
    return `rgba(${r}, ${g}, ${b}, ${0.25 + intensity * 0.6})`;
  }
};

export default function Analytics() {
  const { formatPrice, symbol } = useFormat();
  const coins = usePriceStore((state) => state.coins) as ExtendedCoin[];
  const loaded = usePriceStore((state) => state.loaded);
  const navigate = useNavigate();
  const [corr, setCorr] = React.useState<Record<string, Record<string, number>> | null>(null);
  const [vols, setVols] = React.useState<Record<string, number> | null>(null);

  React.useEffect(() => {
    if (!loaded) return;
    
    const fetchAnalytics = () => {
      Promise.all([
        api.get("/prices/analytics/correlations"),
        api.get("/prices/analytics/volatility")
      ]).then(([resCorr, resVol]) => {
        setCorr(resCorr.data.data.matrix);
        
        const volMap: Record<string, number> = {};
        resVol.data.data.forEach((item: any) => { volMap[item.coinId] = item.volatility; });
        setVols(volMap);
      }).catch(console.error);
    };

    // Fetch immediately on load
    fetchAnalytics();
    
    // Silently update the analytics in the background every 60 seconds
    const intervalId = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(intervalId);
  }, [loaded]);

  if (!loaded || !corr || !vols) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const sortedByVolatility: VolatilityData[] = [...coins]
    .map((coin) => ({ name: coin.symbol, volatility: vols[coin.id] ?? 0, color: coin.color, id: coin.id }))
    .sort((coin1, coin2) => coin2.volatility - coin1.volatility);

  const sortedByChange = [...coins].sort((coin1, coin2) => (coin2.change24h ?? 0) - (coin1.change24h ?? 0));
  const gainers = sortedByChange.slice(0, 3);
  const losers = sortedByChange.slice(-3).reverse();

  return (
    <div className="space-y-8" data-testid="analytics-page">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">// intelligence</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
          Market <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Volatility, correlation and momentum across the top assets.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg">Volatility ranking</h3>
          </div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-5">7-DAY · STANDARD DEVIATION OF RETURNS</p>
          <div className="h-[520px]" data-testid="volatility-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedByVolatility} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#cbd5e1", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ backgroundColor: "rgba(11,16,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontFamily: "JetBrains Mono", fontSize: "12px" }} formatter={(v: any) => [`${v.toFixed(2)}%`, "Volatility"]} />
                <Bar dataKey="volatility" fill="url(#volGrad)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-display text-lg">Correlation matrix</h3>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-5">7-DAY · PEARSON</p>
          <div className="overflow-x-auto" data-testid="correlation-heatmap">
            <div className="inline-block min-w-full">
              <div className="grid" style={{ gridTemplateColumns: `52px repeat(${coins.length}, minmax(36px, 1fr))` }}>
                <div></div>
                {coins.map((coin) => (
                  <div key={coin.id} className="text-[10px] font-mono text-slate-400 text-center pb-1">{coin.symbol}</div>
                ))}
                {coins.map((row, i) => (
                  <React.Fragment key={row.id}>
                    <div className="text-[10px] font-mono text-slate-400 pr-2 flex items-center justify-end">{row.symbol}</div>
                    {coins.map((_, j) => {
                      const val = corr[row.id]?.[coins[j].id] ?? 0;
                      return (
                        <div
                          key={j}
                          className="aspect-square m-[2px] rounded flex items-center justify-center text-[9px] font-mono text-white/80 transition-colors hover:ring-1 hover:ring-white"
                          style={{ backgroundColor: heatmapColor(val) }}
                          title={`${row.symbol} ↔ ${coins[j].symbol}: ${val.toFixed(2)}`}
                        >
                          {val.toFixed(1)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            <span>-1</span>
            <div className="h-2 flex-1 rounded" style={{ background: "linear-gradient(to right, rgba(239,68,68,0.85), rgba(11,16,32,0.4), rgba(16,185,129,0.85))" }} />
            <span>+1</span>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
              <Flame className="h-4 w-4 text-emerald-300" />
            </div>
            <h3 className="font-display text-lg">Top gainers</h3>
          </div>
          <ul className="space-y-3">
            {gainers.map((c, i) => (
              <li key={c.id}>
                <button onClick={() => navigate(`/coins/${c.id}`)} className="w-full glass-hover glass p-4 flex items-center gap-4" data-testid={`gainer-${c.id}`}>
                  <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                  <CoinBadge coin={c} size={32} />
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{c.symbol}</div>
                    <div className="text-xs text-slate-500 font-mono">{formatPrice(c.price)}</div>
                  </div>
                  <div className="text-emerald-400 font-mono inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> +{(c.change24h ?? 0).toFixed(2)}%
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-red-500/15 border border-red-400/20 flex items-center justify-center">
              <Snowflake className="h-4 w-4 text-red-300" />
            </div>
            <h3 className="font-display text-lg">Top losers</h3>
          </div>
          <ul className="space-y-3">
            {losers.map((c, i) => (
              <li key={c.id}>
                <button onClick={() => navigate(`/coins/${c.id}`)} className="w-full glass-hover glass p-4 flex items-center gap-4" data-testid={`loser-${c.id}`}>
                  <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                  <CoinBadge coin={c} size={32} />
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{c.symbol}</div>
                    <div className="text-xs text-slate-500 font-mono">{formatPrice(c.price)}</div>
                  </div>
                  <div className="text-red-400 font-mono inline-flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> {(c.change24h ?? 0).toFixed(2)}%
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
