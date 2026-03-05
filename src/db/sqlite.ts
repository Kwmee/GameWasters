import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

const isVercel = !!process.env.VERCEL;
const dbPath = isVercel
  ? "/tmp/gamewasters.db"
  : path.resolve(process.cwd(), config.SQLITE_DB_PATH);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashed_steam_id TEXT UNIQUE NOT NULL,
    steam_id_encrypted TEXT NOT NULL,
    username TEXT,
    steam_name TEXT,
    steam_avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UserGenreStats (
    hashed_steam_id TEXT NOT NULL,
    genre_name TEXT NOT NULL,
    playtime_hours INTEGER NOT NULL DEFAULT 0,
    games_count INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0 CHECK(percentage >= 0 AND percentage <= 100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hashed_steam_id, genre_name),
    FOREIGN KEY (hashed_steam_id) REFERENCES Users(hashed_steam_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Games (
    app_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    developer TEXT,
    publisher TEXT,
    release_date DATE,
    genres TEXT
);

CREATE TABLE IF NOT EXISTS OwnedGames (
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    playtime_forever INTEGER DEFAULT 0,
    playtime_2weeks INTEGER DEFAULT 0,
    last_played DATETIME,
    PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS Deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    current_price REAL,
    historical_low REAL,
    discount_percentage INTEGER,
    url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ownedgames_playtime ON OwnedGames(playtime_forever DESC);
CREATE INDEX IF NOT EXISTS idx_deals_discount ON Deals(discount_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON Users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_usergenrestats_updated ON UserGenreStats(updated_at DESC);
`;

export function initializeDatabase(): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  const userGenreStatsColumns = db
    .prepare("PRAGMA table_info(UserGenreStats)")
    .all() as Array<{ name: string }>;
  const hasGamesCount = userGenreStatsColumns.some(
    (column) => column.name === "games_count",
  );

  if (!hasGamesCount) {
    db.exec(
      "ALTER TABLE UserGenreStats ADD COLUMN games_count INTEGER NOT NULL DEFAULT 0",
    );
  }
}
