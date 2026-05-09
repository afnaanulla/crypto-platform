import { create } from "zustand";
import { api } from "../lib/api";

export interface Position {
  id: string;
  coinId: string;
  quantity: number;
  purchasePrice: number;
  createdAt: number | string;
}

interface PortfolioState {
  positions: Position[];
  loading: boolean;
  fetchPortfolio: () => Promise<void>;
  addPosition: (position: Omit<Position, "id" | "createdAt">) => Promise<Position>;
  removePosition: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  positions: [],
  loading: false,

  fetchPortfolio: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/portfolio");
      const res = data.data || data;
      set({ positions: res.positions || [] });
    } catch (err) {
      console.error("Failed to fetch portfolio", err);
    } finally {
      set({ loading: false });
    }
  },

  addPosition: async (position) => {
    try {
      const { data } = await api.post("/portfolio/positions", position);
      const pos = data.data || data;
      set({ positions: [pos, ...get().positions] });
      return pos;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to add position");
    }
  },

  removePosition: async (id) => {
    // Optimistic update with rollback on failure
    const prev = get().positions;
    set({ positions: prev.filter((position) => position.id !== id) });
    try {
      await api.delete(`/portfolio/positions/${id}`);
    } catch (error) {
      // Roll back on failure
      set({ positions: prev });
      console.error("Failed to delete position", error);
    }
  },
}));
