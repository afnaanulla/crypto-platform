import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolioStore, Position } from "../store/usePortfolioStore";
import { usePriceStore, Coin } from "../store/usePriceStore";
import { GlassCard } from "../components/common/GlassCard";
import { StatCard } from "../components/common/StatCard";
import { CoinBadge } from "../components/common/CoinBadge";
import { Skeleton } from "../components/common/Skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Trash2, Briefcase, Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useFormat } from "../lib/format";
import toast from "react-hot-toast";

// PIE_COLORS removed since we use native coin colors

export default function Portfolio() {
  const { formatPrice, formatCompact, symbol, convert } = useFormat();
  const positions = usePortfolioStore((state) => state.positions);
  const portfolioLoading = usePortfolioStore((state) => state.loading);
  const addPosition = usePortfolioStore((state) => state.addPosition);
  const removePosition = usePortfolioStore((state) => state.removePosition);
  const coins = usePriceStore((state) => state.coins);
  const loaded = usePriceStore((state) => state.loaded);

  const [coinId, setCoinId] = React.useState("bitcoin");
  const [qty, setQty] = React.useState("");
  const [buyPrice, setBuyPrice] = React.useState("");

  const enriched = positions.map((position) => {
    const coin = coins.find((coin) => coin.id === position.coinId);
    if (!coin) return null;
    const currentValue = coin.price * position.quantity;
    const cost = position.purchasePrice * position.quantity;
    const pnl = currentValue - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...position, coin, currentValue, cost, pnl, pnlPct };
  }).filter((position): position is NonNullable<typeof position> => position !== null);

  const totalValue = enriched.reduce((a, position) => a + position.currentValue, 0);
  const totalCost = enriched.reduce((a, position) => a + position.cost, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const PIE_COLORS = ["#22d3ee", "#3b82f6", "#9333ea", "#10B981", "#F59E0B", "#EC4899", "#14B8A6", "#A855F7", "#EF4444", "#84CC16"];

  const pieData = enriched.map((position) => ({ name: position.coin.symbol, value: position.currentValue, color: position.coin.color || "#22d3ee" }));
  
  // Prevent slices from blending into each other if they share identical colors
  const usedColors = new Set<string>();
  let fallbackIdx = 0;
  pieData.forEach((slice) => {
    const color = slice.color.toUpperCase();
    if (usedColors.has(color) || color === "#FFFFFF" || color === "#000000") {
      slice.color = PIE_COLORS[fallbackIdx % PIE_COLORS.length];
      fallbackIdx++;
    }
    usedColors.add(slice.color.toUpperCase());
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = parseFloat(qty);
    const buy = parseFloat(buyPrice);
    if (!quantity || !buy || quantity <= 0 || buy <= 0) return toast.error("Enter valid quantity and price");
    try {
      await addPosition({ coinId, quantity: quantity, purchasePrice: buy });
      toast.success("Position added");
      setQty(""); setBuyPrice("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add position");
    }
  };

  const fillCurrent = () => {
    const coin = coins.find((coin) => coin.id === coinId);
    if (coin) setBuyPrice(coin.price.toFixed(coin.price >= 1 ? 2 : 4));
  };

  return (
    <div className="space-y-8" data-testid="portfolio-page">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">// holdings</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
            Your <span className="gradient-text">Portfolio</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Live P&L tracked across every position.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {!loaded ? (
          [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[148px] rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Total Value" value={convert(totalValue)} prefix={symbol} decimals={2} accent="cyan" testId="port-total-value" />
            <StatCard label="Total Cost" value={convert(totalCost)} prefix={symbol} decimals={2} accent="blue" testId="port-total-cost" />
            <GlassCard className="p-6 relative overflow-hidden grain" data-testid="port-total-pnl">
              <div className={`absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl bg-gradient-to-br opacity-60 ${totalPnL >= 0 ? "from-emerald-500/30 to-emerald-500/0" : "from-red-500/30 to-red-500/0"}`} />
              <div className="relative">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Total P&L</p>
                <div className={`mt-3 text-3xl font-mono font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPnL >= 0 ? "+" : "-"}{formatPrice(Math.abs(totalPnL))}
                </div>
                <div className={`mt-2 inline-flex items-center gap-1 text-xs font-mono ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(2)}%
                </div>
              </div>
            </GlassCard>
            <StatCard label="Positions" value={enriched.length} decimals={0} accent="purple" testId="port-positions-count" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-cyan-400/15 border border-cyan-400/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-cyan-300" />
            </div>
            <h3 className="font-display text-lg">Add position</h3>
          </div>
          <form onSubmit={submit} className="space-y-4" data-testid="add-position-form">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Asset</label>
              <select
                value={coinId}
                onChange={(event) => setCoinId(event.target.value)}
                data-testid="position-coin-select"
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath d='M5 8l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.25rem" }}
              >
                {coins.map((coin) => (
                  <option key={coin.id} value={coin.id} className="bg-ink-900">{coin.name} ({coin.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Quantity</label>
              <input type="number" step="0.0001" value={qty} onChange={(event) => setQty(event.target.value)} placeholder="0.5" data-testid="position-qty-input"
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 font-mono" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Buy price (USD)</label>
                <button type="button" onClick={fillCurrent} className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 hover:text-cyan-200" data-testid="use-current-price">use current</button>
              </div>
              <input type="number" step="0.0001" value={buyPrice} onChange={(event) => setBuyPrice(event.target.value)} placeholder="42000" data-testid="position-price-input"
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 font-mono" />
            </div>
            <button type="submit" className="w-full gradient-primary text-white font-medium rounded-xl py-3 hover:opacity-90 transition-all" data-testid="add-position-submit">
              Add position
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="font-display text-lg mb-4">Allocation</h3>
          {pieData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <Briefcase className="h-10 w-10 text-slate-600 mb-3" />
              <div className="text-sm text-slate-400">No positions yet</div>
              <div className="text-xs text-slate-500 mt-1">Add one on the left to see your allocation breakdown.</div>
            </div>
          ) : (
            <div className="h-72" data-testid="allocation-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={0} minAngle={15} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(11,16,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontFamily: "JetBrains Mono", fontSize: "12px", color: "#fff" }} 
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: 500, marginBottom: "4px" }}
                    formatter={(value: any) => formatPrice(value)} 
                  />
                  <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="font-display text-lg">Holdings</h3>
        </div>

        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <div className="text-sm text-slate-400">Your holdings will appear here</div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-white/5">
                    <th className="text-left py-3 px-6 font-medium">Asset</th>
                    <th className="text-right py-3 px-4 font-medium">Qty</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Buy</th>
                    <th className="text-right py-3 px-4 font-medium">Current</th>
                    <th className="text-right py-3 px-4 font-medium">Value</th>
                    <th className="text-right py-3 px-4 font-medium">P&L</th>
                    <th className="py-3 px-6 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {enriched.map((price) => (
                      <motion.tr key={price.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`position-row-${price.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <CoinBadge coin={price.coin} size={32} />
                            <div>
                              <div className="font-medium text-white">{price.coin.symbol}</div>
                              <div className="text-xs text-slate-500">{price.coin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-white font-mono">{price.quantity}</td>
                        <td className="py-4 px-4 text-right text-slate-300 font-mono">{formatPrice(price.purchasePrice)}</td>
                        <td className="py-4 px-4 text-right text-white font-mono">{formatPrice(price.coin.price)}</td>
                        <td className="py-4 px-4 text-right text-white font-mono">{formatPrice(price.currentValue)}</td>
                        <td className={`py-4 px-4 text-right font-mono ${price.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-0.5">
                              {price.pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {price.pnl >= 0 ? "+" : "-"}{formatPrice(Math.abs(price.pnl))}
                            </span>
                            <span className="text-[10px] opacity-80">{price.pnlPct >= 0 ? "+" : ""}{price.pnlPct.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => { removePosition(price.id); toast.success("Removed"); }} className="text-slate-500 hover:text-red-400 p-2" data-testid={`delete-position-${price.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="md:hidden p-4 space-y-3">
              {enriched.map((price) => (
                <div key={price.id} className="glass p-4" data-testid={`position-card-${price.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><CoinBadge coin={price.coin} size={28} /><span className="font-medium">{price.coin.symbol}</span></div>
                    <button onClick={() => removePosition(price.id)} className="text-slate-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div><div className="text-slate-500">Qty</div><div>{price.quantity}</div></div>
                    <div><div className="text-slate-500">Value</div><div>{formatPrice(price.currentValue)}</div></div>
                    <div className="col-span-2"><div className="text-slate-500">P&L</div><div className={price.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{price.pnl >= 0 ? "+" : "-"}{formatPrice(Math.abs(price.pnl))} ({price.pnlPct.toFixed(2)}%)</div></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
