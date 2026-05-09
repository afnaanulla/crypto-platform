import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, MobileNav } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Toaster } from "react-hot-toast";
import { usePriceStore } from "../../store/usePriceStore";
import { useAlertsStore } from "../../store/useAlertsStore";
import { usePortfolioStore } from "../../store/usePortfolioStore";
import { CoinBadge } from "../common/CoinBadge";
import { playAlertSound } from "../../lib/sound";
import { useUiStore } from "../../store/useUiStore";
import { socket } from "../../lib/api";
import toast from "react-hot-toast";

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const initialize = usePriceStore((state) => state.initialize);
  const cleanup = usePriceStore((state) => state.cleanup);
  const coins = usePriceStore((state) => state.coins);
  const fetchAlerts = useAlertsStore((state) => state.fetchAlerts);
  const markTriggered = useAlertsStore((state) => state.markTriggered);
  const fetchPortfolio = usePortfolioStore((state) => state.fetchPortfolio);
  const soundEnabled = useUiStore((state) => state.soundEnabled);
  const soundEnabledRef = React.useRef(soundEnabled);
  React.useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  React.useEffect(() => {
    initialize();
    fetchAlerts();
    fetchPortfolio();
    return () => cleanup();
  }, [initialize, cleanup, fetchAlerts, fetchPortfolio]);

  // Listen to server-side alert:triggered events (single source of truth)
  React.useEffect(() => {
    const onAlertTriggered = (data: {
      alertId: string;
      coinId: string;
      condition: "above" | "below";
      targetPrice: number;
      currentPrice: number;
    }) => {
      const coin = usePriceStore.getState().coins.find((coin) => coin.id === data.coinId);
      markTriggered(data.alertId, data.currentPrice);

      if (soundEnabledRef.current) playAlertSound(data.condition);

      toast.custom(
        (toastProps) => (
          <div
            className={`glass border-l-4 ${
              data.condition === "above" ? "border-l-emerald-400" : "border-l-red-400"
            } px-4 py-3 max-w-sm shadow-2xl ${toastProps.visible ? "animate-in slide-in-from-right" : ""}`}
            data-testid="alert-toast"
          >
            <div className="flex items-start gap-3">
              {coin && <CoinBadge coin={coin} size={36} />}
              <div className="flex-1">
                <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  Alert triggered
                </div>
                <div className="font-display text-white font-medium mt-0.5">
                  {data.coinId.toUpperCase()} {data.condition === "above" ? "↑" : "↓"} $
                  {data.targetPrice.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Now @ ${data.currentPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    };

    socket.on("alert:triggered", onAlertTriggered);
    return () => {
      socket.off("alert:triggered", onAlertTriggered);
    };
  }, [markTriggered]); // intentionally minimal — avoids re-registering listener on every price tick

  return (
    <div className="flex min-h-screen bg-ink-900 text-white">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
