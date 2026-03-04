-- Fase 1: Esquema de Base de Datos para Recomendación de Juegos (PostgreSQL)

-- Tabla de Usuarios (Persons)
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    steam_id VARCHAR(255) UNIQUE NOT NULL, -- Pseudonimizado/Hasheado en la aplicación si es necesario
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Tabla de Juegos (Areas/Roads adaptado)
CREATE TABLE Games (
    app_id INTEGER PRIMARY KEY, -- Steam App ID
    title VARCHAR(255) NOT NULL,
    developer VARCHAR(255),
    publisher VARCHAR(255),
    release_date DATE,
    genres TEXT[]
);

-- Tabla de Bibliotecas / Tiempo de Juego (Interacciones para el Filtrado Colaborativo)
CREATE TABLE OwnedGames (
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    playtime_forever INTEGER DEFAULT 0, -- Métrica implícita principal para el SVD
    playtime_2weeks INTEGER DEFAULT 0,
    last_played TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

-- Tabla de Ofertas (IsThereAnyDeal data)
CREATE TABLE Deals (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES Games(app_id) ON DELETE CASCADE,
    current_price DECIMAL(10, 2),
    historical_low DECIMAL(10, 2),
    discount_percentage INTEGER,
    url VARCHAR(512),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar las consultas del sistema de recomendación
CREATE INDEX idx_ownedgames_playtime ON OwnedGames(playtime_forever DESC);
CREATE INDEX idx_deals_discount ON Deals(discount_percentage DESC);
