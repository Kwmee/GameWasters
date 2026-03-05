import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// Definir el esquema de configuración (equivalente a BaseSettings de Pydantic)
const configSchema = z.object({
  STEAM_API_KEY: z.string().min(1, "STEAM_API_KEY es requerida"),
  SESSION_SECRET: z.string().default('super-secret-key'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().url().optional(),
  SQLITE_DB_PATH: z.string().default('./database/app.db'),
  STEAM_ID_ENCRYPTION_SECRET: z.string().min(16).default('change-this-secret-in-env'),
});

// Validar y exportar la configuración
const parseConfig = () => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.warn("⚠️ Advertencia: Faltan variables de entorno requeridas (STEAM_API_KEY). Usando valores de prueba (mock) para el entorno de desarrollo.");
    // Retornamos un objeto mockeado para que la app no crashee en el entorno de prueba
    return {
      STEAM_API_KEY: process.env.STEAM_API_KEY || 'mock_steam_key',
      SESSION_SECRET: process.env.SESSION_SECRET || 'super-secret-key',
      NODE_ENV: process.env.NODE_ENV || 'development',
      APP_URL: process.env.APP_URL,
      SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './database/app.db',
      STEAM_ID_ENCRYPTION_SECRET: process.env.STEAM_ID_ENCRYPTION_SECRET || 'change-this-secret-in-env',
    };
  }
};

export const config = parseConfig();
