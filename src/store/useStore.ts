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
  gamesCount: number;
  percentage: number;
}

export interface PlayerProfile {
  summary: {
    totalPlaytimeHours: number;
    totalGames: number;
    gamesPlayed: number;
    gamesNotPlayed: number;
    topGame: { name: string; hours: number } | null;
    estimatedInventoryValue: number;
    playerScore: number;
    rank: string;
  };
  achievements: {
    totalUnlocked: number;
    totalAchievements: number;
    avgCompletion: number;
    perfectGames: number;
    topGames: Array<{
      appid: number;
      gameName: string;
      totalAchievements: number;
      unlockedAchievements: number;
      completionPercent: number;
    }>;
  };
  leaderboard: {
    position: number;
    totalFriends: number;
    entries: Array<{
      steamId: string;
      personaname: string;
      avatarfull: string;
      totalPlaytimeHours: number;
      gameCount: number;
      score: number;
      isUser?: boolean;
    }>;
  };
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
  playerProfile: PlayerProfile | null;
  login: (hashedSteamId: string, steamName?: string, steamAvatar?: string, token?: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
  setTopSteamRecommendations: (items: TopSteamRecommendation[]) => void;
  setTopGenres: (genres: TopGenre[]) => void;
  setPlayerProfile: (profile: PlayerProfile) => void;
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
      playerProfile: null,
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
          playerProfile: null,
        }),
      setDeals: (deals) => set({ deals }),
      setTopSteamRecommendations: (topSteamRecommendations) => set({ topSteamRecommendations }),
      setTopGenres: (topGenres) => set({ topGenres }),
      setPlayerProfile: (playerProfile) => set({ playerProfile }),
    }),
    {
      name: 'steam-deals-storage',
    }
  )
);
