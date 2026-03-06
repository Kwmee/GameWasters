# Metrics & KPIs - GameWasters

Este documento define las métricas de nivel 3 implementadas en GameWasters, incluyendo KPIs de negocio, métricas técnicas de rendimiento, y métricas de usuario para monitorizar el éxito de la plataforma.

## 📋 Tabla de Contenidos

- [Business KPIs](#business-kpis)
- [User Engagement Metrics](#user-engagement-metrics)
- [Technical Performance Metrics](#technical-performance-metrics)
- [API Metrics](#api-metrics)
- [Steam Integration Metrics](#steam-integration-metrics)
- [Recommendation System Metrics](#recommendation-system-metrics)
- [Monitoring & Alerting](#monitoring--alerting)
- [Data Collection & Analysis](#data-collection--analysis)

---

## 💼 Business KPIs

### 1. User Acquisition & Retention

#### Monthly Active Users (MAU)
```typescript
interface MAUMetrics {
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  retentionRate: number;
  churnRate: number;
}

// Métrica objetivo: 10,000 MAU en 6 meses
// Umbral de alerta: < 5,000 MAU
```

#### User Conversion Funnel
```typescript
interface ConversionFunnel {
  visitors: number;           // Visitantes únicos
  steamAuthInitiated: number; // Iniciaron auth Steam
  steamAuthCompleted: number; // Completaron auth Steam
  profileViewed: number;      // Vieron su perfil
  recommendationsClicked: number; // Clicaron en recomendaciones
  dealsClicked: number;        // Clicaron en ofertas
}

// Conversion rates objetivo:
// Auth initiation: 15%
// Auth completion: 80%
// Profile view: 90%
// Recommendation click: 25%
// Deal click: 30%
```

### 2. Revenue Metrics

#### Deal Conversion Rate
```typescript
interface DealMetrics {
  totalDealsShown: number;
  dealClicks: number;
  dealConversions: number;    // Usuarios que compraron
  averageDealValue: number;
  totalRevenue: number;
  clickThroughRate: number;   // dealClicks / totalDealsShown
  conversionRate: number;     // dealConversions / dealClicks
}

// Objetivos:
// CTR: > 5%
// Conversion rate: > 2%
// Average deal value: > €15
```

#### Affiliate Revenue
```typescript
interface AffiliateMetrics {
  steamAffiliateRevenue: number;
  partnerRevenue: number;
  totalCommission: number;
  revenuePerUser: number;
  revenuePerSession: number;
}

// Objetivo: €0.50 revenue por usuario activo mensual
```

### 3. Engagement Metrics

#### Session Analytics
```typescript
interface SessionMetrics {
  averageSessionDuration: number;  // minutos
  pagesPerSession: number;
  bounceRate: number;
  returnVisitorRate: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
}

// Objetivos:
// Session duration: > 5 minutos
// Pages per session: > 3
// Bounce rate: < 40%
```

---

## 👥 User Engagement Metrics

### 1. Profile Completion

#### Steam Data Integration
```typescript
interface ProfileMetrics {
  totalPlaytimeHours: number;
  gamesAnalyzed: number;
  achievementsUnlocked: number;
  genresDiscovered: number;
  inventoryValueCalculated: boolean;
  recommendationsGenerated: boolean;
}

// Engagement levels:
// Low: < 50 horas, < 20 juegos
// Medium: 50-500 horas, 20-100 juegos  
// High: > 500 horas, > 100 juegos
```

#### Profile Interaction
```typescript
interface ProfileInteraction {
  profileViews: number;
  statsPageViews: number;
  recommendationsViewed: number;
  dealsViewed: number;
  shareActions: number;
  exportActions: number;
}

// Engagement rate: (total interactions / unique users) * 100
// Objetivo: > 300% engagement rate
```

### 2. Recommendation System Engagement

#### Recommendation Performance
```typescript
interface RecommendationMetrics {
  recommendationsGenerated: number;
  recommendationsClicked: number;
  recommendationsAccepted: number;  // Usuario indica interés
  ctr: number;                      // Click-through rate
  acceptanceRate: number;            // Accepted / clicked
  averageRelevanceScore: number;     // Basado en feedback implícito
}

// Objetivos:
// CTR: > 15%
// Acceptance rate: > 40%
// Relevance score: > 0.7
```

#### Genre Analysis Accuracy
```typescript
interface GenreMetrics {
  genresAnalyzed: number;
  genreAccuracyScore: number;        // Basado en user feedback
  topGenreCorrectness: number;       // Predicción vs realidad
  recommendationDiversity: number;  // Variedad de recomendaciones
}

// Objetivo: > 80% accuracy en top 3 géneros
```

### 3. Deal Engagement

#### Deal Interaction Metrics
```typescript
interface DealInteraction {
  dealsShown: number;
  dealsClicked: number;
  dealsSaved: number;               // Wishlist/favoritos
  dealsPurchased: number;           // Auto-reportado
  averageDiscountViewed: number;
  dealSharing: number;
}

// Objetivos:
// Click rate: > 8%
// Save rate: > 15%
// Purchase rate: > 3%
```

---

## ⚡ Technical Performance Metrics

### 1. Application Performance

#### Frontend Metrics
```typescript
interface FrontendPerformance {
  // Core Web Vitals
  largestContentfulPaint: number;   // < 2.5s
  firstInputDelay: number;          // < 100ms
  cumulativeLayoutShift: number;   // < 0.1
  
  // Additional metrics
  firstContentfulPaint: number;    // < 1.8s
  timeToInteractive: number;        // < 3.8s
  bundleSize: number;               // < 1MB gzipped
  jsHeapSize: number;               // < 50MB
}

// Monitoring thresholds:
// LCP: Alerta si > 3s
// FID: Alerta si > 200ms
// CLS: Alerta si > 0.25
```

#### Backend Performance
```typescript
interface BackendPerformance {
  responseTime: {
    p50: number;                     // < 200ms
    p95: number;                     // < 500ms
    p99: number;                     // < 1000ms
  };
  throughput: number;               // requests/second
  errorRate: number;                 // < 1%
  cpuUsage: number;                  // < 70%
  memoryUsage: number;               // < 80%
  diskUsage: number;                 // < 85%
}

// Alertas:
// Response time p95 > 1s
// Error rate > 2%
// CPU > 85%
```

### 2. Database Performance

#### SQLite Metrics
```typescript
interface DatabaseMetrics {
  queryTime: {
    average: number;                 // < 50ms
    p95: number;                     // < 200ms
  };
  connections: {
    active: number;
    max: number;
  };
  databaseSize: number;              // MB
  indexUsage: number;                // > 90%
  cacheHitRate: number;              // > 95%
}

// Optimización:
// Query time > 100ms: revisar índices
// Cache hit rate < 90%: ajustar cache
```

### 3. Network Performance

#### API Call Metrics
```typescript
interface NetworkMetrics {
  steamApiCalls: {
    total: number;
    successful: number;
    failed: number;
    rateLimited: number;
    averageResponseTime: number;
  };
  bandwidthUsage: number;            // GB/month
  cdnHitRate: number;                // > 95%
  compressionRatio: number;          // > 70%
}

// Steam API limits:
// 100,000 calls/day
// Rate limit handling: exponential backoff
```

---

## 🌐 API Metrics

### 1. Endpoint Performance

#### Response Time by Endpoint
```typescript
interface EndpointMetrics {
  '/api/auth/steam/url': {
    averageTime: number;             // < 50ms
    requestCount: number;
    errorRate: number;
  };
  '/api/auth/steam/return': {
    averageTime: number;             // < 200ms
    requestCount: number;
    errorRate: number;
  };
  '/api/user/profile': {
    averageTime: number;             // < 500ms
    requestCount: number;
    cacheHitRate: number;
  };
  '/api/deals': {
    averageTime: number;             // < 300ms
    requestCount: number;
    personalizationRate: number;
  };
  '/api/recommendations/top-steam': {
    averageTime: number;             // < 800ms
    requestCount: number;
    relevanceScore: number;
  };
}
```

### 2. Cache Performance

#### Multi-Level Caching
```typescript
interface CacheMetrics {
  browserCache: {
    hitRate: number;                 // > 60%
    size: number;                    // MB
  };
  memoryCache: {
    hitRate: number;                 // > 80%
    evictionRate: number;
    size: number;                    // MB
  };
  steamApiCache: {
    hitRate: number;                 // > 90%
    ttl: number;                     // minutes
    size: number;                    // MB
  };
}
```

### 3. Error Tracking

#### Error Categories
```typescript
interface ErrorMetrics {
  clientErrors: {
    validationErrors: number;
    networkErrors: number;
    parsingErrors: number;
  };
  serverErrors: {
    steamApiErrors: number;
    databaseErrors: number;
    authenticationErrors: number;
    rateLimitErrors: number;
  };
  errorRate: number;                 // Total errors / total requests
}
```

---

## 🎮 Steam Integration Metrics

### 1. API Usage Efficiency

#### Steam API Call Optimization
```typescript
interface SteamApiMetrics {
  callsPerUser: {
    daily: number;                   // < 50
    monthly: number;                 // < 500
  };
  batchEfficiency: number;           // Calls saved by batching
  cacheEfficiency: number;          // Cache hit rate
  dataFreshness: number;             // Hours since last update
}

// Optimization targets:
// 90% of Steam data cached
// < 10 API calls per user session
```

### 2. Data Quality Metrics

#### Steam Data Completeness
```typescript
interface DataQualityMetrics {
  profileCompleteness: number;       // % users with complete profiles
  gamesWithAchievements: number;     // % games with achievement data
  genresIdentified: number;          // % games with genre data
  priceDataAvailable: number;       // % games with pricing info
  imageAvailability: number;          // % games with images
}

// Quality targets:
// > 95% profile completeness
// > 80% achievement coverage
```

### 3. Authentication Metrics

#### Steam OAuth Performance
```typescript
interface AuthMetrics {
  authInitiationRate: number;         // Auth starts / visitors
  authCompletionRate: number;        // Successful auth / initiated
  authFailureRate: number;           // Failed auth / initiated
  averageAuthTime: number;           // Seconds
  tokenRefreshRate: number;          // Token refreshes / day
}
```

---

## 🎯 Recommendation System Metrics

### 1. Algorithm Performance

#### Recommendation Quality
```typescript
interface RecommendationQuality {
  precision: number;                 // Relevant / recommended
  recall: number;                    // Relevant / total relevant
  f1Score: number;                   // Harmonic mean of precision/recall
  diversityScore: number;            // Intra-list diversity
  noveltyScore: number;              // Unexpectedness
  coverage: number;                  // Items recommended / total items
}

// Target metrics:
// Precision: > 0.3
// Recall: > 0.2
// F1 Score: > 0.25
// Diversity: > 0.7
```

### 2. User Feedback Integration

#### Implicit Feedback Metrics
```typescript
interface FeedbackMetrics {
  clickThroughRate: number;           // Clicks / impressions
  dwellTime: number;                 // Average time on recommendation
  addToWishlistRate: number;         // Wishlist additions / clicks
  purchaseRate: number;              // Purchases / clicks
  skipRate: number;                  // Recommendations skipped
}
```

### 3. Genre Analysis Accuracy

#### Genre Weighting Performance
```typescript
interface GenreMetrics {
  genrePredictionAccuracy: number;   // Correct genre predictions
  userSatisfactionScore: number;     // Self-reported satisfaction
  recommendationRelevance: number;    // User-rated relevance
  crossGenreSuccess: number;          // Success with mixed genres
}
```

---

## 📊 Monitoring & Alerting

### 1. Real-time Monitoring Dashboard

#### Key Metrics Dashboard
```typescript
interface DashboardMetrics {
  // Business KPIs
  currentMAU: number;
  dailyRevenue: number;
  conversionRate: number;
  
  // Technical Health
  apiResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  
  // User Engagement
  activeSessions: number;
  recommendationsGenerated: number;
  dealsClicked: number;
  
  // System Status
  databaseStatus: 'healthy' | 'degraded' | 'down';
  steamApiStatus: 'healthy' | 'rate_limited' | 'down';
  cacheStatus: 'healthy' | 'degraded';
}
```

### 2. Alert Thresholds

#### Critical Alerts (Immediate)
```typescript
interface CriticalAlerts {
  apiErrorRate: number;              // > 5%
  responseTimeP95: number;           // > 2s
  databaseConnectionFailure: boolean;
  steamApiRateLimit: boolean;
  memoryUsage: number;               // > 90%
  diskSpace: number;                 // > 95%
}
```

#### Warning Alerts (Within 1 hour)
```typescript
interface WarningAlerts {
  apiErrorRate: number;              // > 2%
  responseTimeP95: number;           // > 1s
  cpuUsage: number;                 // > 80%
  cacheHitRate: number;              // < 80%
  steamApiCallsNearLimit: boolean;   // > 80% of daily limit
}
```

### 3. Health Checks

#### Service Health Endpoints
```typescript
interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: HealthStatus;
    steamApi: HealthStatus;
    cache: HealthStatus;
    recommendationEngine: HealthStatus;
  };
  metrics: {
    uptime: number;
    version: string;
    lastDeployment: string;
  };
}
```

---

## 📈 Data Collection & Analysis

### 1. Event Tracking

#### User Interaction Events
```typescript
interface UserEvent {
  eventType: 'page_view' | 'click' | 'scroll' | 'hover' | 'form_submit';
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: {
    page?: string;
    element?: string;
    action?: string;
    value?: any;
  };
}
```

#### Business Events
```typescript
interface BusinessEvent {
  eventType: 'auth_completed' | 'profile_analyzed' | 'recommendation_generated' | 'deal_clicked';
  userId?: string;
  timestamp: string;
  properties: {
    steamId?: string;
    genres?: string[];
    gamesAnalyzed?: number;
    recommendationScore?: number;
    dealValue?: number;
    discount?: number;
  };
}
```

### 2. Analytics Implementation

#### Google Analytics 4 Events
```typescript
// Custom events for GA4
gtag('event', 'steam_auth_completed', {
  user_id: hashedSteamId,
  method: 'steam_oauth'
});

gtag('event', 'recommendation_clicked', {
  user_id: hashedSteamId,
  game_id: appId,
  genre: gameGenre,
  score: recommendationScore
});

gtag('event', 'deal_clicked', {
  user_id: hashedSteamId,
  deal_id: dealId,
  discount: discountPercentage,
  value: dealValue
});
```

### 3. Data Retention & Privacy

#### Data Lifecycle Management
```typescript
interface DataRetentionPolicy {
  userInteractions: {
    retention: '12_months';
    anonymization: true;
  };
  performanceMetrics: {
    retention: '6_months';
    anonymization: true;
  };
  errorLogs: {
    retention: '3_months';
    anonymization: true;
  };
  steamData: {
    retention: 'until_user_deletion';
    encryption: true;
  };
}
```

---

## 🎯 Success Metrics & Targets

### 1. 30-Day Targets
- **MAU**: 5,000 users
- **Conversion Rate**: 3%
- **API Response Time**: < 300ms (p95)
- **User Engagement**: > 4 pages/session
- **Recommendation CTR**: > 12%

### 2. 90-Day Targets
- **MAU**: 15,000 users
- **Revenue**: €2,500/month
- **Steam API Efficiency**: 95% cache hit rate
- **User Retention**: 40% monthly retention
- **Deal Conversion**: 2.5%

### 3. 180-Day Targets
- **MAU**: 50,000 users
- **Revenue**: €10,000/month
- **Recommendation Accuracy**: > 75%
- **User Satisfaction**: > 4.2/5
- **Technical Performance**: 99.9% uptime

---

## 🔧 Implementation Notes

### 1. Monitoring Stack
- **Frontend**: Google Analytics 4 + Sentry
- **Backend**: Prometheus + Grafana
- **Logs**: Winston + ELK Stack
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot + Pingdom

### 2. Data Pipeline
```typescript
// Event collection pipeline
User Event → Event Bus → Analytics Service → Data Warehouse → Dashboard
     ↓              ↓                ↓              ↓
Real-time     Validation      Aggregation    Visualization
Alerts        Enrichment      Storage         Reporting
```

### 3. Privacy Compliance
- **GDPR Compliance**: User consent for analytics
- **Data Minimization**: Collect only necessary data
- **Right to Deletion**: Complete data removal
- **Data Portability**: Export user data on request

---

## 📊 Reporting Schedule

### Daily Reports
- Active users and sessions
- API performance metrics
- Error rates and system health
- Revenue from deals

### Weekly Reports
- User acquisition and retention
- Recommendation system performance
- Steam API usage and efficiency
- Engagement trends

### Monthly Reports
- Business KPIs and growth
- Technical performance trends
- User satisfaction surveys
- Competitive analysis

---

Este sistema de métricas proporciona una visión completa del rendimiento de GameWasters en todos los niveles: negocio, usuario y técnico. Las métricas están diseñadas para ser accionables y permitir optimizaciones continuas de la plataforma.
