import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  // Pin the Y-axis range to the 7-day high/low so live ticks don't collapse the scale
  domainMin?: number;
  domainMax?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 96,
  height = 32,
  positive = true,
  domainMin,
  domainMax,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="skeleton-shimmer" />;
  }

  // Use provided domain (7d high/low) or fall back to data range
  const min = domainMin !== undefined ? domainMin : Math.min(...data);
  const max = domainMax !== undefined ? domainMax : Math.max(...data);
  const range = max - min || 1;

  const stepX = width / (data.length - 1);
  const points = data
    .map((value, index) => `${(index * stepX).toFixed(2)},${(height - ((value - min) / range) * height).toFixed(2)}`)
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const stroke = positive ? "#10B981" : "#EF4444";
  const fill = positive ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)";

  // Stable gradient ID — NOT random so React doesn't recreate the SVG every render
  const gradId = `spark-${positive ? "pos" : "neg"}-${data.length}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
