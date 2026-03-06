# API Documentation - GameWasters

Esta documentación describe todos los endpoints disponibles en la API REST de GameWasters, incluyendo schemas de datos, flujos de autenticación y manejo de errores.

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Endpoints de Usuario](#endpoints-de-usuario)
- [Endpoints de Ofertas](#endpoints-de-ofertas)
- [Endpoints de Recomendaciones](#endpoints-de-recomendaciones)
- [Schemas y Tipos](#schemas-y-tipos)
- [Manejo de Errores](#manejo-de-errores)

## 🔐 Autenticación

### Flujo de Autenticación Steam OAuth

La aplicación utiliza Steam OpenID para autenticación. El flujo completo es:

1. **Obtener URL de Autenticación**
2. **Redirección a Steam**
3. **Callback de Autenticación**
4. **Generación de JWT Token**

---

### GET `/api/auth/steam/url`

Genera la URL de autenticación de Steam OpenID.

**Query Parameters:**
- Ninguno

**Response:**
```json
{
  "url": "https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&..."
}
```

**Status Codes:**
- `200 OK`: URL generada exitosamente

---

### GET `/api/auth/steam/return`

Endpoint de callback para la autenticación de Steam.

**Query Parameters:**
- `openid.claimed_id` (string): URL del perfil de Steam del usuario
- `openid.identity` (string): URL de identidad OpenID
- `openid.return_to` (string): URL de retorno
- `openid.response_nonce` (string): Nonce de respuesta
- `openid.signed` (string): Parámetros firmados
- `openid.sig` (string): Firma digital

**Response:**
```html
<!DOCTYPE html>
<html>
<head><title>Authentication Result</title></head>
<body>
  <script>
    window.opener.postMessage({
      type: 'STEAM_AUTH_SUCCESS',
      steamId: '76561198000000000',
      steamName: 'Username',
      steamAvatar: 'https://avatars.steamstatic.com/...',
      token: 'jwt_token_here'
    }, 'http://localhost:3000');
    window.close();
  </script>
</body>
</html>
```

**Status Codes:**
- `200 OK`: Autenticación exitosa
- `400 Bad Request`: Parámetros inválidos
- `500 Internal Server Error`: Error del servidor

---

## 👤 Endpoints de Usuario

### GET `/api/user/profile`

Obtiene el perfil completo del usuario con estadísticas detalladas.

**Headers:**
- `Authorization: Bearer <jwt_token>` (opcional, se puede usar steamId en query)

**Query Parameters:**
- `steamId` (string, opcional): Steam ID del usuario como fallback

**Response:**
```json
{
  "success": true,
  "data": {
    "steamId": "76561198000000000",
    "steamName": "Username",
    "steamAvatar": "https://avatars.steamstatic.com/...",
    "summary": {
      "totalPlaytimeHours": 1250.5,
      "totalGames": 150,
      "gamesPlayed": 85,
      "gamesNotPlayed": 65,
      "topGame": {
        "name": "Counter-Strike 2",
        "hours": 450.2
      },
      "estimatedInventoryValue": 250.75,
      "playerScore": 78.5,
      "rank": "Dedicated Gamer"
    },
    "achievements": {
      "totalUnlocked": 1250,
      "totalAchievements": 3000,
      "avgCompletion": 41.67,
      "perfectGames": 12,
      "topGames": [
        {
          "appid": 730,
          "gameName": "Counter-Strike 2",
          "totalAchievements": 150,
          "unlockedAchievements": 120,
          "completionPercent": 80.0
        }
      ]
    },
    "recentGames": [
      {
        "appid": 730,
        "name": "Counter-Strike 2",
        "playtime_forever": 450.2,
        "playtime_2weeks": 25.5,
        "img_icon_url": "icon_hash",
        "img_logo_url": "logo_hash"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Perfil obtenido exitosamente
- `401 Unauthorized`: Usuario no autenticado
- `404 Not Found`: Usuario no encontrado
- `500 Internal Server Error`: Error del servidor

---

### GET `/api/user/top-genres`

Obtiene los géneros de juego preferidos del usuario basados en tiempo de juego.

**Headers:**
- `Authorization: Bearer <jwt_token>` (opcional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Action",
      "playtime": 450.5,
      "gamesCount": 25,
      "percentage": 35.2
    },
    {
      "name": "RPG",
      "playtime": 320.8,
      "gamesCount": 18,
      "percentage": 25.1
    },
    {
      "name": "Strategy",
      "playtime": 200.3,
      "gamesCount": 12,
      "percentage": 15.6
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Géneros obtenidos exitosamente
- `401 Unauthorized`: Usuario no autenticado
- `500 Internal Server Error`: Error del servidor

---

## 🛍️ Endpoints de Ofertas

### GET `/api/deals`

Obtiene ofertas de juegos personalizadas basadas en los géneros preferidos del usuario.

**Headers:**
- `Authorization: Bearer <jwt_token>` (opcional)

**Query Parameters:**
- `steamId` (string, opcional): Steam ID para personalización

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "steamId": "76561198000000000",
      "title": "Cyberpunk 2077",
      "currentPrice": 29.99,
      "discount": 75,
      "image": "https://cdn.akamai.steamstatic.com/...",
      "originalPrice": 119.99,
      "savings": 90.00,
      "genres": ["RPG", "Action"],
      "releaseDate": "2020-12-10",
      "metacriticScore": 86
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Ofertas obtenidas exitosamente
- `401 Unauthorized`: Usuario no autenticado
- `500 Internal Server Error`: Error del servidor

---

### GET `/api/deals/historical-lows`

Obtiene ofertas con precios históricos más bajos.

**Headers:**
- `Authorization: Bearer <jwt_token>` (opcional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "steamId": "76561198000000000",
      "title": "The Witcher 3: Wild Hunt",
      "currentPrice": 4.99,
      "discount": 90,
      "image": "https://cdn.akamai.steamstatic.com/...",
      "historicalLow": 2.99,
      "historicalLowDate": "2021-01-15",
      "currentVsHistorical": 66.7,
      "genres": ["RPG"],
      "releaseDate": "2016-05-19"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Ofertas históricas obtenidas exitosamente
- `401 Unauthorized`: Usuario no autenticado
- `500 Internal Server Error`: Error del servidor

---

## 🎯 Endpoints de Recomendaciones

### GET `/api/recommendations/top-steam`

Obtiene recomendaciones de juegos populares basadas en los géneros preferidos del usuario.

**Headers:**
- `Authorization: Bearer <jwt_token>` (opcional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "appId": 271590,
      "title": "Grand Theft Auto V",
      "score": 92.5,
      "gameGenres": ["Action", "Adventure"],
      "concurrentPlayers": 150000,
      "price": 29.99,
      "discount": 50,
      "releaseDate": "2015-04-14",
      "metacriticScore": 96,
      "recommendationReason": "Basado en tu preferencia por juegos de Action"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Recomendaciones obtenidas exitosamente
- `401 Unauthorized`: Usuario no autenticado
- `500 Internal Server Error`: Error del servidor

---

## 📊 Schemas y Tipos

### UserGenreStats

```typescript
interface UserGenreStats {
  name: string;           // Nombre del género
  playtime: number;       // Tiempo de juego en horas
  gamesCount: number;     // Cantidad de juegos
  percentage: number;     // Porcentaje del tiempo total
}
```

### Deal

```typescript
interface Deal {
  steamId: string;        // Steam ID del usuario
  title: string;          // Título del juego
  currentPrice: number;   // Precio actual
  discount: number;       // Descuento porcentual
  image: string;          // URL de la imagen
  originalPrice?: number; // Precio original
  savings?: number;       // Ahorro total
  genres?: string[];      // Géneros del juego
  releaseDate?: string;   // Fecha de lanzamiento
  metacriticScore?: number; // Puntuación Metacritic
}
```

### TopSteamRecommendation

```typescript
interface TopSteamRecommendation {
  appId: number;                    // ID de la aplicación
  title: string;                    // Título del juego
  score: number;                    // Puntuación de recomendación
  gameGenres: string[];             // Géneros del juego
  concurrentPlayers: number | null; // Jugadores concurrentes
  price?: number;                   // Precio actual
  discount?: number;                // Descuento
  releaseDate?: string;             // Fecha de lanzamiento
  metacriticScore?: number;         // Puntuación Metacritic
  recommendationReason?: string;    // Razón de recomendación
}
```

### PlayerProfile

```typescript
interface PlayerProfile {
  steamId: string;
  steamName: string;
  steamAvatar: string;
  summary: {
    totalPlaytimeHours: number;
    totalGames: number;
    gamesPlayed: number;
    gamesNotPlayed: number;
    topGame: { name: string; hours: number } | null;
    estimatedInventoryValue: number;
    playerScore: number;
    rank: string;
  };
  achievements: {
    totalUnlocked: number;
    totalAchievements: number;
    avgCompletion: number;
    perfectGames: number;
    topGames: Array<{
      appid: number;
      gameName: string;
      totalAchievements: number;
      unlockedAchievements: number;
      completionPercent: number;
    }>;
  };
  recentGames: Array<{
    appid: number;
    name: string;
    playtime_forever: number;
    playtime_2weeks: number;
    img_icon_url: string;
    img_logo_url: string;
  }>;
}
```

---

## ⚠️ Manejo de Errores

### Formato de Respuesta de Error

```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "code": "ERROR_CODE",
  "details": {} // Información adicional opcional
}
```

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | Usuario no autenticado |
| `INVALID_STEAM_ID` | Steam ID inválido |
| `STEAM_API_ERROR` | Error en la API de Steam |
| `DATABASE_ERROR` | Error en la base de datos |
| `VALIDATION_ERROR` | Error de validación de datos |
| `RATE_LIMIT_EXCEEDED` | Límite de tasa excedido |
| `INTERNAL_ERROR` | Error interno del servidor |

### Límites de Tasa

- **Steam API**: 100,000 llamadas por día
- **Endpoints de usuario**: 1000 llamadas por hora por usuario
- **Endpoints de ofertas**: 500 llamadas por hora por usuario
- **Recomendaciones**: 200 llamadas por hora por usuario

---

## 🔒 Consideraciones de Seguridad

- Todos los Steam IDs son cifrados usando AES-256 antes de almacenar
- Los tokens JWT tienen una expiración de 24 horas
- Las respuestas de Steam API son validadas y sanitizadas
- Se implementan políticas CORS estrictas
- Los datos sensibles nunca son expuestos en logs o respuestas

---

## 📝 Ejemplos de Uso

### Autenticación Completa

```javascript
// 1. Obtener URL de autenticación
const authResponse = await fetch('/api/auth/steam/url');
const { url } = await authResponse.json();

// 2. Redirigir a Steam
window.location.href = url;

// 3. Después del callback, el token JWT se recibe via postMessage
window.addEventListener('message', (event) => {
  if (event.data.type === 'STEAM_AUTH_SUCCESS') {
    const { token } = event.data;
    localStorage.setItem('jwt_token', token);
  }
});

// 4. Usar el token para llamadas autenticadas
const profileResponse = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Obtener Recomendaciones Personalizadas

```javascript
const token = localStorage.getItem('jwt_token');

const recommendationsResponse = await fetch('/api/recommendations/top-steam', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { success, data } = await recommendationsResponse.json();
if (success) {
  console.log('Recomendaciones:', data);
}
```

---

## 🚀 Deployment Notes

- La API soporta tanto SQLite como almacenamiento en memoria
- En Vercel, se usa almacenamiento en memoria por limitaciones del filesystem
- Las variables de entorno deben configurarse antes del despliegue
- La API automáticamente detecta y fallback a memoria si SQLite no está disponible
