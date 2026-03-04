import { create } from 'zustand';

export interface Deal {
  steamId: string;
  title: string;
  currentPrice: number;
  discount: number;
  image: string;
}

interface AppState {
  isAuthenticated: boolean;
  hashedSteamId: string | null;
  deals: Deal[];
  login: (hashedSteamId: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  hashedSteamId: null,
  deals: [],
  login: (hashedSteamId) => set({ isAuthenticated: true, hashedSteamId }),
  logout: () => set({ isAuthenticated: false, hashedSteamId: null, deals: [] }),
  setDeals: (deals) => set({ deals }),
}));
