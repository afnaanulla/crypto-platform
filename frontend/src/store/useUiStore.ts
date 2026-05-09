import { create } from "zustand";
import { persist } from "zustand/middleware";

// USD-relative static FX rates (mock — fine for a frontend demo)
export const CURRENCIES: Record<string, { symbol: string; rate: number; locale: string; code: string }> = {
  USD: { symbol: "$", rate: 1, locale: "en-US", code: "USD" },
  EUR: { symbol: "€", rate: 0.92, locale: "de-DE", code: "EUR" },
  GBP: { symbol: "£", rate: 0.79, locale: "en-GB", code: "GBP" },
  INR: { symbol: "₹", rate: 83.2, locale: "en-IN", code: "INR" },
  JPY: { symbol: "¥", rate: 156.8, locale: "ja-JP", code: "JPY" },
};

interface UiState {
  currency: string;
  soundEnabled: boolean;
  setCurrency: (currency: string) => void;
  toggleSound: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      currency: "USD",
      soundEnabled: true,
      setCurrency: (currency) => set({ currency: currency }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    { name: "kuvaka-ui" }
  )
);
