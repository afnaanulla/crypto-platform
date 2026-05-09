import React from "react";

interface LivePulseProps {
  connected?: boolean;
  label?: string;
}

export const LivePulse: React.FC<LivePulseProps> = ({ connected = true, label = "LIVE" }) => (
  <div className="flex items-center gap-2" data-testid="live-pulse">
    <span className="relative flex h-2.5 w-2.5">
      {connected && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          connected ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
        }`}
      />
    </span>
    <span className="text-[10px] font-mono font-medium tracking-[0.18em] text-slate-300">
      {connected ? label : "OFFLINE"}
    </span>
  </div>
);
