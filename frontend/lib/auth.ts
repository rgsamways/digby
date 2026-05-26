import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateRoles: (roles: string[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem("digby_token", token);
        set({ token, user });
      },
      clearAuth: () => {
        localStorage.removeItem("digby_token");
        set({ token: null, user: null });
      },
      updateRoles: (roles) =>
        set((state) => ({ user: state.user ? { ...state.user, roles } : null })),
    }),
    { name: "digby-auth" }
  )
);
