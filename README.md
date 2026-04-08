# GameWasters

Plataforma web para analizar perfiles de Steam y generar recomendaciones de juegos con base en habitos de juego y generos preferidos.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Express (en `api/server.ts`)
- Estado cliente: Zustand
- Validacion: Zod
- Persistencia: SQLite con fallback a memoria

## Requisitos

- Node.js 18 o superior
- npm
- Steam API Key

## Instalacion

```bash
git clone https://github.com/Kwmee/GameWasters.git
cd GameWasters
npm install
```

## Variables de entorno

Crea un `.env.local` a partir del ejemplo:

```bash
cp .env.example .env.local
```

En PowerShell tambien puedes usar:

```powershell
Copy-Item .env.example .env.local
```

Variables recomendadas:

```env
STEAM_API_KEY="TU_STEAM_API_KEY"
SESSION_SECRET="TU_SECRETO_DE_SESION"
STEAM_ID_ENCRYPTION_SECRET="SECRETO_MINIMO_16_CARACTERES"
APP_URL="http://localhost:3000"
SQLITE_DB_PATH="./database/app.db"
```

## Scripts

- `npm run dev`: inicia servidor en desarrollo
- `npm run lint`: chequeo de tipos TypeScript
- `npm run build`: build de frontend
- `npm run preview`: sirve build de Vite

## Estructura principal

```text
api/
  index.ts
  server.ts
src/
  components/
  db/
  i18n/
  repositories/
  security/
  services/
  store/
server.ts
```

## Despliegue

El proyecto incluye configuracion para Vercel mediante `vercel.json`.

## Documentacion adicional

- [API.md](./API.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [COMPONENTS.md](./COMPONENTS.md)
- [SECURITY.md](./SECURITY.md)
- [METRICS.md](./METRICS.md)

## Notas

- Actualmente no hay archivo `LICENSE` en el repositorio.
- El archivo `.env.example` incluye claves heredadas de otros entornos (por ejemplo `GEMINI_API_KEY`) que no son necesarias para el flujo principal de Steam.