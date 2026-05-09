import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface CoinBadgeProps {
  coin: {
    symbol: string;
    color: string;
  } | null | undefined;
  size?: number;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({ coin, size = 32 }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!coin) return null;
  const initials = coin.symbol.slice(0, 3);
  const logoUrl = `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`;

  return (
    <div
      className={cn("relative flex items-center justify-center rounded-full font-bold text-white shrink-0 overflow-hidden")}
      style={{
        width: size,
        height: size,
        background: !imageError ? 'transparent' : `linear-gradient(135deg, ${coin.color}, ${coin.color}aa)`,
        boxShadow: !imageError ? 'none' : `0 0 0 1px rgba(255,255,255,0.08), 0 6px 18px -6px ${coin.color}80`,
      }}
    >
      {!imageError ? (
        <img
          src={logoUrl}
          alt={coin.symbol}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-mono" style={{ fontSize: size * 0.32 }}>
          {initials}
        </span>
      )}
    </div>
  );
};
