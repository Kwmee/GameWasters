-- Fase 1: Esquema de Base de Datos para Recomendacion de Juegos (SQLite)
PRAGMA foreign_keys = ON;

-- Tabla de Usuarios
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

-- Tabla de Juegos
CREATE TABLE IF NOT EXISTS Games (
    app_id INTEGER PRIMARY KEY, -- Steam App ID
    title TEXT NOT NULL,
    developer TEXT,
    publisher TEXT,
    release_date DATE,
    genres TEXT -- JSON string con el array de generos
);

-- Tabla de Bibliotecas / Tiempo de Juego
CREATE TABLE IF NOT EXISTS OwnedGames (
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    playtime_forever INTEGER DEFAULT 0,
    playtime_2weeks INTEGER DEFAULT 0,
    last_played DATETIME,
    PRIMARY KEY (user_id, game_id)
);

-- Tabla de Ofertas
CREATE TABLE IF NOT EXISTS Deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    current_price REAL,
    historical_low REAL,
    discount_percentage INTEGER,
    url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ownedgames_playtime ON OwnedGames(playtime_forever DESC);
CREATE INDEX IF NOT EXISTS idx_deals_discount ON Deals(discount_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON Users(last_login DESC);
