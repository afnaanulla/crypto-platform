import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlertsStore, Alert } from "../store/useAlertsStore";
import { usePriceStore, Coin } from "../store/usePriceStore";
import { GlassCard } from "../components/common/GlassCard";
import { CoinBadge } from "../components/common/CoinBadge";
import { Skeleton } from "../components/common/Skeleton";
import { Bell, Trash2, BellOff, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { useFormat } from "../lib/format";
import toast from "react-hot-toast";

export default function Alerts() {
  const { formatPrice, symbol } = useFormat();
  const alerts = useAlertsStore((state) => state.alerts);
  const addAlert = useAlertsStore((state) => state.addAlert);
  const removeAlert = useAlertsStore((state) => state.removeAlert);
  const coins = usePriceStore((state) => state.coins);
  const loaded = usePriceStore((state) => state.loaded);

  const [coinId, setCoinId] = React.useState("bitcoin");
  const [condition, setCondition] = React.useState<'above' | 'below'>("above");
  const [target, setTarget] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const active = alerts.filter((alert) => !alert.triggered && !alert.isTriggered);
  const fired = alerts.filter((a) => a.triggered || a.isTriggered);
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(fired.length / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  const paginatedFired = fired.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetPrice = parseFloat(target);
    if (!targetPrice || targetPrice <= 0) return toast.error("Enter a valid target price");
    try {
      await addAlert({ coinId, condition, targetPrice: targetPrice });
      const sym = coins.find((coin) => coin.id === coinId)?.symbol || coinId;
      toast.success(`Alert set: ${sym} ${condition} ${formatPrice(targetPrice)}`);
      setTarget("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create alert");
    }

  };

  return (
    <div className="space-y-8" data-testid="alerts-page">
      <header>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">// signals</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-2">
          Price <span className="gradient-text">Alerts</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Get notified the moment your conditions trigger.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-1 grain relative self-start">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-cyan-400/15 border border-cyan-400/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <h3 className="font-display text-lg">New alert</h3>
          </div>
          <form onSubmit={submit} className="space-y-4 relative" data-testid="create-alert-form">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Asset</label>
              <select
                value={coinId}
                onChange={(event) => setCoinId(event.target.value)}
                disabled={!loaded}
                data-testid="select-coin"
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath d='M5 8l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.25rem" }}
              >
                {coins.map((coin) => (
                  <option key={coin.id} value={coin.id} className="bg-ink-900">
                    {coin.name} ({coin.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Condition</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['above', 'below'] as const).map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setCondition(coin)}
                    data-testid={`alerts-condition-${coin}`}
                    className={`py-2.5 rounded-xl border text-sm font-medium uppercase tracking-wider transition-all ${
                      condition === coin
                        ? coin === "above"
                          ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                          : "bg-red-500/15 border-red-400/40 text-red-300"
                        : "bg-white/[0.03] border-white/10 text-slate-400"
                    }`}
                  >
                    {coin === "above" ? "↑ Above" : "↓ Below"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Target price (USD)</label>
              <input
                type="number"
                step="0.0001"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                data-testid="alerts-target-input"
                placeholder="50000"
                className="mt-2 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 font-mono"
              />
            </div>

            <button
              type="submit"
              data-testid="alerts-submit-button"
              className="w-full gradient-primary text-white font-medium rounded-xl py-3 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              Create alert
            </button>
          </form>
        </GlassCard>

        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg">Active alerts</h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80 px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20">{active.length}</span>
              </div>
            </div>

            {!loaded ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => <Skeleton key={index} className="h-16" />)}
              </div>
            ) : active.length === 0 ? (
              <div className="py-12 text-center">
                <BellOff className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <div className="text-sm text-slate-400">No active alerts yet</div>
                <div className="text-xs text-slate-500 mt-1">Create one on the left to get notified.</div>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                <AnimatePresence>
                  {active.map((alert) => {
                    const coin = coins.find((c) => c.id === alert.coinId);
                    if (!coin) return null;
                    return (
                      <motion.li
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        className="py-3 flex items-center gap-4"
                        data-testid={`active-alert-${alert.id}`}
                      >
                        <CoinBadge coin={coin} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{coin.symbol}</div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              alert.condition === "above" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20" : "bg-red-500/15 text-red-300 border border-red-400/20"
                            }`}>
                              {alert.condition === "above" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                              {alert.condition}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            target {formatPrice(alert.targetPrice)} · now {formatPrice(coin.price)}
                          </div>
                        </div>
                        <button onClick={() => { removeAlert(alert.id); toast.success("Alert removed"); }} className="text-slate-500 hover:text-red-400 transition-colors p-2" data-testid={`delete-alert-${alert.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </GlassCard>

          {fired.length > 0 && (
            <GlassCard className="p-6 opacity-80">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display text-lg text-slate-300">Triggered</h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">{fired.length}</span>
              </div>
              <ul className="divide-y divide-white/5">
                {paginatedFired.map((firedAlert) => {
                  const coin = coins.find((c) => c.id === firedAlert.coinId);
                  if (!coin) return null;
                  return (
                    <li key={firedAlert.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4" data-testid={`triggered-alert-${firedAlert.id}`}>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <CoinBadge coin={coin} size={40} />
                        <div className="sm:hidden flex-1">
                          <div className="font-medium text-white">{coin.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{coin.symbol}</div>
                        </div>
                        <button onClick={() => removeAlert(firedAlert.id)} className="sm:hidden text-slate-500 hover:text-red-400 p-2 ml-auto"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      
                      <div className="flex-1 w-full">
                        <div className="hidden sm:flex text-sm font-medium text-white items-center gap-2 mb-2">
                          {coin.name} <span className="text-slate-400 font-mono text-xs">({coin.symbol})</span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Target</div>
                            <div className="text-xs font-medium text-slate-300">{firedAlert.condition === 'above' ? '↑' : '↓'} {formatPrice(firedAlert.targetPrice)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Trigger Price</div>
                            <div className="text-xs font-mono text-amber-300">{firedAlert.triggeredPrice ? formatPrice(firedAlert.triggeredPrice) : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Current Price</div>
                            <div className="text-xs font-mono text-cyan-300">{formatPrice(coin.price)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Since Trigger</div>
                            {(() => {
                              const trigPrice = firedAlert.triggeredPrice || firedAlert.targetPrice;
                              const diff = coin.price - trigPrice;
                              const pct = trigPrice > 0 ? (diff / trigPrice) * 100 : 0;
                              const sign = diff >= 0 ? '+' : '';
                              return (
                                <div className={`text-xs font-mono ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {sign}{formatPrice(diff)} ({sign}{pct.toFixed(3)}%)
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Created</div>
                            <div className="text-xs text-slate-400 truncate" title={new Date(firedAlert.createdAt).toLocaleString()}>{new Date(firedAlert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Triggered</div>
                            <div className="text-xs text-slate-400 truncate" title={firedAlert.triggeredAt ? new Date(firedAlert.triggeredAt).toLocaleString() : 'N/A'}>{firedAlert.triggeredAt ? new Date(firedAlert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeAlert(firedAlert.id)} className="hidden sm:block text-slate-500 hover:text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-mono uppercase tracking-widest"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    Page {validCurrentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-mono uppercase tracking-widest"
                  >
                    Next
                  </button>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
