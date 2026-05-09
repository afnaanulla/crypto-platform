import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("skeleton-shimmer", className)} />
);

export const SkeletonRow: React.FC = () => (
  <tr className="border-b border-white/5">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);
