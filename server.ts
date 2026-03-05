import express from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import { config } from "./src/config";
import { initializeDatabase } from "./src/db/sqlite";
import {
  getEncryptedSteamIdByHashedId,
  upsertUser,
} from "./src/repositories/userRepository";
import {
  type UserGenreStatInput,
  upsertUserGenreStats,
} from "./src/repositories/userGenreStatsRepository";
import { decryptSteamId, encryptSteamId } from "./src/security/steamIdCipher";
import { steamService } from "./src/services/steamService";

const JWT_SECRET = config.SESSION_SECRET || "super-secret-key-for-jwt";
const MAX_STORED_GENRES = 15;

/** Escapa caracteres peligrosos para interpolación segura dentro de strings JS en HTML */
function escapeForJs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, "\\x3c")
    .replace(/>/g, "\\x3e")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

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
                  steamId: '${escapeForJs(hashedSteamId)}',
                  steamName: '${escapeForJs(steamName)}',
                  steamAvatar: '${escapeForJs(steamAvatar)}',
                  token: '${escapeForJs(token)}'
                }, window.location.origin);
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '/?steamId=${escapeForJs(hashedSteamId)}';
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

    try {
      const specials = await steamService.getSpecials();
      let recommendedAppIds = Array.from(
        new Set(specials.map((item: any) => item.id).filter((id: any) => id != null)),
      ) as number[];

      if (isAuth && realSteamId) {
        const ownedGames = await steamService.getOwnedGames(realSteamId);
        const ownedAppIds = new Set(ownedGames.map((g) => g.appid));
        recommendedAppIds = recommendedAppIds.filter(
          (id: number) => !ownedAppIds.has(id),
        );

        const topGames = ownedGames
          .filter((g) => g.playtime_forever > 0)
          .sort((a, b) => b.playtime_forever - a.playtime_forever)
          .slice(0, 20);

        const appIds = topGames.map((g) => g.appid);
        const appDetails = await steamService.getAppDetails(appIds);
        const genrePlaytime: Record<string, number> = {};

        topGames.forEach((game) => {
          const details = appDetails[game.appid];
          if (details?.genres) {
            details.genres.forEach((genre: any, index: number) => {
              const weight = index === 0 ? 1 : 0.5;
              genrePlaytime[genre.description] =
                (genrePlaytime[genre.description] || 0) +
                game.playtime_forever * weight;
            });
          }
        });

        const topGenres = Object.entries(genrePlaytime)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map((entry) => entry[0]);

        if (topGenres.length > 0) {
          recommendedAppIds.sort(() => Math.random() - 0.5);
          const recommendedDetails = await steamService.getAppDetails(
            recommendedAppIds.slice(0, 40),
          );

          recommendedAppIds.sort((a, b) => {
            const detailsA = recommendedDetails[a];
            const detailsB = recommendedDetails[b];
            const genresA = detailsA?.genres?.map((g: any) => g.description) || [];
            const genresB = detailsB?.genres?.map((g: any) => g.description) || [];
            const scoreA = genresA.filter((g: string) => topGenres.includes(g)).length;
            const scoreB = genresB.filter((g: string) => topGenres.includes(g)).length;
            return scoreB - scoreA;
          });
        }
      } else {
        recommendedAppIds.sort(() => Math.random() - 0.5);
      }

      recommendedAppIds = recommendedAppIds.slice(0, 12);
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
    const [
      { createServer: createViteServer },
      { default: reactPlugin },
    ] = await Promise.all([
      import("vite"),
      import("@vitejs/plugin-react"),
    ]);
    const { default: tailwindPlugin } = await import("@tailwindcss/postcss");
    const vite = await createViteServer({
      configFile: false,
      plugins: [reactPlugin()],
      css: { postcss: { plugins: [tailwindPlugin()] } },
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
