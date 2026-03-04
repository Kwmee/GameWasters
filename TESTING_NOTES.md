## Tests recomendados

- **Config (`src/config.ts`)**
  - Verificar que en `NODE_ENV=production` sin `STEAM_API_KEY`/`APP_URL` la aplicación lanza un error al inicializar la configuración.
  - Verificar que en `NODE_ENV=development` sin variables obligatorias se usan valores mock y no crashea.

- **SteamService (`src/services/steamService.ts`)**
  - `hashSteamId` devuelve siempre el mismo hash para el mismo `steamId` y nunca devuelve el `steamId` original.
  - `getOwnedGames` con `STEAM_API_KEY=mock_steam_key` devuelve los juegos mock y respeta el caché (segunda llamada no debería disparar una petición real).
  - `getGamePrices` con `STEAM_API_KEY=mock_steam_key` devuelve precios mock y usa correctamente la caché.

- **Store (`src/store/useStore.ts`)**
  - `login` marca `isAuthenticated=true` y guarda `hashedSteamId`.
  - `logout` limpia autenticación y ofertas.
  - `setDeals` actualiza el array de `deals`.

> Nota: Actualmente no hay runner de tests configurado (Jest/Vitest). El siguiente paso sería elegir uno e implementar estos casos como tests automatizados.

