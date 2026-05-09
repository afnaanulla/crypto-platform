import axios from "axios";
import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API_URL = `${BASE}/api`;
const SOCKET_URL = BASE;

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("kuvaka-auth");
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Lazy import to avoid circular dependency
      import("../store/useAuthStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }
    return Promise.reject(error);
  }
);

// Socket — auth token injected lazily so it picks up the token even after login
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  auth: (cb) => {
    try {
      const stored = localStorage.getItem("kuvaka-auth");
      const { state } = JSON.parse(stored || "{}");
      cb({ token: state?.token || "" });
    } catch {
      cb({});
    }
  },
});
