import { create } from "zustand";
import { api, socket } from "../lib/api";

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  history?: { t: number; price: number }[];
  sparkline: { x: number; y: number }[];
  color: string;
  up?: boolean;
  stats?: {
    high: number;
    low: number;
    volatility: number;
  };
}

interface PriceState {
  coins: Coin[];
  loaded: boolean;
  lastUpdated: number | null;
  isConnected: boolean;
  _sparklineInterval: ReturnType<typeof setInterval> | null;
  initialize: () => void;
  cleanup: () => void;
  setConnected: (v: boolean) => void;
  getCoin: (id: string) => Coin | undefined;
}

// Colors for the coins
const COIN_COLORS: Record<string, string> = {
  bitcoin: "#F7931A",
  ethereum: "#627EEA",
  solana: "#14F195",
  ripple: "#346AA9",
  cardano: "#0033AD",
  "avalanche-2": "#E84142",
  dogecoin: "#C2A633",
  polkadot: "#E6007A",
  chainlink: "#2A5ADA",
  "shiba-inu": "#E03328",
  uniswap: "#FF007A",
  stellar: "#7B68EE",
  monero: "#FF6600",
  "ethereum-classic": "#328332",
  "bitcoin-cash": "#8DC351",
  cosmos: "#6F4E37",
  filecoin: "#0090FF",
  aptos: "#6366F1",
  tron: "#FF0013",
  litecoin: "#345D9D",
};


export const usePriceStore = create<PriceState>((set, get) => ({
  coins: [],
  loaded: false,
  lastUpdated: null,
  isConnected: false,
  _sparklineInterval: null,

  initialize: async () => {
    // Prevent re-registering listeners if already initialized and connected
    if (get().loaded && socket.connected) return;

    // 1. Initial Fetch
    try {
      const { data } = await api.get("/prices/live");
      const coinsList = data.data || data;
      const mapped = coinsList.map((coin: any) => ({
        ...coin,
        id: coin.coinId,
        color: COIN_COLORS[coin.coinId] || "#888888",
        sparkline: (coin.history || []).slice(-20).map((record: any, index: number) => ({ x: index, y: record.price })),
        // Real stats from backend — no more fake ±2% fallback
        stats: coin.stats ?? { high: coin.price, low: coin.price, volatility: 0 },
      }));
      set({ coins: mapped, loaded: true, lastUpdated: Date.now() });
    } catch (error) {
      console.error("Failed to fetch initial prices", error);
      set({ loaded: true }); // still mark loaded so UI shows empty state, not infinite spinner
    }


    // 2. Connect WebSocket
    socket.connect();

    socket.on("connect", () => set({ isConnected: true }));
    socket.on("disconnect", () => set({ isConnected: false }));

    socket.on("prices:update", (payload: any) => {
      const updatedCoins = payload.prices || payload;
      set((state) => {
        const newCoins = state.coins.map((old) => {
          const update = updatedCoins.find((update: any) => update.coinId === old.id);
          if (!update) return old;

          return {
            ...old,
            // Update live market data every 10s
            price: update.price,
            change24h: update.change24h ?? old.change24h,
            marketCap: update.marketCap ?? old.marketCap,
            volume: update.volume ?? old.volume,
            up: update.price > old.price,
            // Keep sparkline and history unchanged — sparkline refreshes every 5min
            history: [...(old.history || []).slice(-199), { t: Date.now(), price: update.price }],
          };
        });

        return { coins: newCoins, lastUpdated: Date.now() };
      });
    });

    // Refresh sparklines every 5 minutes from backend (7-day historical shape stays fresh)
    const sparklineRefresh = setInterval(async () => {
      try {
        const { data } = await api.get("/prices/live");
        const coinsList = data.data || data;
        set((state) => ({
          coins: state.coins.map((old) => {
            const fresh = coinsList.find((coin: any) => coin.coinId === old.id);
            if (!fresh) return old;
            return {
              ...old,
              sparkline: (fresh.history || []).slice(-20).map((record: any, index: number) => ({ x: index, y: record.price })),
              stats: fresh.stats ?? old.stats,
            };
          }),
        }));
      } catch {
        // Silently ignore — sparkline will just stay as-is
      }
    }, 5 * 60 * 1000); // every 5 minutes

    // Store the interval in Zustand state so cleanup() can reliably clear it
    set({ _sparklineInterval: sparklineRefresh });
  },

  cleanup: () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("prices:update");
    socket.disconnect();
    const interval = get()._sparklineInterval;
    if (interval) clearInterval(interval);
    set({ _sparklineInterval: null });
  },

  setConnected: (value) => set({ isConnected: value }),
  getCoin: (id) => get().coins.find((coin) => coin.id === id),
}));
