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
  steamName: string | null;
  steamAvatar: string | null;
  deals: Deal[];
  login: (hashedSteamId: string, steamName?: string, steamAvatar?: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  hashedSteamId: null,
  steamName: null,
  steamAvatar: null,
  deals: [],
  login: (hashedSteamId, steamName, steamAvatar) => set({ isAuthenticated: true, hashedSteamId, steamName, steamAvatar }),
  logout: () => set({ isAuthenticated: false, hashedSteamId: null, steamName: null, steamAvatar: null, deals: [] }),
  setDeals: (deals) => set({ deals }),
}));
