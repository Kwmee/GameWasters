import { db } from "../db/sqlite.js";

export interface UpsertUserInput {
  hashedSteamId: string;
  encryptedSteamId: string;
  username: string | null;
  steamName: string | null;
  steamAvatar: string | null;
}

export function upsertUser(input: UpsertUserInput): void {
  const upsertUserStmt = db.prepare(`
    INSERT INTO Users (
      hashed_steam_id,
      steam_id_encrypted,
      username,
      steam_name,
      steam_avatar,
      last_login
    )
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(hashed_steam_id)
    DO UPDATE SET
      steam_id_encrypted = excluded.steam_id_encrypted,
      username = excluded.username,
      steam_name = excluded.steam_name,
      steam_avatar = excluded.steam_avatar,
      last_login = CURRENT_TIMESTAMP
  `);

  upsertUserStmt.run(
    input.hashedSteamId,
    input.encryptedSteamId,
    input.username,
    input.steamName,
    input.steamAvatar,
  );
}

export function getEncryptedSteamIdByHashedId(hashedSteamId: string): string | null {
  const row = db
    .prepare("SELECT steam_id_encrypted FROM Users WHERE hashed_steam_id = ?")
    .get(hashedSteamId) as { steam_id_encrypted?: string } | undefined;

  return row?.steam_id_encrypted ?? null;
}
