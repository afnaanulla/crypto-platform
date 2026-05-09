import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

interface PriceFlashProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
  decimals?: number;
}

// Briefly flashes background green/red on price change
export const PriceFlash: React.FC<PriceFlashProps> = ({ value, format, className, decimals = 2 }) => {
  const prevRef = React.useRef(value);
  const [direction, setDirection] = React.useState(0);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (value !== prevRef.current) {
      const dir = value > prevRef.current ? 1 : value < prevRef.current ? -1 : 0;
      setDirection(dir);
      setTick((t) => t + 1);
      prevRef.current = value;
    }
  }, [value]);

  const text = format
    ? format(value)
    : Number(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence>
        <motion.span
          key={tick}
          initial={{ backgroundColor: direction === 1 ? "rgba(16,185,129,0.25)" : direction === -1 ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-md -mx-1.5"
        />
      </AnimatePresence>
      <span className="relative font-mono tabular-nums">{text}</span>
    </span>
  );
};
