# Development Guide - GameWasters

Esta guía proporciona información completa para desarrolladores que trabajan en el proyecto GameWasters, incluyendo configuración del entorno, patrones de código, testing y despliegue.

## 📋 Tabla de Contenidos

- [Configuración del Entorno](#configuración-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Patrones de Código](#patrones-de-código)
- [Guía de Estilo](#guía-de-estilo)
- [Testing](#testing)
- [Debugging](#debugging)
- [Contribución](#contribución)
- [Troubleshooting](#troubleshooting)

---

## 🛠️ Configuración del Entorno

### Prerrequisitos

- **Node.js**: 18.0.0 o superior
- **npm**: 8.0.0 o superior
- **Git**: 2.30.0 o superior
- **VS Code**: Recomendado con extensiones específicas

### Extensiones de VS Code Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Instalación y Configuración

1. **Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/GameWasters.git
cd GameWasters
```

2. **Instalar Dependencias**
```bash
npm install
```

3. **Configurar Variables de Entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local`:
```env
# Steam API Configuration
STEAM_API_KEY="tu_steam_api_key_aqui"
STEAM_ID_ENCRYPTION_SECRET="secreto_de_cifrado_minimo_16_caracteres"

# Application Configuration
NODE_ENV="development"
APP_URL="http://localhost:3000"
SESSION_SECRET="tu_secreto_de_sesion"

# Database Configuration
SQLITE_DB_PATH="./database/app.db"

# Development Options
DEBUG="gamewasters:*"
LOG_LEVEL="debug"
```

4. **Inicializar Base de Datos**
```bash
npm run db:init
```

5. **Iniciar Servidor de Desarrollo**
```bash
npm run dev
```

### Configuración de Steam API

1. Ve a [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Ingresa tu dominio (ej: `localhost:3000` para desarrollo)
3. Copia la API key generada
4. Añádela a tu archivo `.env.local`

---

## 📁 Estructura del Proyecto

```
GameWasters/
├── api/                          # Backend API
│   ├── server.ts                 # Servidor Express principal
│   └── index.ts                  # Configuración y exportación
├── src/                          # Frontend React
│   ├── components/               # Componentes UI
│   │   ├── LandingPage.tsx       # Página principal
│   │   ├── StatsPage.tsx         # Página de estadísticas
│   │   ├── ProfilePage.tsx       # Página de perfil
│   │   ├── Header.tsx            # Navegación principal
│   │   ├── Footer.tsx            # Pie de página
│   │   ├── DealsCarousel.tsx     # Carrusel de ofertas
│   │   ├── SteamLoginButton.tsx  # Botón de login Steam
│   │   ├── TopGenres.tsx         # Top géneros
│   │   ├── PrivacyPage.tsx       # Política de privacidad
│   │   └── TermsPage.tsx         # Términos de servicio
│   ├── services/                 # Lógica de negocio
│   │   ├── steamService.ts       # Servicio Steam API
│   │   └── recommendationService.ts # Motor de recomendaciones
│   ├── store/                    # Estado global
│   │   └── useStore.ts           # Zustand store
│   ├── repositories/             # Acceso a datos
│   │   ├── userRepository.ts      # Repositorio de usuarios
│   │   └── userGenreStatsRepository.ts # Estadísticas de género
│   ├── security/                 # Utilidades de seguridad
│   │   └── steamIdCipher.ts      # Cifrado de Steam IDs
│   ├── i18n/                     # Internacionalización
│   │   ├── useI18n.ts            # Hook de i18n
│   │   └── translations/         # Archivos de traducción
│   ├── db/                       # Tipos de base de datos
│   │   └── schema.ts             # Schema de base de datos
│   ├── config.ts                 # Configuración de la app
│   ├── App.tsx                   # Componente principal
│   ├── main.tsx                  # Punto de entrada
│   └── index.css                 # Estilos globales
├── database/                     # Archivos de base de datos
│   └── app.db                    # Base de datos SQLite
├── public/                       # Archivos estáticos
├── docs/                         # Documentación
├── .env.example                  # Plantilla de variables de entorno
├── .env.local                    # Variables de entorno (local)
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración TypeScript
├── vite.config.ts                # Configuración Vite
├── tailwind.config.js            # Configuración Tailwind
└── vercel.json                   # Configuración Vercel
```

---

## 🎨 Patrones de Código

### Patrones de Componentes React

#### 1. Componentes Funcionales con TypeScript

```typescript
interface Props {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const ComponentExample: React.FC<Props> = ({ 
  title, 
  onAction, 
  children 
}) => {
  // Hooks al inicio
  const [state, setState] = useState<string>('');
  const { data } = useStore();
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);
  
  // Effects
  useEffect(() => {
    // Lógica del effect
  }, [state]);
  
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      {children}
      <button onClick={handleClick}>
        Action
      </button>
    </div>
  );
};

export default ComponentExample;
```

#### 2. Custom Hooks

```typescript
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Error');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}
```

### Patrones de Servicios

#### 1. Servicio con Caching

```typescript
class SteamService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  
  async getOwnedGames(steamId: string): Promise<OwnedGame[]> {
    const cacheKey = `owned_games_${steamId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    const data = await this.fetchFromSteamAPI(steamId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }
  
  private async fetchFromSteamAPI(steamId: string): Promise<OwnedGame[]> {
    // Implementación de llamada a API
  }
}

export const steamService = new SteamService();
```

#### 2. Manejo de Errores

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiCall<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'HTTP_ERROR'
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Network error occurred',
      500,
      'NETWORK_ERROR'
    );
  }
}
```

---

## 📝 Guía de Estilo

### TypeScript

1. **Tipado Estricto**
```typescript
// ❌ Mal
const data = fetchData();

// ✅ Bien
const data: UserProfile = await fetchData<UserProfile>();
```

2. **Interfaces vs Types**
```typescript
// ✅ Usar interfaces para objetos
interface User {
  id: string;
  name: string;
}

// ✅ Usar types para unions o tipos complejos
type Status = 'pending' | 'success' | 'error';
```

3. **Enums vs String Literals**
```typescript
// ✅ Preferir string literals
type Genre = 'Action' | 'RPG' | 'Strategy';

// ❌ Evitar enums a menos que sea necesario
enum Genre {
  Action = 'Action',
  RPG = 'RPG',
  Strategy = 'Strategy'
}
```

### React

1. **Nomenclatura de Componentes**
```typescript
// ✅ PascalCase para componentes
const UserProfileCard: React.FC<Props> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ✅ camelCase para funciones y variables
const handleUserClick = () => {};
const userData = { name: 'John' };
```

2. **Props Destructuring**
```typescript
// ✅ Destructuring en la firma
const Button: React.FC<{ 
  label: string; 
  onClick: () => void; 
  variant?: 'primary' | 'secondary';
}> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};
```

### CSS/Tailwind

1. **Clases Utilitarias**
```typescript
// ✅ Usar clases de Tailwind directamente
<div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">

// ❌ Evitar CSS custom a menos que sea necesario
<div className="custom-card-style">
```

2. **Componentes con Estilos Condicionales**
```typescript
const Button: React.FC<Props> = ({ variant = 'primary', size = 'md' }) => {
  const baseClasses = "font-semibold rounded transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
  };
  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
    `}>
      {children}
    </button>
  );
};
```

---

## 🧪 Testing

### Configuración de Testing

El proyecto usa Jest y React Testing Library para testing:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest
```

### Ejemplos de Tests

#### 1. Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SteamLoginButton from './SteamLoginButton';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SteamLoginButton', () => {
  it('renders login button when not authenticated', () => {
    renderWithRouter(<SteamLoginButton />);
    
    const button = screen.getByRole('button', { name: /login with steam/i });
    expect(button).toBeInTheDocument();
  });
  
  it('calls login handler when clicked', () => {
    const mockLogin = jest.fn();
    renderWithRouter(<SteamLoginButton onLogin={mockLogin} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
```

#### 2. Service Testing

```typescript
import { steamService } from '../services/steamService';

// Mock fetch
global.fetch = jest.fn();

describe('SteamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('fetches owned games successfully', async () => {
    const mockGames = [{ appid: 730, name: 'CS:GO' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: { games: mockGames } })
    });
    
    const games = await steamService.getOwnedGames('76561198000000000');
    
    expect(games).toEqual(mockGames);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('GetOwnedGames')
    );
  });
  
  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401
    });
    
    await expect(
      steamService.getOwnedGames('invalid_id')
    ).rejects.toThrow('Unauthorized');
  });
});
```

#### 3. Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock API calls
jest.mock('../services/steamService', () => ({
  steamService: {
    getOwnedGames: jest.fn().mockResolvedValue([]),
    getPlayerSummaries: jest.fn().mockResolvedValue([])
  }
}));

describe('App Integration', () => {
  it('renders landing page by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/gamewasters/i)).toBeInTheDocument();
  });
  
  it('navigates to profile page', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    const profileLink = screen.getByText(/profile/i);
    fireEvent.click(profileLink);
    
    await waitFor(() => {
      expect(screen.getByText(/player profile/i)).toBeInTheDocument();
    });
  });
});
```

### Scripts de Testing

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## 🐛 Debugging

### Debugging en el Browser

1. **React DevTools**
   - Inspeccionar componentes y estado
   - Ver props y context
   - Performance profiling

2. **Redux DevTools** (para Zustand)
   - Inspeccionar estado global
   - Time travel debugging
   - Action history

### Debugging en el Backend

1. **Logs Estructurados**
```typescript
import debug from 'debug';

const log = debug('gamewasters:steam');

async function getOwnedGames(steamId: string) {
  log('Fetching owned games for steamId: %s', steamId);
  
  try {
    const games = await fetchFromAPI(steamId);
    log('Successfully fetched %d games', games.length);
    return games;
  } catch (error) {
    log('Error fetching games: %O', error);
    throw error;
  }
}
```

2. **Error Boundaries**
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Debugging Tips

1. **Usar console.table para arrays**
```typescript
console.table(userGames);
```

2. **Performance debugging**
```typescript
console.time('expensive-operation');
// ... código costoso
console.timeEnd('expensive-operation');
```

3. **Network debugging**
```typescript
// Intercept fetch para debugging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch called with:', args);
  const result = await originalFetch(...args);
  console.log('Fetch result:', result);
  return result;
};
```

---

## 🤝 Contribución

### Flujo de Trabajo

1. **Crear Feature Branch**
```bash
git checkout -b feature/nueva-funcionalidad
```

2. **Commits Atómicos**
```bash
git commit -m "feat: add steam authentication"
git commit -m "fix: resolve api error handling"
git commit -m "docs: update api documentation"
```

3. **Pull Request Template**
```markdown
## Descripción
Breve descricripción de los cambios implementados.

## Tipo de Cambio
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pasan
- [ ] Integration tests pasan
- [ ] Manual testing completado

## Checklist
- [ ] Código sigue las guías de estilo
- [ ] Self-review completado
- [ ] Documentation actualizada
```

### Convenciones de Commits

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formato/código style
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Mantenimiento

**Ejemplos:**
```
feat(auth): add steam oauth integration
fix(api): handle steam api rate limiting
docs(readme): update installation instructions
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Steam API Rate Limiting

**Problema:** Error 429 de Steam API
**Solución:**
```typescript
// Implementar retry con exponential backoff
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

#### 2. Memory Leaks en React

**Problema:** Componentes no se limpian correctamente
**Solución:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Lógica del interval
  }, 1000);
  
  return () => clearInterval(interval); // Cleanup
}, []);
```

#### 3. Estado Asíncrono en Zustand

**Problema:** Estado no actualizado después de acciones asíncronas
**Solución:**
```typescript
const useStore = create((set, get) => ({
  user: null,
  loading: false,
  
  fetchUser: async (steamId: string) => {
    set({ loading: true });
    try {
      const userData = await api.getUser(steamId);
      set({ user: userData, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  }
}));
```

### Performance Issues

#### 1. Re-renders Innecesarios

```typescript
// ❌ Mal: objeto nuevo en cada render
const BadComponent = () => {
  const config = { theme: 'dark' }; // Nuevo objeto cada render
  return <ChildComponent config={config} />;
};

// ✅ Bien: memoizar o mover fuera
const config = { theme: 'dark' };
const GoodComponent = () => {
  return <ChildComponent config={config} />;
};

// O usar useMemo
const BetterComponent = () => {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  return <ChildComponent config={config} />;
};
```

#### 2. API Calls Múltiples

```typescript
// ✅ Implementar caching y deduplication
const useUserData = (steamId: string) => {
  return useQuery({
    queryKey: ['user', steamId],
    queryFn: () => api.getUser(steamId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};
```

### Herramientas de Debugging

1. **React DevTools Profiler**
2. **Chrome DevTools Performance Tab**
3. **Lighthouse para performance audits**
4. **Bundle analyzer**: `npm run build:analyze`

---

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Steam Web API Documentation](https://steamcommunity.com/dev)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

## 🆘 Soporte

Para ayuda durante el desarrollo:

1. **Issues en GitHub**: Reportar bugs y solicitar features
2. **Discord/Slack**: Chat en tiempo real con el equipo
3. **Documentation**: Revisar docs existentes primero
4. **Code Reviews**: Solicitar review para cambios complejos

---

**Happy Coding! 🚀**
