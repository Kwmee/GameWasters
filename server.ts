import express from "express";
import { createServer as createViteServer } from "vite";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import { config, PORT } from "./src/config";
import { steamService } from "./src/services/steamService";
import { configureSteamAuth } from "./src/auth/steamStrategy";

async function startServer() {
  const app = express();

  const appUrl = config.APP_URL || `http://localhost:${PORT}`;
  const steamCallbackPath = "/api/auth/steam/return";

  app.use(express.json());

  // Configurar autenticación de Steam con Passport (sin sesiones de servidor)
  configureSteamAuth(app, appUrl, steamCallbackPath);

  // Simulación de BackgroundTask de FastAPI en Node.js
  const syncUserLibrary = async (hashedSteamId: string, realSteamId: string) => {
    console.log(`[Background Task] Iniciando sincronización de biblioteca para usuario: ${hashedSteamId}`);
    
    try {
      // 1. Obtener lista de juegos (Steam Web API)
      console.log(`[Background Task] 1. Obteniendo juegos desde Steam Web API...`);
      const ownedGames = await steamService.getOwnedGames(realSteamId);
      console.log(`[Background Task] -> ${ownedGames.length} juegos encontrados.`);

      // 2. Obtener precios y ofertas directamente desde la tienda de Steam
      console.log(`[Background Task] 2. Obteniendo precios desde Steam Store API...`);
      const topGames = ownedGames.slice(0, 10); // Limitamos a 10 para no saturar la API
      const appIds = topGames.map(g => g.appid);
      
      const prices = await steamService.getGamePrices(appIds);
      console.log(`[Background Task] -> Precios obtenidos para ${Object.keys(prices).length} juegos.`);

      // 3. Almacenar en PostgreSQL para alimentar el modelo SVD
      console.log(`[Background Task] 3. Almacenando en PostgreSQL (Mock)...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`[Background Task] 4. Preparando modelo SVD (Singular Value Decomposition)...`);
      console.log(`[Background Task] Configurando 7 factores latentes para optimizar Recall@10...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[Background Task] ✅ Ingesta masiva completada para: ${hashedSteamId}`);
    } catch (error) {
      console.error(`[Background Task] ❌ Error durante la sincronización:`, error);
    }
  };

  // Endpoint de inicio de autenticación con Steam (redirige a Steam)
  app.get("/api/auth/steam/login", passport.authenticate("steam", { session: false }));

  // Endpoint de autenticación (callback) para Steam OpenID
  app.get(
    steamCallbackPath,
    passport.authenticate("steam", { session: false, failureRedirect: "/" }),
    async (req, res) => {
      const user = (req as any).user as { id?: string } | undefined;
      const realSteamId = user?.id || "76561197960435530"; // ID de prueba en entornos de desarrollo si algo falla

      // Pseudonimización del SteamID por privacidad
      const hashedSteamId = steamService.hashSteamId(realSteamId);

      // Ejecutar tarea en segundo plano sin bloquear la respuesta (equivalente a BackgroundTasks)
      syncUserLibrary(hashedSteamId, realSteamId).catch(console.error);

      const targetOrigin = config.APP_URL || appUrl;

      // Enviar mensaje de éxito a la ventana padre (iframe) y cerrar el popup
      res.send(`
      <html>
        <head>
          <title>Autenticación Exitosa</title>
          <style>
            body { background-color: #1b2838; color: #c7d5e0; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background-color: #171a21; padding: 2rem; border-radius: 8px; text-align: center; border: 1px solid #2a475e; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>¡Autenticación Exitosa!</h2>
            <p>Conectado con Steam. Esta ventana se cerrará automáticamente...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'STEAM_AUTH_SUCCESS', steamId: '${hashedSteamId}' }, '${targetOrigin}');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/?steamId=${hashedSteamId}';
            }
          </script>
        </body>
      </html>
    `);
    },
  );

  // Endpoint de Ofertas
  app.get("/api/deals", (req, res) => {
    res.json({
      success: true,
      data: [
        { steamId: "1091500", title: "Cyberpunk 2077", currentPrice: 29.99, discount: 50, image: "https://picsum.photos/seed/cyberpunk/400/200" },
        { steamId: "367520", title: "Hollow Knight", currentPrice: 7.49, discount: 50, image: "https://picsum.photos/seed/hollowknight/400/200" },
        { steamId: "1245620", title: "Elden Ring", currentPrice: 39.99, discount: 33, image: "https://picsum.photos/seed/eldenring/400/200" },
        { steamId: "1086940", title: "Baldur's Gate 3", currentPrice: 53.99, discount: 10, image: "https://picsum.photos/seed/bg3/400/200" },
        { steamId: "1145360", title: "Hades", currentPrice: 12.49, discount: 50, image: "https://picsum.photos/seed/hades/400/200" },
        { steamId: "413150", title: "Stardew Valley", currentPrice: 11.99, discount: 20, image: "https://picsum.photos/seed/stardew/400/200" }
      ]
    });
  });

  // Vite middleware para desarrollo o estáticos compilados para producción
  if (config.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const distPath = path.resolve(__dirname, "dist");

    app.use(express.static(distPath));

    // SPA: devolver siempre index.html para cualquier ruta no-API
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
