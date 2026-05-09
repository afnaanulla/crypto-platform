import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const { data } = await api.post("/auth/login", { email, password });
          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          throw new Error(error.response?.data?.message || "Login failed");
        }
      },

      // register now returns same shape as login (token + user) after backend fix
      register: async (_name, email, password) => {
        try {
          const { data } = await api.post("/auth/register", { email, password });
          set({
            user: data.data.user,
            token: data.data.token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          throw new Error(error.response?.data?.message || "Registration failed");
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem("kuvaka-auth");
      },
    }),
    { name: "kuvaka-auth" }
  )
);
