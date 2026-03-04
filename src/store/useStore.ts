import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Deal {
  steamId: string;
  title: string;
  currentPrice: number;
  discount: number;
  image: string;
}

export interface TopGenre {
  name: string;
  playtime: number;
  percentage: number;
}

interface AppState {
  isAuthenticated: boolean;
  hashedSteamId: string | null;
  steamName: string | null;
  steamAvatar: string | null;
  token: string | null;
  deals: Deal[];
  topGenres: TopGenre[];
  login: (hashedSteamId: string, steamName?: string, steamAvatar?: string, token?: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
  setTopGenres: (genres: TopGenre[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hashedSteamId: null,
      steamName: null,
      steamAvatar: null,
      token: null,
      deals: [],
      topGenres: [],
      login: (hashedSteamId, steamName, steamAvatar, token) => 
        set({ isAuthenticated: true, hashedSteamId, steamName, steamAvatar, token }),
      logout: () => 
        set({ isAuthenticated: false, hashedSteamId: null, steamName: null, steamAvatar: null, token: null, deals: [], topGenres: [] }),
      setDeals: (deals) => set({ deals }),
      setTopGenres: (topGenres) => set({ topGenres }),
    }),
    {
      name: 'steam-deals-storage', // nombre en localStorage
    }
  )
);
