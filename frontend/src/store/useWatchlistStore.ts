import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  favorites: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      favorites: [], // array of coin ids
      toggle: (id) => {
        const favorites = get().favorites;
        set({ favorites: favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id] });
      },
      isFavorite: (id) => get().favorites.includes(id),
    }),
    { name: "kuvaka-watchlist" }
  )
);
