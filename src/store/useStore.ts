import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Deal {
  steamId: string;
  title: string;
  currentPrice: number;
  discount: number;
  image: string;
}

export interface TopSteamRecommendation {
  appId: number;
  title: string;
  score: number;
  gameGenres: string[];
  concurrentPlayers: number | null;
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
  topSteamRecommendations: TopSteamRecommendation[];
  topGenres: TopGenre[];
  login: (hashedSteamId: string, steamName?: string, steamAvatar?: string, token?: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
  setTopSteamRecommendations: (items: TopSteamRecommendation[]) => void;
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
      topSteamRecommendations: [],
      topGenres: [],
      login: (hashedSteamId, steamName, steamAvatar, token) => 
        set({ isAuthenticated: true, hashedSteamId, steamName, steamAvatar, token }),
      logout: () => 
        set({
          isAuthenticated: false,
          hashedSteamId: null,
          steamName: null,
          steamAvatar: null,
          token: null,
          deals: [],
          topSteamRecommendations: [],
          topGenres: [],
        }),
      setDeals: (deals) => set({ deals }),
      setTopSteamRecommendations: (topSteamRecommendations) => set({ topSteamRecommendations }),
      setTopGenres: (topGenres) => set({ topGenres }),
    }),
    {
      name: 'steam-deals-storage', // nombre en localStorage
    }
  )
);
