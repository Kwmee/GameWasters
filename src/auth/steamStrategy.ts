import passport from "passport";
import SteamStrategy from "@fabiansharp/modern-passport-steam";
import type { Express } from "express";
import { config } from "../config";

export function configureSteamAuth(app: Express, appUrl: string, callbackPath: string) {
  passport.use(
    new SteamStrategy(
      {
        returnUrl: `${appUrl}${callbackPath}`,
        realm: appUrl,
        fetchUserProfile: false,
        apiKey: () => config.STEAM_API_KEY,
      },
      // When fetchUserProfile is false, first argument is a SteamID instance
      (steamId, done) => {
        try {
          // We only need the 64-bit SteamID string
          const user = { id: steamId.getSteamID64() };
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );

  app.use(passport.initialize());
}

