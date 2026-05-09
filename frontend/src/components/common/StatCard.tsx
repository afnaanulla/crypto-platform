import React from "react";
import { GlassCard } from "./GlassCard";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatCardProps {
  label: React.ReactNode;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: LucideIcon;
  accent?: 'cyan' | 'blue' | 'purple' | 'emerald' | 'amber';
  testId?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  change,
  icon: Icon,
  accent = "cyan",
  testId,
}) => {
  const accentMap = {
    cyan: "from-cyan-400/20 to-cyan-400/0 text-cyan-300",
    blue: "from-blue-500/20 to-blue-500/0 text-blue-300",
    purple: "from-purple-500/20 to-purple-500/0 text-purple-300",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-300",
  };
  return (
    <GlassCard className="px-5 py-4 relative overflow-hidden grain" data-testid={testId}>
      <div className={cn("absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl bg-gradient-to-br opacity-60", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <div className={cn(
            "mt-3 font-mono font-bold text-white transition-all", 
            value.toString().split('.')[0].length > 9 ? "text-xl md:text-2xl" : 
            value.toString().split('.')[0].length > 6 ? "text-2xl md:text-3xl" : "text-3xl"
          )}>
            <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          </div>
          {typeof change === "number" && (
            <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-mono", change >= 0 ? "text-emerald-400" : "text-red-400")}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </GlassCard>
  );
};
