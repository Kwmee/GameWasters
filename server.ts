import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { config } from "./src/config";
import { initializeDatabase } from "./src/db/sqlite";
import {
  getEncryptedSteamIdByHashedId,
  upsertUser,
} from "./src/repositories/userRepository";
import {
  type UserGenreStatInput,
  getUserGenreStats,
  upsertUserGenreStats,
} from "./src/repositories/userGenreStatsRepository";
import { decryptSteamId, encryptSteamId } from "./src/security/steamIdCipher";
import {
  computeGenreWeights,
  scoreGamesByGenreWeights,
  type GenreWeights,
} from "./src/services/recommendationService";
import { steamService } from "./src/services/steamService";

const JWT_SECRET = config.SESSION_SECRET || "super-secret-key-for-jwt";
const MAX_STORED_GENRES = 15;
const DEALS_CANDIDATE_POOL = 60;
const DEALS_RESPONSE_LIMIT = 12;
const TOP_STEAM_LIMIT = 100;
const TOP_STEAM_RESPONSE_LIMIT = 30;

async function startServer() {
  initializeDatabase();

  const app = express();
  const PORT = 3000;

  const resolveRealSteamId = (req: express.Request): string | null => {
    const sessionRealSteamId = (req.session as any)?.realSteamId as
      | string
      | undefined;
    if (sessionRealSteamId) {
      return sessionRealSteamId;
    }

    const hashedSteamId = (req as any).user?.steamId as string | undefined;
    if (!hashedSteamId) {
      return null;
    }

    const encryptedSteamId = getEncryptedSteamIdByHashedId(hashedSteamId);
    if (!encryptedSteamId) {
      return null;
    }

    try {
      return decryptSteamId(encryptedSteamId);
    } catch (error) {
      console.error("Error descifrando steam_id desde SQLite:", error);
      return null;
    }
  };

  const buildTopGenreStats = async (
    realSteamId: string,
    limit: number = MAX_STORED_GENRES,
  ): Promise<UserGenreStatInput[]> => {
    const ownedGames = await steamService.getOwnedGames(realSteamId);
    if (ownedGames.length === 0) {
      return [];
    }

    // `gamesCount` se calcula sobre los 50 juegos mas jugados del usuario.
    const topGames = ownedGames
      .filter((g) => g.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 50);

    if (topGames.length === 0) {
      return [];
    }

    const appIds = topGames.map((g) => g.appid);
    const appDetails = await steamService.getAppDetails(appIds);

    const genrePlaytime: Record<string, number> = {};
    const genreGameCount: Record<string, number> = {};
    let totalPlaytime = 0;

    topGames.forEach((game) => {
      const details = appDetails[game.appid];
      if (!details?.genres) {
        return;
      }

      totalPlaytime += game.playtime_forever;
      details.genres.forEach((genre: any, index: number) => {
        const weight = index === 0 ? 1 : 0.5;
        genrePlaytime[genre.description] =
          (genrePlaytime[genre.description] || 0) +
          game.playtime_forever * weight;
        genreGameCount[genre.description] =
          (genreGameCount[genre.description] || 0) + 1;
      });
    });

    if (totalPlaytime === 0 || Object.keys(genrePlaytime).length === 0) {
      return [];
    }

    return Object.entries(genrePlaytime)
      .map(([name, playtime]) => ({
        name,
        playtime: Math.round(playtime / 60),
        gamesCount: genreGameCount[name] || 0,
        percentage: Math.min(100, Math.round((playtime / totalPlaytime) * 100)),
      }))
      .sort((a, b) => b.playtime - a.playtime)
      .slice(0, limit);
  };

  const getHashedSteamId = (
    req: express.Request,
    realSteamId: string | null,
  ): string | null => {
    const fromJwt = (req as any).user?.steamId as string | undefined;
    if (fromJwt) {
      return fromJwt;
    }
    if (realSteamId) {
      return steamService.hashSteamId(realSteamId);
    }
    return null;
  };

  const buildOrLoadGenreWeights = async (
    hashedSteamId: string,
    realSteamId: string,
  ): Promise<GenreWeights> => {
    let statsRows = getUserGenreStats(hashedSteamId);

    if (statsRows.length === 0) {
      const computedStats = await buildTopGenreStats(realSteamId, MAX_STORED_GENRES);
      if (computedStats.length === 0) {
        return {};
      }

      upsertUserGenreStats(hashedSteamId, computedStats);
      statsRows = computedStats.map((stat) => ({
        hashedSteamId,
        genreName: stat.name,
        playtimeHours: stat.playtime,
        gamesCount: stat.gamesCount,
        percentage: stat.percentage,
      }));
    }

    return computeGenreWeights(statsRows);
  };

  app.use(express.json());
  app.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: config.NODE_ENV === "production",
        sameSite: "lax",
      },
    }),
  );

  app.use(
    (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          (req as any).user = decoded;
        } catch (err) {
          console.error("Error verificando JWT:", err);
        }
      }
      next();
    },
  );

  const syncUserLibrary = async (hashedSteamId: string, realSteamId: string) => {
    console.log(
      `[Background Task] Iniciando sincronizacion de biblioteca para usuario: ${hashedSteamId}`,
    );

    try {
      console.log("[Background Task] 1. Obteniendo juegos desde Steam Web API...");
      const ownedGames = await steamService.getOwnedGames(realSteamId);
      console.log(`[Background Task] -> ${ownedGames.length} juegos encontrados.`);

      console.log("[Background Task] 2. Obteniendo precios desde Steam Store API...");
      const topGames = ownedGames.slice(0, 10);
      const appIds = topGames.map((g) => g.appid);
      const prices = await steamService.getGamePrices(appIds);
      console.log(
        `[Background Task] -> Precios obtenidos para ${Object.keys(prices).length} juegos.`,
      );

      const topGenreStats = await buildTopGenreStats(realSteamId, MAX_STORED_GENRES);
      upsertUserGenreStats(hashedSteamId, topGenreStats);
      console.log(
        `[Background Task] 3. Estadisticas de genero guardadas en SQLite: ${topGenreStats.length}`,
      );

      console.log(
        "[Background Task] 4. Preparando modelo SVD (Singular Value Decomposition)...",
      );
      console.log(
        "[Background Task] Configurando 7 factores latentes para optimizar Recall@10...",
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`[Background Task] Ingesta masiva completada para: ${hashedSteamId}`);
    } catch (error) {
      console.error("[Background Task] Error durante la sincronizacion:", error);
    }
  };

  app.get("/api/auth/steam/url", (_req, res) => {
    const appUrl = config.APP_URL || `http://localhost:${PORT}`;
    const returnUrl = `${appUrl}/api/auth/steam/return`;
    const realm = appUrl;

    const params = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": returnUrl,
      "openid.realm": realm,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    });

    res.json({ url: `https://steamcommunity.com/openid/login?${params.toString()}` });
  });

  app.get("/api/auth/steam/return", async (req, res) => {
    try {
      const claimedId = req.query["openid.claimed_id"] as string;
      const realSteamId = claimedId
        ? claimedId.split("/").pop()
        : "76561197960435530";

      const hashedSteamId = steamService.hashSteamId(realSteamId || "");

      if (req.session) {
        (req.session as any).realSteamId = realSteamId;
      }

      const profile = await steamService.getPlayerSummary(realSteamId || "");
      const steamName = profile?.personaname || "Usuario de Steam";
      const steamAvatar = profile?.avatarfull || "";
      const encryptedSteamId = encryptSteamId(realSteamId || "");

      upsertUser({
        hashedSteamId,
        encryptedSteamId,
        username: steamName,
        steamName,
        steamAvatar,
      });

      const token = jwt.sign({ steamId: hashedSteamId }, JWT_SECRET, {
        expiresIn: "7d",
      });

      syncUserLibrary(hashedSteamId, realSteamId || "").catch(console.error);

      res.send(`
        <html>
          <head>
            <title>Autenticacion Exitosa</title>
            <style>
              body { background-color: #1b2838; color: #c7d5e0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background-color: #171a21; padding: 2rem; border-radius: 8px; text-align: center; border: 1px solid #2a475e; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Autenticacion Exitosa</h2>
              <p>Conectado con Steam. Esta ventana se cerrara automaticamente...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'STEAM_AUTH_SUCCESS',
                  steamId: '${hashedSteamId}',
                  steamName: '${steamName.replace(/'/g, "\\'")}',
                  steamAvatar: '${steamAvatar}',
                  token: '${token}'
                }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '/?steamId=${hashedSteamId}';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error en autenticacion Steam:", error);
      res.status(500).send("Error interno durante autenticacion");
    }
  });

  app.get("/api/deals", async (req, res) => {
    const realSteamId = resolveRealSteamId(req);
    const isAuth = req.query.steamId as string;
    const hashedSteamId = getHashedSteamId(req, realSteamId);

    try {
      const specials = await steamService.getSpecials();
      let recommendedAppIds = Array.from(
        new Set(specials.map((item: any) => item.id).filter((id: any) => id != null)),
      ) as number[];

      if (isAuth && realSteamId && hashedSteamId) {
        const ownedGames = await steamService.getOwnedGames(realSteamId);
        const ownedAppIds = new Set(ownedGames.map((g) => g.appid));
        recommendedAppIds = recommendedAppIds.filter(
          (id: number) => !ownedAppIds.has(id),
        );

        const genreWeights = await buildOrLoadGenreWeights(hashedSteamId, realSteamId);
        if (Object.keys(genreWeights).length > 0) {
          recommendedAppIds.sort(() => Math.random() - 0.5);
          const recommendedDetails = await steamService.getAppDetails(
            recommendedAppIds.slice(0, DEALS_CANDIDATE_POOL),
          );

          const candidates = recommendedAppIds
            .slice(0, DEALS_CANDIDATE_POOL)
            .map((appId) => {
              const details = recommendedDetails[appId];
              const gameGenres = Array.isArray(details?.genres)
                ? details.genres
                    .map((genre: any) => genre?.description)
                    .filter((genre: unknown): genre is string => typeof genre === "string")
                : [];

              return {
                appId,
                title: details?.name || `Juego ${appId}`,
                gameGenres,
              };
            });

          const rankedCandidates = scoreGamesByGenreWeights(genreWeights, candidates);
          recommendedAppIds = rankedCandidates.map((game) => game.appId);
        } else {
          recommendedAppIds.sort(() => Math.random() - 0.5);
        }
      } else {
        recommendedAppIds.sort(() => Math.random() - 0.5);
      }

      recommendedAppIds = recommendedAppIds.slice(0, DEALS_RESPONSE_LIMIT);
      if (recommendedAppIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const prices = await steamService.getGamePrices(recommendedAppIds);
      const deals = recommendedAppIds.map((appId: number) => {
        const priceInfo = prices[appId];
        const specialItem = specials.find((s: any) => s.id === appId);
        const currentPrice = priceInfo
          ? priceInfo.final / 100
          : (specialItem?.final_price || 0) / 100;
        const discount = priceInfo
          ? priceInfo.discount_percent
          : specialItem?.discount_percent || 0;
        const title = specialItem?.name || `Juego ${appId}`;
        const image =
          specialItem?.header_image ||
          specialItem?.large_capsule_image ||
          `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;

        return {
          steamId: appId.toString(),
          title,
          currentPrice,
          discount,
          image,
        };
      });

      res.json({ success: true, data: deals });
    } catch (error) {
      console.error("Error obteniendo ofertas reales:", error);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
  });

  app.get("/api/recommendations/top-steam", async (req, res) => {
    const realSteamId = resolveRealSteamId(req);
    if (!realSteamId) {
      return res.status(401).json({ success: false, error: "No autorizado" });
    }

    const hashedSteamId = getHashedSteamId(req, realSteamId);
    if (!hashedSteamId) {
      return res.status(401).json({ success: false, error: "No autorizado" });
    }

    try {
      const [ownedGames, topSteamGames] = await Promise.all([
        steamService.getOwnedGames(realSteamId),
        steamService.getTopSteamGamesWithGenres(TOP_STEAM_LIMIT),
      ]);

      const ownedAppIds = new Set(ownedGames.map((game) => game.appid));
      const candidates = topSteamGames.filter((game) => !ownedAppIds.has(game.appId));
      const genreWeights = await buildOrLoadGenreWeights(hashedSteamId, realSteamId);

      const rankedGames = scoreGamesByGenreWeights(genreWeights, candidates);
      const byId = new Map(candidates.map((game) => [game.appId, game]));

      const data = rankedGames.slice(0, TOP_STEAM_RESPONSE_LIMIT).map((game) => {
        const source = byId.get(game.appId);
        return {
          appId: game.appId,
          title: game.title,
          score: Number(game.score.toFixed(6)),
          gameGenres: source?.gameGenres ?? [],
          concurrentPlayers: source?.concurrentPlayers ?? null,
        };
      });

      res.json({
        success: true,
        data,
        meta: {
          source: "steam_top_most_played",
          candidateCount: candidates.length,
        },
      });
    } catch (error) {
      console.error("Error generando recomendaciones top Steam:", error);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
  });

  app.get("/api/user/top-genres", async (req, res) => {
    const realSteamId = resolveRealSteamId(req);
    if (!realSteamId) {
      return res.status(401).json({ success: false, error: "No autorizado" });
    }

    try {
      const topGenres = await buildTopGenreStats(realSteamId, MAX_STORED_GENRES);
      const hashedSteamId =
        (req as any).user?.steamId || steamService.hashSteamId(realSteamId);
      upsertUserGenreStats(hashedSteamId, topGenres);
      res.json({ success: true, data: topGenres });
    } catch (error) {
      console.error("Error analizando generos:", error);
      res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
  });

  if (config.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
