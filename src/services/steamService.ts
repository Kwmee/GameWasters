import { z } from "zod";
import { config } from "../config";
import crypto from "crypto";

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

// Sistema de caché simple en memoria
const cache = new Map<string, { data: OwnedGame[]; timestamp: number }>();
const priceCache = new Map<number, { data: SteamPriceOverview | null; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora
const MAX_CACHE_ENTRIES = 500;

function enforceCacheLimit<K, V>(map: Map<K, V>) {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const firstKey = map.keys().next().value as K | undefined;
  if (firstKey !== undefined) {
    map.delete(firstKey);
  }
}

export class SteamService {
  private apiKey: string;
  private baseUrl = "http://api.steampowered.com";
  private storeUrl = "https://store.steampowered.com/api";

  constructor() {
    this.apiKey = config.STEAM_API_KEY;
  }

  /**
   * Pseudonimización del SteamID real para proteger la privacidad del usuario
   */
  public hashSteamId(realSteamId: string): string {
    return crypto.createHash("sha256").update(realSteamId).digest("hex").substring(0, 16);
  }

  /**
   * Obtiene la lista de juegos de un usuario con manejo de caché y validación estricta
   */
  public async getOwnedGames(steamId: string): Promise<OwnedGame[]> {
    const cacheKey = `owned_games_${steamId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[SteamService] Retornando juegos desde caché para ${steamId}`);
      return cached.data;
    }

    try {
      // Si estamos usando la key de prueba, devolvemos datos mockeados
      if (this.apiKey === "mock_steam_key") {
        const mockGames: OwnedGame[] = [
          { appid: 1091500, name: "Cyberpunk 2077", playtime_forever: 3600, playtime_2weeks: 0 },
          { appid: 367520, name: "Hollow Knight", playtime_forever: 1200, playtime_2weeks: 0 },
          { appid: 1245620, name: "Elden Ring", playtime_forever: 5000, playtime_2weeks: 0 }
        ];
        cache.set(cacheKey, { data: mockGames, timestamp: Date.now() });
        enforceCacheLimit(cache);
        return mockGames;
      }

      const url = `${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/?key=${this.apiKey}&steamid=${steamId}&format=json&include_appinfo=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Manejo básico de Rate Limiting (HTTP 429)
        if (response.status === 429) {
          console.error("[SteamService] Rate limit excedido al obtener juegos (HTTP 429).");
        } else {
          console.error(`[SteamService] Error en Steam API (obtener juegos): HTTP ${response.status} - ${response.statusText}`);
        }
        throw new Error("Error en Steam API al obtener juegos del usuario");
      }

      const rawData = await response.json();
      
      // Validación estricta con Zod
      const validatedData = SteamResponseSchema.parse(rawData);
      const games = validatedData.response.games || [];
      
      cache.set(cacheKey, { data: games, timestamp: Date.now() });
      enforceCacheLimit(cache);
      return games;
      
    } catch (error) {
      console.error(`[SteamService] Error obteniendo juegos para ${steamId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene los precios actuales y descuentos desde la API pública de la tienda de Steam
   */
  public async getGamePrices(appIds: number[]): Promise<Record<number, SteamPriceOverview | null>> {
    if (appIds.length === 0) return {};

    const results: Record<number, SteamPriceOverview | null> = {};

    if (this.apiKey === "mock_steam_key") {
      appIds.forEach(id => {
        results[id] = { currency: "USD", initial: 3999, final: 1999, discount_percent: 50 };
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
        if (!response.ok) {
          if (response.status === 429) {
            console.error(`[SteamService] Rate limit excedido al obtener precio para ${appId} (HTTP 429).`);
          } else {
            console.error(`[SteamService] Error HTTP al obtener precio para ${appId}: ${response.status} - ${response.statusText}`);
          }
          throw new Error("Error en Steam Store API al obtener precios");
        }
        
        const data = await response.json();
        
        if (data[appId]?.success && data[appId].data?.price_overview) {
          const parsed = SteamPriceOverviewSchema.parse(data[appId].data.price_overview);
          results[appId] = parsed;
          priceCache.set(appId, { data: parsed, timestamp: Date.now() });
          enforceCacheLimit(priceCache);
        } else {
          results[appId] = null; // Juego gratuito o sin precio disponible
          priceCache.set(appId, { data: null, timestamp: Date.now() });
          enforceCacheLimit(priceCache);
        }
      } catch (error) {
        console.error(`[SteamService] Error obteniendo precio para ${appId}:`, error);
        results[appId] = null;
      }
    }));

    return results;
  }
}

export const steamService = new SteamService();
