<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GameWasters - Plataforma de Análisis y Recomendaciones de Steam

GameWasters es una aplicación web full-stack que proporciona análisis detallados del perfil de jugadores de Steam y recomendaciones personalizadas de juegos basadas en los patrones de juego y preferencias de género.

## 🎯 Características Principales

- **Análisis de Perfil Steam**: Estadísticas completas de tiempo de juego, logros y valoración de inventario
- **Recomendaciones Inteligentes**: Sistema de recomendación basado en géneros ponderados usando algoritmos de Machine Learning
- **Ofertas y Descuentos**: Carousel de juegos en oferta con descuentos significativos
- **Estadísticas Detalladas**: Análisis por género, tiempo de juego y patrones de comportamiento
- **Autenticación Segura**: Integración con Steam OAuth y cifrado de datos sensibles
- **Interfaz Responsiva**: Diseño moderno con TailwindCSS y soporte multiidioma

## 🏗️ Arquitectura Técnica

### Frontend (React + TypeScript)
```
src/
├── components/          # Componentes UI reutilizables
├── services/           # Lógica de negocio y API calls
├── store/              # Estado global con Zustand
├── repositories/       # Patrones de acceso a datos
├── security/           # Utilidades de cifrado
├── i18n/              # Internacionalización
└── db/                # Tipos de base de datos
```

### Backend (Express.js + Node.js)
```
api/
├── server.ts           # Servidor Express principal
└── index.ts           # Configuración y exportación
```

### Base de Datos
- **SQLite**: Almacenamiento persistente de usuarios y estadísticas
- **Memory Storage**: Fallback para entornos sin SQLite
- **Cifrado**: Steam IDs cifrados con AES-256

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, Steam API Key

### 1. Instalación
```bash
git clone https://github.com/tu-usuario/GameWasters.git
cd GameWasters
npm install
```

### 2. Configuración de Variables de Entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
STEAM_API_KEY="tu_steam_api_key"
STEAM_ID_ENCRYPTION_SECRET="secreto_minimo_16_caracteres"
SESSION_SECRET="tu_secreto_de_sesion"
APP_URL="http://localhost:3000"
SQLITE_DB_PATH="./database/app.db"
```

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

Visita `http://localhost:3000` para ver la aplicación.

### 4. Build para Producción
```bash
npm run build
npm start
```

## 🔧 Configuración de Steam API

1. Ve a [Steam Web API](https://steamcommunity.com/dev/apikey)
2. Solicita una API key con tu dominio
3. Añade la key a tu archivo `.env.local`

## 📊 Métricas y Monitorización

La aplicación implementa métricas de nivel 3 incluyendo:

- **KPIs de Usuario**: Tiempo de juego total, juegos completados, tasa de logros
- **Métricas de Rendimiento**: Tiempo de respuesta de API, tasa de éxito de recomendaciones
- **Análisis de Comportamiento**: Patrones de juego por género, horarios de actividad
- **Métricas de Negocio**: Tasa de conversión de ofertas, engagement del usuario

## 🔒 Seguridad

- **Cifrado de Steam IDs**: Algoritmo AES-256 para protección de identidad
- **JWT Tokens**: Autenticación sin estado con tokens firmados
- **Validación de Input**: Schemas Zod para validación estricta
- **CORS**: Configuración segura para dominios autorizados
- **Session Management**: Sesiones seguras con timeout configurable

## 🌐 Despliegue

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Documentación Adicional

- [API Documentation](./API.md) - Endpoints y schemas completos
- [Development Guide](./DEVELOPMENT.md) - Guía para desarrolladores
- [Components Catalog](./COMPONENTS.md) - Catálogo de componentes React
- [Security Policies](./SECURITY.md) - Políticas de seguridad
- [Metrics & KPIs](./METRICS.md) - Definición de métricas

## 🤝 Contribución

1. Fork el repositorio
2. Crea una feature branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la MIT License - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

- 📧 Email: support@gamewasters.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/GameWasters/issues)
- 📖 Wiki: [Documentación completa](https://gamewasters.com/docs)

---

**GameWasters** - *Transforma tu experiencia gaming con análisis inteligente*
