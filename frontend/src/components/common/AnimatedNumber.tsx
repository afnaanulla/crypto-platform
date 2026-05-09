import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
}) => {
  const spring = useSpring(value, { stiffness: 80, damping: 22, mass: 0.5 });
  const display = useTransform(spring, (value) =>
    `${prefix}${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  );

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={cn("font-mono tabular-nums", className)}>{display}</motion.span>;
};
