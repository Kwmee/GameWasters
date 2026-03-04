import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  steamId: string | null;
  login: (steamId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  steamId: null,
  login: (steamId) => set({ isAuthenticated: true, steamId }),
  logout: () => set({ isAuthenticated: false, steamId: null }),
}));
