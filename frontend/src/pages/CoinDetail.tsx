import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePriceStore, Coin } from "../store/usePriceStore";
import { useAlertsStore } from "../store/useAlertsStore";
import { GlassCard } from "../components/common/GlassCard";
import { CoinBadge } from "../components/common/CoinBadge";
import { StatCard } from "../components/common/StatCard";
import { Skeleton } from "../components/common/Skeleton";
import { PriceFlash } from "../components/common/PriceFlash";
import { useFormat } from "../lib/format";
import { ArrowLeft, Bell, ChevronRight, TrendingUp, TrendingDown, Volume2, Flame, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import toast from "react-hot-toast";
import { api } from "../lib/api";

// Extend Coin type for detail specific data if needed, but assuming usePriceStore has it
interface ExtendedCoin extends Coin {
  stats: {
    high: number;
    low: number;
    volatility: number;
  };
  history: { t: number; price: number }[];
}

export default function CoinDetail() {
  const { formatPrice, formatCompact, symbol, convert } = useFormat();
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const coin = usePriceStore((state) => state.coins.find((coin) => coin.id === coinId)) as ExtendedCoin | undefined;
  const loaded = usePriceStore((state) => state.loaded);
  const addAlert = useAlertsStore((state) => state.addAlert);
  const [days, setDays] = React.useState(7);
  const [openModal, setOpenModal] = React.useState(false);
  const [condition, setCondition] = React.useState<'above' | 'below'>("above");
  const [target, setTarget] = React.useState("");
  const [historicalData, setHistoricalData] = React.useState<{t: number, price: number}[]>([]);
  const [stats, setStats] = React.useState<{ high: number; low: number; volatility: number } | null>(null);

  const fillCurrent = () => {
    if (coin) setTarget(coin.price.toFixed(coin.price >= 1 ? 2 : 4));
  };

  React.useEffect(() => {
    if (!coinId) return;
    
    // Clear old data instantly when switching coins to prevent chart shattering
    setHistoricalData([]);
    setStats(null);

    api.get(`/prices/history/${coinId}?days=${days}`).then((response) => {
      setHistoricalData(response.data.data.history.map((record: any) => ({
        t: new Date(record.createdAt).getTime(),
        price: record.price
      })));
      setStats(response.data.data.stats);
    }).catch(console.error);
  }, [coinId, days]);

  if (!loaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="text-center py-20" data-testid="coin-not-found">
        <h2 className="font-display text-2xl">Asset not found</h2>
        <button onClick={() => navigate("/dashboard")} className="text-cyan-300 mt-4">Back to dashboard</button>
      </div>
    );
  }

  const chartData = [...historicalData, { t: Date.now(), price: coin.price }].map((record) => ({
    time: new Date(record.t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    price: record.price,
  }));

  const onCreateAlert = (event: React.FormEvent) => {
    event.preventDefault();
    const t = parseFloat(target);
    if (!t || t <= 0) {
      toast.error("Enter a valid target price");
      return;
    }
    addAlert({ coinId: coin.id, condition, targetPrice: t });
    toast.success(`Alert set: ${coin.symbol} ${condition} $${t}`);
    setOpenModal(false);
    setTarget("");
  };

  return (
    <div className="space-y-8" data-testid="coin-detail-page">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => navigate("/dashboard")} className="hover:text-white inline-flex items-center gap-1.5" data-testid="breadcrumb-back">
          <ArrowLeft className="h-4 w-4" /> Markets
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">{coin.name}</span>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <CoinBadge coin={coin} size={56} />
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{coin.name}</h1>
              <span className="font-mono text-sm text-slate-500 uppercase">{coin.symbol}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <PriceFlash value={coin.price} format={(v) => formatPrice(v)} className="text-3xl md:text-4xl text-white" />
              <span className={`font-mono text-sm ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <button className="gradient-primary text-white font-medium rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_28px_rgba(34,211,238,0.5)] transition-all" data-testid="set-alert-button">
              <Bell className="h-4 w-4" /> Set Alert
            </button>
          </DialogTrigger>
          <DialogContent className="bg-ink-900/95 backdrop-blur-xl border-white/10 text-white max-w-md" data-testid="alert-modal">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Set Price Alert</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreateAlert} className="space-y-5 mt-4">
              <div className="flex items-center gap-3 glass p-3">
                <CoinBadge coin={coin} size={36} />
                <div>
                  <div className="font-medium">{coin.name}</div>
                  <div className="font-mono text-xs text-slate-500">{formatPrice(coin.price)}</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Condition</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['above', 'below'] as const).map((conditionType) => (
                    <button
                      key={conditionType}
                      type="button"
                      onClick={() => setCondition(conditionType)}
                      data-testid={`condition-${conditionType}`}
                      className={`py-2.5 rounded-xl border text-sm font-medium uppercase tracking-wider transition-all ${
                        condition === conditionType
                          ? conditionType === "above"
                            ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                            : "bg-red-500/15 border-red-400/40 text-red-300"
                          : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {conditionType === "above" ? "↑ Above" : "↓ Below"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Target Price (USD)</label>
                  <button type="button" onClick={fillCurrent} className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:text-cyan-200" data-testid="use-current-price">use current</button>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  data-testid="alert-target-input"
                  placeholder={formatPrice(coin.price)}
                  className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 font-mono"
                />
              </div>
              <button type="submit" className="w-full gradient-primary text-white font-medium rounded-xl py-3 transition-all hover:opacity-90" data-testid="create-alert-submit">
                Create Alert
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="24h High" value={stats?.high ?? coin.stats.high} prefix="$" decimals={2} accent="emerald" testId="stat-24h-high" />
        <StatCard label="24h Low" value={stats?.low ?? coin.stats.low} prefix="$" decimals={2} accent="amber" testId="stat-24h-low" />
        <StatCard label="Volatility" value={stats?.volatility ?? coin.stats.volatility} suffix="%" decimals={2} accent="purple" testId="stat-volatility" />
        <StatCard label="Market Cap" value={coin.marketCap / 1e9} prefix="$" suffix="B" decimals={2} accent="cyan" testId="stat-market-cap-detail" />
        <StatCard label="Volume" value={coin.volume / 1e9} prefix="$" suffix="B" decimals={2} accent="blue" testId="stat-volume-detail" />
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-display text-lg">Price History</h3>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">{days}-DAY MOVEMENT</p>
          </div>
          <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-1 gap-1">
            {[1, 7, 30].map((dayValue) => (
              <button
                key={dayValue}
                onClick={() => setDays(dayValue)}
                data-testid={`range-${dayValue}d`}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                  days === dayValue ? "bg-cyan-400/20 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {dayValue}D
              </button>
            ))}
          </div>
        </div>

        <div className="h-80" data-testid="price-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `$${v >= 1 ? v.toFixed(0) : v.toFixed(2)}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(11,16,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", fontFamily: "JetBrains Mono" }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#22d3ee" }}
                formatter={(value: any) => [`$${formatPrice(value)}`, "Price"]}
              />
              <Area isAnimationActive={false} type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} fill="url(#priceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
