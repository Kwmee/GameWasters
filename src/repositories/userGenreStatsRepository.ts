import { db } from "../db/sqlite";

export interface UserGenreStatInput {
  name: string;
  playtime: number;
  gamesCount: number;
  percentage: number;
}

const replaceUserGenreStatsTx = db.transaction(
  (hashedSteamId: string, stats: UserGenreStatInput[]) => {
    db.prepare("DELETE FROM UserGenreStats WHERE hashed_steam_id = ?").run(hashedSteamId);

    const upsertStmt = db.prepare(`
      INSERT INTO UserGenreStats (
        hashed_steam_id,
        genre_name,
        playtime_hours,
        games_count,
        percentage,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(hashed_steam_id, genre_name)
      DO UPDATE SET
        playtime_hours = excluded.playtime_hours,
        games_count = excluded.games_count,
        percentage = excluded.percentage,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const stat of stats) {
      upsertStmt.run(
        hashedSteamId,
        stat.name,
        Math.max(0, Math.round(stat.playtime)),
        Math.max(0, Math.round(stat.gamesCount)),
        Math.max(0, Math.min(100, Math.round(stat.percentage))),
      );
    }
  },
);

export function upsertUserGenreStats(
  hashedSteamId: string,
  stats: UserGenreStatInput[],
): void {
  replaceUserGenreStatsTx(hashedSteamId, stats);
}
