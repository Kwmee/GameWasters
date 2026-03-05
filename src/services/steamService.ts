import { z } from 'zod';
import { config } from '../config.js';
import crypto from 'crypto';

// Esquema de validación estricta (equivalente a Pydantic)
export const OwnedGameSchema = z.object({
  appid: z.number(),
  name: z.string().optional(),
  playtime_forever: z.number(),
  playtime_2weeks: z.number().optional().default(0),
  img_icon_url: z.string().optional(),
});

export type OwnedGame = z.infer<typeof OwnedGameSchema>;

const SteamResponseSchema = z.object({
  response: z.object({
    game_count: z.number().optional(),
    games: z.array(OwnedGameSchema).optional().default([]),
  }),
});

export const SteamPriceOverviewSchema = z.object({
  currency: z.string(),
  initial: z.number(),
  final: z.number(),
  discount_percent: z.number(),
});

export type SteamPriceOverview = z.infer<typeof SteamPriceOverviewSchema>;

export type PlayerAchievementStats = {
  appid: number;
  gameName: string;
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercent: number;
};

export type FriendProfile = {
  steamId: string;
  personaname: string;
  avatarfull: string;
  totalPlaytimeHours: number;
  gameCount: number;
  topGame?: string;
};

export type MostPlayedSteamGame = {
  appid: number;
  rank: number;
  concurrent_in_game?: number;
};

export type SteamTopGameWithGenres = {
  appId: number;
  title: string;
  gameGenres: string[];
  concurrentPlayers?: number;
};

// Sistema de caché simple en memoria
const ownedGamesCache = new Map<string, { data: OwnedGame[]; timestamp: number }>();
const appDetailsCache = new Map<string, { data: any; timestamp: number }>();
const generalCache = new Map<string, { data: unknown; timestamp: number }>();
const priceCache = new Map<number, { data: SteamPriceOverview | null; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

export class SteamService {
  private apiKey: string;
  private baseUrl = 'http://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com/api';

  constructor() {
    this.apiKey = config.STEAM_API_KEY;
  }

  /**
   * Pseudonimización del SteamID real para proteger la privacidad del usuario
   */
  public hashSteamId(realSteamId: string): string {
    return crypto.createHash('sha256').update(realSteamId).digest('hex').substring(0, 16);
  }

  /**
   * Obtiene la lista de juegos de un usuario con manejo de caché y validación estricta
   */
  public async getOwnedGames(steamId: string): Promise<OwnedGame[]> {
    const cacheKey = `owned_games_${steamId}`;
    const cached = ownedGamesCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[SteamService] Retornando juegos desde caché para ${steamId}`);
      return cached.data;
    }

    try {
      // Si estamos usando la key de prueba, devolvemos datos mockeados
      if (this.apiKey === 'mock_steam_key') {
        const mockGames: OwnedGame[] = [
          { appid: 1091500, name: "Cyberpunk 2077", playtime_forever: 3600, playtime_2weeks: 0 },
          { appid: 367520, name: "Hollow Knight", playtime_forever: 1200, playtime_2weeks: 0 },
          { appid: 1245620, name: "Elden Ring", playtime_forever: 5000, playtime_2weeks: 0 }
        ];
        ownedGamesCache.set(cacheKey, { data: mockGames, timestamp: Date.now() });
        return mockGames;
      }

      const url = `${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/?key=${this.apiKey}&steamid=${steamId}&format=json&include_appinfo=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Manejo básico de Rate Limiting (HTTP 429)
        if (response.status === 429) {
          console.error("[SteamService] Rate limit excedido (100,000 llamadas/día).");
        }
        throw new Error(`Error en Steam API: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Validación estricta con Zod
      const validatedData = SteamResponseSchema.parse(rawData);
      const games = validatedData.response.games || [];
      
      ownedGamesCache.set(cacheKey, { data: games, timestamp: Date.now() });
      return games;
      
    } catch (error) {
      console.error(`[SteamService] Error obteniendo juegos para ${steamId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene el perfil público del usuario (nombre y avatar)
   */
  public async getPlayerSummary(steamId: string) {
    try {
      if (this.apiKey === 'mock_steam_key') {
        return { personaname: 'Usuario Mock', avatarfull: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg' };
      }
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.response.players[0] || null;
    } catch (error) {
      console.error(`[SteamService] Error obteniendo perfil para ${steamId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene las ofertas destacadas actuales de la tienda de Steam
   */
  public async getSpecials(): Promise<any[]> {
    try {
      const response = await fetch(`${this.storeUrl}/featuredcategories/`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      // Combinamos varias categorías para tener un pool más grande de ofertas
      const allItems = [
        ...(data.specials?.items || []),
        ...(data.top_sellers?.items || []),
        ...(data.new_releases?.items || []),
        ...(data.under_ten?.items || [])
      ];
      
      // Filtramos duplicados y nos quedamos solo con los que tienen descuento
      const uniqueItems = new Map();
      allItems.forEach(item => {
        if (item.id && item.discount_percent > 0 && !uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, item);
        }
      });
      
      return Array.from(uniqueItems.values());
    } catch (error) {
      console.error(`[SteamService] Error obteniendo ofertas destacadas:`, error);
      return [];
    }
  }

  /**
   * Obtiene los precios actuales y descuentos desde la API pública de la tienda de Steam
   */
  public async getGamePrices(appIds: number[]): Promise<Record<number, SteamPriceOverview | null>> {
    if (appIds.length === 0) return {};

    const results: Record<number, SteamPriceOverview | null> = {};

    if (this.apiKey === 'mock_steam_key') {
      appIds.forEach(id => {
        results[id] = { currency: 'USD', initial: 3999, final: 1999, discount_percent: 50 };
      });
      return results;
    }

    // Procesamos en paralelo para no bloquear, pero limitamos a un batch pequeño
    // para no saturar el rate limit de la tienda de Steam (~200 req / 5 min)
    await Promise.all(appIds.map(async (appId) => {
      const cached = priceCache.get(appId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results[appId] = cached.data;
        return;
      }

      try {
        const response = await fetch(`${this.storeUrl}/appdetails?appids=${appId}&filters=price_overview`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data[appId]?.success && data[appId].data?.price_overview) {
          const parsed = SteamPriceOverviewSchema.parse(data[appId].data.price_overview);
          results[appId] = parsed;
          priceCache.set(appId, { data: parsed, timestamp: Date.now() });
        } else {
          results[appId] = null; // Juego gratuito o sin precio disponible
          priceCache.set(appId, { data: null, timestamp: Date.now() });
        }
      } catch (error) {
        console.error(`[SteamService] Error obteniendo precio para ${appId}:`, error);
        results[appId] = null;
      }
    }));

    return results;
  }
  /**
   * Obtiene los detalles de un juego, incluyendo géneros, desde la API de la tienda de Steam
   */
  public async getAppDetails(appIds: number[]): Promise<Record<number, any>> {
    if (appIds.length === 0) return {};

    const results: Record<number, any> = {};

    if (this.apiKey === 'mock_steam_key') {
      appIds.forEach(id => {
        results[id] = { genres: [{ description: 'Action' }, { description: 'RPG' }] };
      });
      return results;
    }

    // Procesamos en lotes para no saturar la API
    await Promise.all(appIds.map(async (appId) => {
      const cacheKey = `appdetails_${appId}`;
      const cached = appDetailsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL * 24) { // Cacheamos los detalles por más tiempo (24h)
        results[appId] = cached.data;
        return;
      }

      try {
        // Hacemos un pequeño retraso aleatorio para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const response = await fetch(`${this.storeUrl}/appdetails?appids=${appId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data[appId]?.success && data[appId].data) {
          results[appId] = data[appId].data;
          appDetailsCache.set(cacheKey, { data: data[appId].data, timestamp: Date.now() });
        } else {
          results[appId] = null;
          appDetailsCache.set(cacheKey, { data: null, timestamp: Date.now() });
        }
      } catch (error) {
        console.error(`[SteamService] Error obteniendo detalles para ${appId}:`, error);
        results[appId] = null;
      }
    }));

    return results;
  }
  /**
   * Obtiene logros de un usuario para un juego especifico
   */
  public async getPlayerAchievements(steamId: string, appId: number): Promise<PlayerAchievementStats | null> {
    try {
      if (this.apiKey === 'mock_steam_key') {
        return {
          appid: appId,
          gameName: `Game ${appId}`,
          totalAchievements: 50,
          unlockedAchievements: Math.floor(Math.random() * 50),
          completionPercent: Math.floor(Math.random() * 100),
        };
      }

      const response = await fetch(
        `${this.baseUrl}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${this.apiKey}&steamid=${steamId}`
      );
      if (!response.ok) return null;

      const data = await response.json();
      const stats = data?.playerstats;
      if (!stats?.success || !Array.isArray(stats.achievements)) return null;

      const total = stats.achievements.length;
      const unlocked = stats.achievements.filter((a: any) => a.achieved === 1).length;

      return {
        appid: appId,
        gameName: stats.gameName || `Game ${appId}`,
        totalAchievements: total,
        unlockedAchievements: unlocked,
        completionPercent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtiene logros del usuario para sus juegos mas jugados
   */
  public async getTopGamesAchievements(steamId: string, limit: number = 10): Promise<PlayerAchievementStats[]> {
    const ownedGames = await this.getOwnedGames(steamId);
    const topGames = ownedGames
      .filter(g => g.playtime_forever > 60)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, limit);

    const results: PlayerAchievementStats[] = [];
    for (const game of topGames) {
      const stats = await this.getPlayerAchievements(steamId, game.appid);
      if (stats && stats.totalAchievements > 0) {
        results.push({ ...stats, gameName: game.name || stats.gameName });
      }
    }

    return results.sort((a, b) => b.completionPercent - a.completionPercent);
  }

  /**
   * Obtiene la lista de amigos de un usuario
   */
  public async getFriendsList(steamId: string): Promise<string[]> {
    try {
      if (this.apiKey === 'mock_steam_key') {
        return ['76561198000000001', '76561198000000002', '76561198000000003'];
      }

      const response = await fetch(
        `${this.baseUrl}/ISteamUser/GetFriendList/v0001/?key=${this.apiKey}&steamid=${steamId}&relationship=friend`
      );
      if (!response.ok) return [];

      const data = await response.json();
      const friends = data?.friendslist?.friends;
      if (!Array.isArray(friends)) return [];

      return friends.map((f: any) => f.steamid).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Obtiene perfiles de amigos con sus estadisticas para comparacion
   */
  public async getFriendsProfiles(steamId: string, limit: number = 10): Promise<FriendProfile[]> {
    const friendIds = await this.getFriendsList(steamId);
    if (friendIds.length === 0) return [];

    const selectedIds = friendIds.slice(0, limit);

    if (this.apiKey === 'mock_steam_key') {
      return selectedIds.map((id, i) => ({
        steamId: id,
        personaname: `Friend ${i + 1}`,
        avatarfull: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        totalPlaytimeHours: Math.floor(Math.random() * 5000),
        gameCount: Math.floor(Math.random() * 300),
        topGame: ['Counter-Strike 2', 'Dota 2', 'PUBG', 'Elden Ring', 'Cyberpunk 2077'][i % 5],
      }));
    }

    // Get summaries for all friends in batch (up to 100 per call)
    const batchIds = selectedIds.join(',');
    const summaryUrl = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${batchIds}`;
    let profiles: any[] = [];
    try {
      const res = await fetch(summaryUrl);
      if (res.ok) {
        const data = await res.json();
        profiles = data?.response?.players || [];
      }
    } catch { /* continue with empty profiles */ }

    const results: FriendProfile[] = [];
    for (const profile of profiles) {
      const fid = profile.steamid;
      try {
        const games = await this.getOwnedGames(fid);
        const totalPlaytime = games.reduce((sum, g) => sum + g.playtime_forever, 0);
        const topGame = games.sort((a, b) => b.playtime_forever - a.playtime_forever)[0];

        results.push({
          steamId: fid,
          personaname: profile.personaname || 'Unknown',
          avatarfull: profile.avatarfull || '',
          totalPlaytimeHours: Math.round(totalPlaytime / 60),
          gameCount: games.length,
          topGame: topGame?.name,
        });
      } catch {
        results.push({
          steamId: fid,
          personaname: profile.personaname || 'Unknown',
          avatarfull: profile.avatarfull || '',
          totalPlaytimeHours: 0,
          gameCount: 0,
        });
      }
    }

    return results.sort((a, b) => b.totalPlaytimeHours - a.totalPlaytimeHours);
  }

  /**
   * Obtiene el top global de juegos mas jugados de Steam.
   */
  public async getMostPlayedGames(limit: number = 100): Promise<MostPlayedSteamGame[]> {
    try {
      if (this.apiKey === 'mock_steam_key') {
        return [
          { appid: 730, rank: 1, concurrent_in_game: 950000 },
          { appid: 570, rank: 2, concurrent_in_game: 680000 },
          { appid: 440, rank: 3, concurrent_in_game: 120000 },
          { appid: 271590, rank: 4, concurrent_in_game: 115000 },
          { appid: 1091500, rank: 5, concurrent_in_game: 87000 },
        ].slice(0, limit);
      }

      const cacheKey = `most_played_${limit}`;
      const cached = generalCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 1000 * 60 * 20) {
        return cached.data as MostPlayedSteamGame[];
      }

      const response = await fetch(
        `${this.baseUrl}/ISteamChartsService/GetMostPlayedGames/v1/?key=${this.apiKey}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const ranks = Array.isArray(data?.response?.ranks) ? data.response.ranks : [];
      const normalized = ranks
        .map((item: any): MostPlayedSteamGame | null => {
          if (typeof item?.appid !== 'number' || typeof item?.rank !== 'number') {
            return null;
          }
          return {
            appid: item.appid,
            rank: item.rank,
            concurrent_in_game:
              typeof item.concurrent_in_game === 'number'
                ? item.concurrent_in_game
                : undefined,
          };
        })
        .filter((item: MostPlayedSteamGame | null): item is MostPlayedSteamGame => item !== null)
        .slice(0, limit);

      generalCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      return normalized;
    } catch (error) {
      console.error(`[SteamService] Error obteniendo top de juegos mas jugados:`, error);
      return [];
    }
  }

  /**
   * Devuelve el top de Steam con titulo y generos normalizados para ranking.
   */
  public async getTopSteamGamesWithGenres(limit: number = 100): Promise<SteamTopGameWithGenres[]> {
    const topGames = await this.getMostPlayedGames(limit);
    if (topGames.length === 0) {
      return [];
    }

    const appIds = topGames.map((game) => game.appid);
    const detailsByAppId = await this.getAppDetails(appIds);

    return topGames.map((game) => {
      const details = detailsByAppId[game.appid];
      const title = details?.name || `App ${game.appid}`;
      const gameGenres = Array.isArray(details?.genres)
        ? details.genres
            .map((genre: any) => genre?.description)
            .filter((genre: unknown): genre is string => typeof genre === 'string')
        : [];

      return {
        appId: game.appid,
        title,
        gameGenres,
        concurrentPlayers: game.concurrent_in_game,
      };
    });
  }
}

export const steamService = new SteamService();
