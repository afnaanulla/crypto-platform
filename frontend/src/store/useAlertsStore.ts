import { create } from "zustand";
import { api } from "../lib/api";

export interface Alert {
  id: string;
  coinId: string;
  condition: "above" | "below";
  targetPrice: number;
  createdAt: string | number;
  isTriggered?: boolean;
  triggered?: boolean; // alias for UI compat
  triggeredAt?: string | number;
  triggeredPrice?: number;
  isActive?: boolean;
}

interface AlertsState {
  alerts: Alert[];
  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Omit<Alert, "id" | "createdAt" | "triggered" | "isTriggered">) => Promise<Alert>;
  removeAlert: (id: string) => Promise<void>;
  markTriggered: (alertId: string, currentPrice: number) => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],

  fetchAlerts: async () => {
    try {
      const { data } = await api.get("/alerts");
      const mapped = (data.data || data).map((alert: any) => ({
        ...alert,
        triggered: alert.isTriggered ?? false,
      }));
      set({ alerts: mapped });
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    }
  },

  addAlert: async (alert) => {
    try {
      const { data } = await api.post("/alerts", alert);
      const newAlert = { ...(data.data || data), triggered: false };
      set({ alerts: [newAlert, ...get().alerts] });
      return newAlert;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create alert");
    }
  },

  removeAlert: async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      set({ alerts: get().alerts.filter((alert) => alert.id !== id) });
    } catch (error) {
      console.error("Failed to delete alert", error);
    }
  },

  // Called from AppLayout when backend sends alert:triggered via WebSocket
  markTriggered: (alertId, currentPrice) => {
    set({
      alerts: get().alerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, triggered: true, isTriggered: true, isActive: false, triggeredAt: Date.now(), triggeredPrice: currentPrice }
          : alert
      ),
    });
  },
}));
