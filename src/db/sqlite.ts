import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

const dbPath = path.resolve(process.cwd(), config.SQLITE_DB_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initializeDatabase(): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);

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
