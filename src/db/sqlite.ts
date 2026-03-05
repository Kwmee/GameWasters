import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

let _db: Database.Database | null = null;
let _initialized = false;

function getDbPath(): string {
  return path.resolve(process.cwd(), config.SQLITE_DB_PATH);
}

function ensureDb(): Database.Database {
  if (_db) return _db;

  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  _db = new Database(dbPath);
  return _db;
}

export function initializeDatabase(): void {
  if (_initialized) return;
  const database = ensureDb();
  _initialized = true;

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  database.exec(schema);

  const userGenreStatsColumns = database
    .prepare("PRAGMA table_info(UserGenreStats)")
    .all() as Array<{ name: string }>;
  const hasGamesCount = userGenreStatsColumns.some(
    (column) => column.name === "games_count",
  );

  if (!hasGamesCount) {
    database.exec(
      "ALTER TABLE UserGenreStats ADD COLUMN games_count INTEGER NOT NULL DEFAULT 0",
    );
  }
}

/** Obtiene la instancia de la base de datos (inicializa en el primer uso). */
export function getDb(): Database.Database {
  initializeDatabase();
  return ensureDb();
}

/** Proxy para compatibilidad: código que usa `db.prepare()` sigue funcionando sin tocar la DB hasta el primer uso. */
export const db = new Proxy({} as Database.Database, {
  get(_, prop: string) {
    return (getDb() as unknown as Record<string, unknown>)[prop];
  },
});
