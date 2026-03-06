# Components Catalog - GameWasters

Este documento describe todos los componentes React disponibles en GameWasters, incluyendo sus props, estado y ejemplos de uso.

## 📋 Tabla de Contenidos

- [Layout Components](#layout-components)
- [Authentication Components](#authentication-components)
- [Data Display Components](#data-display-components)
- [Navigation Components](#navigation-components)
- [Utility Components](#utility-components)

---

## 🏗️ Layout Components

### App

**Archivo:** `src/App.tsx`

Componente principal que envuelve toda la aplicación y configura el routing.

```typescript
interface Props {
  // No recibe props, usa contexto global
}

// Uso (automático en main.tsx)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Características:**
- Configuración de React Router
- Manejo de autenticación Steam via URL params
- Escucha de mensajes postMessage para auth
- Proveedor de internacionalización
- Layout con Header y Footer

---

### LandingPage

**Archivo:** `src/components/LandingPage.tsx`

Página principal que muestra ofertas, recomendaciones y permite autenticación.

```typescript
interface Props {
  // No recibe props, usa store global
}

// Estado interno
interface State {
  loading: boolean;
  loadingHistorical: boolean;
  historicalDeals: Deal[];
  historicalDealsFetchedAt: number | null;
  activeTab: 'deals' | 'historical' | 'topSteam';
}
```

**Características:**
- Tabs para diferentes tipos de contenido
- Caching de deals históricos (1 hora TTL)
- Carga condicional según autenticación
- Responsive design
- Loading states

**Ejemplo de uso:**
```typescript
// En routing
<Route path="/" element={<LandingPage />} />
```

---

### Header

**Archivo:** `src/components/Header.tsx`

Navegación principal de la aplicación.

```typescript
interface Props {
  // No recibe props, usa store global
}
```

**Características:**
- Links de navegación principales
- Indicador de estado de autenticación
- Logo y branding
- Responsive navigation
- Integración con i18n

**Ejemplo de uso:**
```typescript
// Dentro de App component
<Header />
```

---

### Footer

**Archivo:** `src/components/Footer.tsx`

Pie de página con enlaces legales y redes sociales.

```typescript
interface Props {
  // No recibe props
}
```

**Características:**
- Enlaces a Privacy Policy y Terms
- Copyright y año dinámico
- Enlaces a redes sociales
- Responsive design

---

## 🔐 Authentication Components

### SteamLoginButton

**Archivo:** `src/components/SteamLoginButton.tsx`

Botón para iniciar sesión con Steam OAuth.

```typescript
interface Props {
  onLogin?: (steamId: string, steamName: string, steamAvatar: string, token: string) => void;
  className?: string;
}

// Ejemplo de uso
<SteamLoginButton 
  onLogin={(steamId, steamName, steamAvatar, token) => {
    console.log('User logged in:', steamName);
  }}
  className="mt-4"
/>
```

**Características:**
- Integración con Steam OpenID
- Manejo de errores de autenticación
- Loading states
- Estilo personalizable
- Redirect automático después de login

---

## 📊 Data Display Components

### DealsCarousel

**Archivo:** `src/components/DealsCarousel.tsx`

Carrusel horizontal para mostrar ofertas de juegos.

```typescript
interface Props {
  deals: Deal[];
}

interface Deal {
  steamId: string;
  title: string;
  currentPrice: number;
  discount: number;
  image: string;
  originalPrice?: number;
  savings?: number;
}

// Ejemplo de uso
const deals: Deal[] = [
  {
    steamId: "76561198000000000",
    title: "Cyberpunk 2077",
    currentPrice: 29.99,
    discount: 75,
    image: "https://example.com/image.jpg"
  }
];

<DealsCarousel deals={deals} />
```

**Características:**
- Scroll horizontal con botones de navegación
- Formato de precios en EUR
- Indicadores visuales de scroll disponible
- Responsive design
- Smooth scrolling
- Lazy loading de imágenes

**Estado interno:**
```typescript
interface State {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}
```

---

### StatsPage

**Archivo:** `src/components/StatsPage.tsx`

Página de estadísticas detalladas del perfil de Steam.

```typescript
interface Props {
  // No recibe props, usa store global
}
```

**Características:**
- Estadísticas generales de juego
- Top géneros con visualización
- Gráficos y métricas
- Datos de logros
- Tiempo de juego detallado
- Exportación de datos

**Secciones principales:**
- Resumen general
- Top géneros (usa TopGenres component)
- Estadísticas de logros
- Juegos más jugados
- Métricas de rendimiento

---

### ProfilePage

**Archivo:** `src/components/ProfilePage.tsx`

Página de perfil completo del usuario.

```typescript
interface Props {
  // No recibe props, usa store global
}
```

**Características:**
- Información básica del perfil
- Avatar y nombre de Steam
- Estadísticas detalladas
- Historial de juegos recientes
- Configuración de preferencias
- Integración con API de Steam

---

### TopGenres

**Archivo:** `src/components/TopGenres.tsx`

Componente para visualizar los géneros preferidos del usuario.

```typescript
interface Props {
  genres: TopGenre[];
}

interface TopGenre {
  name: string;
  playtime: number;
  gamesCount: number;
  percentage: number;
}

// Ejemplo de uso
const genres: TopGenre[] = [
  { name: "Action", playtime: 450.5, gamesCount: 25, percentage: 35.2 },
  { name: "RPG", playtime: 320.8, gamesCount: 18, percentage: 25.1 }
];

<TopGenres genres={genres} />
```

**Características:**
- Visualización de barras horizontales
- Porcentajes y tiempo de juego
- Número de juegos por género
- Animaciones suaves
- Responsive design
- Traducción de nombres de género

---

## 🧭 Navigation Components

### PrivacyPage

**Archivo:** `src/components/PrivacyPage.tsx`

Página de política de privacidad.

```typescript
interface Props {
  // No recibe props
}
```

**Características:**
- Política de privacidad completa
- SEO optimizado
- Estructura semántica HTML5
- Enlaces anclas
- Responsive design

---

### TermsPage

**Archivo:** `src/components/TermsPage.tsx`

Página de términos y condiciones.

```typescript
interface Props {
  // No recibe props
}
```

**Características:**
- Términos de servicio detallados
- Secciones bien estructuradas
- Cumplimiento legal
- Responsive design

---

## 🛠️ Utility Components

### LoadingSpinner

**Componente interno reutilizable**

```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Ejemplo de uso
<LoadingSpinner size="md" className="mx-auto" />
```

**Características:**
- Múltiples tamaños
- Animación CSS
- Personalizable con Tailwind
- Accesibilidad con ARIA labels

---

### ErrorMessage

**Componente interno para manejo de errores**

```typescript
interface Props {
  message: string;
  onRetry?: () => void;
  className?: string;
}

// Ejemplo de uso
<ErrorMessage 
  message="Failed to load data" 
  onRetry={() => refetch()} 
/>
```

**Características:**
- Mensajes de error consistentes
- Botón de retry opcional
- Estilos personalizados
- Accesibilidad

---

## 🎨 Component Patterns

### 1. Componentes con Estado Global

La mayoría de los componentes usan el store de Zustand:

```typescript
const { isAuthenticated, user, deals } = useStore();
```

**Store Interface:**
```typescript
interface StoreState {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  hashedSteamId: string | null;
  
  // Data
  deals: Deal[];
  topSteamRecommendations: TopSteamRecommendation[];
  userGenreStats: TopGenre[];
  playerProfile: PlayerProfile | null;
  
  // Actions
  login: (steamId: string, steamName?: string, steamAvatar?: string, token?: string) => void;
  logout: () => void;
  setDeals: (deals: Deal[]) => void;
  // ... más acciones
}
```

### 2. Componentes con Internacionalización

Todos los componentes usan el hook `useI18n`:

```typescript
const { t, translateGenre } = useI18n();

// Uso en JSX
<h1>{t('welcome')}</h1>
<p>{translateGenre('Action')}</p>
```

### 3. Componentes con Loading States

Patrón consistente para manejar estados de carga:

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await apiCall();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

return (
  <div>
    {loading && <LoadingSpinner />}
    {error && <ErrorMessage message={error} />}
    {data && <DataComponent data={data} />}
  </div>
);
```

### 4. Componentes Responsivos

Uso consistente de clases de Tailwind para responsividad:

```typescript
return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div className="col-span-full">
      {/* Content */}
    </div>
  </div>
);
```

---

## 🔄 Component Lifecycle

### Montaje
1. Los componentes se montan con React Router
2. Se suscriben al store global de Zustand
3. Se cargan datos necesarios desde APIs
4. Se establecen listeners para eventos

### Actualización
1. Los cambios en el store propagan actualizaciones
2. Los efectos de `useEffect` se ejecutan cuando dependencies cambian
3. Se manejan loading states durante actualizaciones de datos

### Desmontaje
1. Se limpian listeners y timeouts
2. Se cancelan peticiones pendientes
3. Se libera memoria

---

## 🎯 Best Practices

### 1. Props Typing

```typescript
// ✅ Bien: interfaces explícitas
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// ❌ Mal: props sin tipar
const Button = (props: any) => {
  // ...
};
```

### 2. Default Props

```typescript
// ✅ Bien: valores por defecto en destructuring
const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  // ...
};
```

### 3. Conditional Rendering

```typescript
// ✅ Bien: operadores lógicos
{user && <UserProfile user={user} />}
{loading ? <LoadingSpinner /> : <DataComponent />}

// ❌ Mal: if statements en JSX
{(() => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  return <DataComponent />;
})()}
```

### 4. Event Handlers

```typescript
// ✅ Bien: useCallback para optimización
const handleClick = useCallback(() => {
  onAction?.(data);
}, [onAction, data]);

// ✅ Bien: inline handlers para casos simples
<button onClick={() => setShowModal(true)}>
  Open Modal
</button>
```

---

## 🧪 Testing Components

### Unit Testing Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DealsCarousel from './DealsCarousel';

describe('DealsCarousel', () => {
  const mockDeals = [
    {
      steamId: '123',
      title: 'Test Game',
      currentPrice: 9.99,
      discount: 50,
      image: 'test.jpg'
    }
  ];

  it('renders deals correctly', () => {
    render(<DealsCarousel deals={mockDeals} />);
    
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('9,99 €')).toBeInTheDocument();
    expect(screen.getByText('-50%')).toBeInTheDocument();
  });

  it('handles scroll navigation', () => {
    render(<DealsCarousel deals={mockDeals} />);
    
    const scrollRight = screen.getByRole('button', { name: /scroll right/i });
    fireEvent.click(scrollRight);
    
    // Assert scroll behavior
  });
});
```

---

## 📦 Component Dependencies

### External Dependencies

- **React 19**: Core framework
- **React Router 7**: Routing
- **Lucide React**: Icons
- **TailwindCSS**: Styling
- **Zustand**: State management

### Internal Dependencies

- **useStore**: Global state management
- **useI18n**: Internationalization
- **API Services**: Data fetching
- **Types**: TypeScript interfaces

---

## 🚀 Performance Considerations

### 1. Memoization

```typescript
// Componentes pesados deben usar React.memo
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // Component rendering
});

// Hooks costosos deben usar useMemo
const processedData = useMemo(() => {
  return expensiveTransformation(data);
}, [data]);
```

### 2. Lazy Loading

```typescript
// Componentes de páginas grandes
const StatsPage = lazy(() => import('./StatsPage'));

// En routing
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/stats" element={<StatsPage />} />
</Suspense>
```

### 3. Virtual Scrolling

Para listas largas (no implementado actualmente pero recomendado):

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={80}
  >
    {({ index, style }) => (
      <div style={style}>
        <ItemComponent data={items[index]} />
      </div>
    )}
  </List>
);
```

---

## 📋 Migration Guide

### Para nuevos componentes:

1. **Crear interface de props**
2. **Usar TypeScript estricto**
3. **Implementar loading y error states**
4. **Agregar internacionalización**
5. **Escribir tests unitarios**
6. **Documentar con JSDoc**

### Para componentes existentes:

1. **Migrar a TypeScript**
2. **Agregar memoización si es necesario**
3. **Implementar error boundaries**
4. **Optimizar render performance**
5. **Actualizar tests**

---

## 🔍 Debugging Components

### React DevTools

```typescript
// Para debugging, añadir displayName
DealsCarousel.displayName = 'DealsCarousel';
```

### Console Debugging

```typescript
// Debug props y estado
useEffect(() => {
  console.log('Component mounted with props:', props);
  console.log('Current state:', { loading, error, data });
}, [props]);
```

### Performance Profiling

```typescript
// Para medir rendimiento
const startTime = performance.now();
// ... component logic
const endTime = performance.now();
console.log(`Component render took ${endTime - startTime} ms`);
```

---

Este catálogo estará actualizado conforme se añadan nuevos componentes o se modifiquen los existentes. Para contribuir con nuevos componentes, sigue las guías establecidas en [DEVELOPMENT.md](./DEVELOPMENT.md).
