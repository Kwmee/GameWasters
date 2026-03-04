import { z } from "zod";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Definir el esquema de configuración (equivalente a BaseSettings de Pydantic)
const configSchema = z.object({
  STEAM_API_KEY: z.string().min(1, "STEAM_API_KEY es requerida"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z
    .string()
    .optional()
    .refine((val) => !val || isValidUrl(val), {
      message: "APP_URL debe ser una URL válida",
    }),
});

// Validar y exportar la configuración
const parseConfig = () => {
  const env = process.env;

  try {
    const parsed = configSchema.parse(env);

    if (parsed.NODE_ENV === "production") {
      if (!parsed.APP_URL) {
        throw new Error("APP_URL es requerida en entorno de producción");
      }
    }

    return parsed;
  } catch (error) {
    const nodeEnv = env.NODE_ENV || "development";

    if (nodeEnv === "production") {
      throw new Error(
        "Configuración inválida en producción. Revisa STEAM_API_KEY y APP_URL en las variables de entorno.",
      );
    }

    console.warn(
      "⚠️ Advertencia: Configuración incompleta. Usando valores de prueba (mock) para el entorno de desarrollo.",
    );

    // Entorno no productivo: devolvemos un objeto mockeado para que la app no crashee
    return {
      STEAM_API_KEY: env.STEAM_API_KEY || "mock_steam_key",
      NODE_ENV: nodeEnv as "development" | "production" | "test",
      APP_URL: env.APP_URL,
    };
  }
};

export const config = parseConfig();
export const PORT = Number(process.env.PORT) || 3000;
