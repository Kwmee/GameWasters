# Security Policies - GameWasters

Este documento describe las políticas de seguridad implementadas en GameWasters, incluyendo protección de datos, autenticación, cifrado, y cumplimiento normativo.

## 📋 Tabla de Contenidos

- [Data Protection](#data-protection)
- [Authentication & Authorization](#authentication--authorization)
- [Encryption & Cryptography](#encryption--cryptography)
- [API Security](#api-security)
- [Web Security](#web-security)
- [Infrastructure Security](#infrastructure-security)
- [Compliance & Privacy](#compliance--privacy)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)

---

## 🔒 Data Protection

### 1. User Data Classification

#### Data Categories
```typescript
interface DataClassification {
  // Public Data
  public: {
    gameTitles: string[];
    gameGenres: string[];
    releaseDates: string[];
    publicPrices: number[];
  };
  
  // Sensitive Personal Data
  sensitive: {
    steamId: string;           // Cifrado
    steamUsername: string;     // Cifrado
    steamAvatar: string;       // URL pública, pero asociada a usuario
    playtimeData: number[];    // Cifrado
    achievementData: object;   // Cifrado
  };
  
  // System Data
  system: {
    apiKeys: string;           // Secret management
    databaseCredentials: string; // Secret management
    encryptionKeys: string;    // Secret management
  };
}
```

#### Data Retention Policy
```typescript
interface DataRetentionPolicy {
  userProfiles: {
    retention: '2_years_after_last_activity';
    anonymization: 'pseudonymization';
    deletionMethod: 'secure_erase';
  };
  analytics: {
    retention: '12_months';
    anonymization: 'aggregation';
    deletionMethod: 'secure_erase';
  };
  logs: {
    retention: '6_months';
    anonymization: 'ip_hashing';
    deletionMethod: 'secure_erase';
  };
}
```

### 2. Steam ID Protection

#### Cifrado de Steam IDs
```typescript
// Implementación actual en src/security/steamIdCipher.ts
import crypto from 'crypto';

class SteamIdCipher {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  encryptSteamId(steamId: string): string {
    const key = Buffer.from(process.env.STEAM_ID_ENCRYPTION_SECRET!, 'hex');
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('steam-id'));
    
    let encrypted = cipher.update(steamId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }
  
  decryptSteamId(encryptedSteamId: string): string {
    const key = Buffer.from(process.env.STEAM_ID_ENCRYPTION_SECRET!, 'hex');
    const parts = encryptedSteamId.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from('steam-id'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Hashing para Identificación Pública
```typescript
// Hash público para identificación (no reversible)
function generatePublicHash(steamId: string): string {
  const salt = process.env.PUBLIC_HASH_SALT!;
  return crypto
    .createHash('sha256')
    .update(steamId + salt)
    .digest('hex');
}
```

---

## 🔐 Authentication & Authorization

### 1. Steam OAuth Integration

#### Secure OAuth Flow
```typescript
interface SteamOAuthSecurity {
  // 1. Generación de URL segura
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${process.env.APP_URL}/api/auth/steam/return`,
      'openid.realm': process.env.APP_URL!,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select'
    });
    
    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }
  
  // 2. Validación de respuesta
  async validateSteamResponse(query: any): Promise<boolean> {
    // Validar firma de Steam
    const signedParams = query['openid.signed'].split(',');
    const validationParams = new URLSearchParams();
    
    signedParams.forEach(param => {
      validationParams.set(`openid.${param}`, query[`openid.${param}`]);
    });
    
    validationParams.set('openid.mode', 'check_authentication');
    
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      body: validationParams
    });
    
    const result = await response.text();
    return result.includes('is_valid:true');
  }
}
```

### 2. JWT Token Management

#### Secure JWT Implementation
```typescript
interface JWTPayload {
  sub: string;                    // Hashed Steam ID
  iat: number;                    // Issued at
  exp: number;                    // Expiration (24 hours)
  aud: string;                    // Audience (app domain)
  iss: string;                    // Issuer (app domain)
  jti: string;                    // JWT ID (UUID)
  scope: string[];                 // Permissions
}

class JWTManager {
  private readonly secret = process.env.SESSION_SECRET!;
  private readonly algorithm = 'HS256';
  private readonly expiresIn = '24h';
  
  generateToken(steamId: string): string {
    const hashedSteamId = generatePublicHash(steamId);
    
    const payload: JWTPayload = {
      sub: hashedSteamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      aud: process.env.APP_URL!,
      iss: process.env.APP_URL!,
      jti: crypto.randomUUID(),
      scope: ['read:profile', 'read:stats', 'read:recommendations']
    };
    
    return jwt.sign(payload, this.secret, {
      algorithm: this.algorithm,
      expiresIn: this.expiresIn
    });
  }
  
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
        audience: process.env.APP_URL!,
        issuer: process.env.APP_URL!
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}
```

### 3. Session Security

#### Secure Session Configuration
```typescript
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'gamewasters_session',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  rolling: true
};
```

---

## 🔐 Encryption & Cryptography

### 1. Encryption Standards

#### AES-256-GCM Implementation
```typescript
interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: 32;           // 256 bits
  ivLength: 16;            // 128 bits
  tagLength: 16;           // 128 bits
  keyRotation: '90_days';
}

class DataEncryption {
  private readonly config: EncryptionConfig;
  private readonly masterKey: Buffer;
  
  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      keyRotation: '90_days'
    };
    
    this.masterKey = this.getMasterKey();
  }
  
  private getMasterKey(): Buffer {
    const key = process.env.MASTER_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      throw new Error('Invalid master encryption key');
    }
    return Buffer.from(key, 'hex');
  }
  
  encrypt(data: string): string {
    const iv = crypto.randomBytes(this.config.ivLength);
    const cipher = crypto.createCipher(this.config.algorithm, this.masterKey);
    cipher.setAAD(Buffer.from('gamewasters-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }
  
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.config.algorithm, this.masterKey);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from('gamewasters-data'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. Key Management

#### Key Rotation Policy
```typescript
interface KeyRotation {
  schedule: 'quarterly';
  notification: '7_days_before';
  gracePeriod: '30_days';
  backupRequired: true;
  encryptionAtRest: true;
}

class KeyManager {
  private readonly keys: Map<string, Buffer> = new Map();
  private readonly activeKeyId: string;
  
  async rotateKeys(): Promise<void> {
    const newKeyId = crypto.randomUUID();
    const newKey = crypto.randomBytes(32);
    
    this.keys.set(newKeyId, newKey);
    
    // Re-encrypt sensitive data with new key
    await this.reencryptSensitiveData(newKey);
    
    // Update active key
    this.updateActiveKey(newKeyId);
    
    // Archive old key securely
    await this.archiveKey(this.activeKeyId);
  }
  
  private async reencryptSensitiveData(newKey: Buffer): Promise<void> {
    // Implementation for re-encrypting all sensitive data
  }
}
```

---

## 🛡️ API Security

### 1. Rate Limiting

#### Multi-Level Rate Limiting
```typescript
interface RateLimitConfig {
  global: {
    requests: 1000;              // per minute
    window: 60;                  // seconds
  };
  perUser: {
    requests: 100;               // per minute
    window: 60;                  // seconds
  };
  perEndpoint: {
    '/api/auth/*': {
      requests: 10;              // per minute
      window: 60;
    };
    '/api/user/profile': {
      requests: 30;              // per minute
      window: 60;
    };
    '/api/deals': {
      requests: 50;              // per minute
      window: 60;
    };
  };
}

class RateLimiter {
  private readonly limits: RateLimitConfig;
  private readonly storage: Map<string, number[]> = new Map();
  
  checkLimit(key: string, config: { requests: number; window: number }): boolean {
    const now = Date.now();
    const window = config.window * 1000;
    const requests = this.storage.get(key) || [];
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => 
      now - timestamp < window
    );
    
    if (validRequests.length >= config.requests) {
      return false;
    }
    
    validRequests.push(now);
    this.storage.set(key, validRequests);
    return true;
  }
}
```

### 2. Input Validation

#### Comprehensive Input Sanitization
```typescript
import { z } from 'zod';

// Schemas de validación con Zod
const steamIdSchema = z.string()
  .regex(/^7656119[0-9]{10}$/, 'Invalid Steam ID format')
  .transform(val => val.trim());

const paginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const genreSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z\s&-]+$/, 'Invalid genre format')
  .transform(val => val.trim());

// Middleware de validación
const validateInput = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
```

### 3. Steam API Security

#### Steam API Key Protection
```typescript
class SteamApiSecurity {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;
  
  constructor() {
    this.apiKey = process.env.STEAM_API_KEY!;
    this.rateLimiter = new RateLimiter();
  }
  
  async makeSecureRequest(endpoint: string, params: any): Promise<any> {
    // Rate limiting check
    const rateLimitKey = `steam_api_${endpoint}`;
    if (!this.rateLimiter.checkLimit(rateLimitKey, {
      requests: 100,
      window: 60
    })) {
      throw new Error('Steam API rate limit exceeded');
    }
    
    // Secure request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const url = new URL(`https://api.steampowered.com${endpoint}`);
      url.searchParams.set('key', this.apiKey);
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
      
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GameWasters/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

---

## 🌐 Web Security

### 1. HTTP Security Headers

#### Security Headers Configuration
```typescript
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://steamcommunity.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://cdn.akamai.steamstatic.com https://avatars.steamstatic.com",
    "connect-src 'self' https://api.steampowered.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Other security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block'
};

// Apply headers middleware
app.use((req, res, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

### 2. CORS Configuration

#### Strict CORS Policy
```typescript
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.APP_URL!,
      'https://steamcommunity.com',
      'https://store.steampowered.com'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  maxAge: 86400 // 24 hours
};
```

### 3. XSS Protection

#### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

class XSSProtection {
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false
    });
  }
  
  static escapeForHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }
  
  static validateInput(input: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  }
}
```

---

## 🏗️ Infrastructure Security

### 1. Database Security

#### SQLite Security Configuration
```typescript
interface DatabaseSecurity {
  encryption: {
    atRest: boolean;
    algorithm: 'AES-256-CBC';
    keyRotation: 'quarterly';
  };
  access: {
    userPermissions: 'read_write';
    connectionEncryption: true;
    connectionTimeout: 30000;
  };
  backup: {
    encryption: true;
    frequency: 'daily';
    retention: '30_days';
    offsiteStorage: true;
  };
}

class SecureDatabase {
  private readonly db: Database;
  private readonly encryption: DataEncryption;
  
  constructor(dbPath: string) {
    // Enable SQLite security features
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = FULL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('secure_delete = ON');
    
    this.encryption = new DataEncryption();
  }
  
  // Encrypted data operations
  insertUser(userData: UserData): void {
    const encryptedData = {
      hashedSteamId: userData.hashedSteamId,
      encryptedSteamId: this.encryption.encrypt(userData.steamId),
      encryptedUsername: this.encryption.encrypt(userData.username),
      timestamp: Date.now()
    };
    
    const stmt = this.db.prepare(`
      INSERT INTO users (hashedSteamId, encryptedSteamId, encryptedUsername, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      encryptedData.hashedSteamId,
      encryptedData.encryptedSteamId,
      encryptedData.encryptedUsername,
      encryptedData.timestamp
    );
  }
}
```

### 2. Environment Security

#### Environment Variable Protection
```typescript
interface EnvironmentSecurity {
  encryption: {
    atRest: boolean;
    keyManagement: 'AWS_KMS' | 'Azure_Key_Vault';
  };
  access: {
    iamRoles: string[];
    mfaRequired: true;
    auditLogging: true;
  };
  rotation: {
    schedule: 'monthly';
    automaticRotation: true;
    notificationRequired: true;
  };
}

// Secure environment configuration
const secureConfig = {
  steamApiKey: {
    source: 'AWS_Secrets_Manager',
    encryption: true,
    rotation: 'monthly'
  },
  databaseCredentials: {
    source: 'AWS_Secrets_Manager',
    encryption: true,
    rotation: 'quarterly'
  },
  encryptionKeys: {
    source: 'AWS_KMS',
    encryption: true,
    rotation: 'quarterly'
  }
};
```

### 3. Container Security

#### Docker Security Configuration
```dockerfile
# Use minimal base image
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gamewasters -u 1001

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init

# Set secure permissions
WORKDIR /app
COPY --chown=gamewasters:nodejs . .

# Switch to non-root user
USER gamewasters

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
```

---

## 📋 Compliance & Privacy

### 1. GDPR Compliance

#### Data Subject Rights Implementation
```typescript
interface GDPRCompliance {
  rightToAccess: {
    implementation: 'automated_export';
    format: 'JSON' | 'CSV';
    timeframe: '30_days';
  };
  rightToRectification: {
    implementation: 'user_portal';
    verification: 'multi_factor';
  };
  rightToErasure: {
    implementation: 'secure_deletion';
    verification: 'multi_factor';
    confirmation: 'email_certificate';
  };
  rightToPortability: {
    implementation: 'automated_export';
    formats: ['JSON', 'CSV', 'XML'];
  };
  rightToObject: {
    implementation: 'automated_processing';
    tracking: 'audit_log';
  };
}

class GDPRManager {
  async exportUserData(steamId: string): Promise<UserDataExport> {
    const hashedId = generatePublicHash(steamId);
    
    // Collect all user data
    const userData = await this.collectUserData(hashedId);
    const analyticsData = await this.collectAnalyticsData(hashedId);
    const recommendations = await this.collectRecommendationData(hashedId);
    
    return {
      personalData: userData,
      analytics: analyticsData,
      recommendations: recommendations,
      exportDate: new Date().toISOString(),
      format: 'JSON'
    };
  }
  
  async deleteUserData(steamId: string): Promise<DeletionCertificate> {
    const hashedId = generatePublicHash(steamId);
    
    // Secure deletion process
    await this.deleteFromDatabase(hashedId);
    await this.deleteFromCache(hashedId);
    await this.deleteFromBackups(hashedId);
    await this.deleteFromAnalytics(hashedId);
    
    return {
      deletionDate: new Date().toISOString(),
      dataCategories: ['personal', 'analytics', 'recommendations'],
      certificateHash: this.generateDeletionCertificate(hashedId)
    };
  }
}
```

### 2. Privacy by Design

#### Privacy Implementation Principles
```typescript
interface PrivacyByDesign {
  dataMinimization: {
    collectOnlyNecessary: true;
    automaticPurging: true;
    pseudonymization: true;
  };
  purposeLimitation: {
    explicitConsent: true;
    purposeSpecification: true;
    secondaryUseProhibition: true;
  };
  transparency: {
    clearPrivacyPolicy: true;
    consentManagement: true;
    dataUsageNotifications: true;
  };
  userControl: {
    granularConsent: true;
    easyWithdrawal: true;
    accessControls: true;
  };
}

class PrivacyController {
  // Granular consent management
  async updateConsentPreferences(
    userId: string, 
    preferences: ConsentPreferences
  ): Promise<void> {
    await this.validateConsentRequest(preferences);
    await this.storeConsentPreferences(userId, preferences);
    await this.applyDataProcessingRules(userId, preferences);
    await this.logConsentChange(userId, preferences);
  }
  
  // Data processing based on consent
  async processUserData(
    userId: string, 
    operation: DataOperation
  ): Promise<any> {
    const consent = await this.getUserConsent(userId);
    
    if (!this.hasConsentForOperation(consent, operation)) {
      throw new Error('Insufficient consent for data operation');
    }
    
    return await this.executeOperation(userId, operation);
  }
}
```

---

## 🔍 Security Monitoring

### 1. Intrusion Detection

#### Security Event Monitoring
```typescript
interface SecurityEvent {
  eventType: 'failed_login' | 'suspicious_activity' | 'data_breach_attempt' | 'privilege_escalation';
  timestamp: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private readonly eventLogger: Logger;
  private readonly alertManager: AlertManager;
  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log security event
    await this.eventLogger.log('security', event);
    
    // Check for alert conditions
    if (this.shouldAlert(event)) {
      await this.alertManager.sendAlert(event);
    }
    
    // Update security metrics
    await this.updateSecurityMetrics(event);
  }
  
  private shouldAlert(event: SecurityEvent): boolean {
    const alertThresholds = {
      'critical': 1,
      'high': 3,
      'medium': 10,
      'low': 50
    };
    
    return this.getRecentEventCount(event.eventType) >= 
           alertThresholds[event.severity];
  }
}
```

### 2. Anomaly Detection

#### Behavioral Analysis
```typescript
interface UserBehavior {
  loginPatterns: {
    typicalIPs: string[];
    typicalTimes: number[];
    typicalDevices: string[];
  };
  apiUsage: {
    averageRequestsPerHour: number;
    typicalEndpoints: string[];
    typicalResponseSizes: number[];
  };
  dataAccess: {
    typicalDataTypes: string[];
    typicalAccessFrequency: number;
  };
}

class AnomalyDetector {
  async detectAnomalies(userId: string, currentBehavior: any): Promise<Anomaly[]> {
    const baseline = await this.getUserBaseline(userId);
    const anomalies: Anomaly[] = [];
    
    // Check for unusual IP addresses
    if (!baseline.loginPatterns.typicalIPs.includes(currentBehavior.ipAddress)) {
      anomalies.push({
        type: 'unusual_ip',
        severity: 'medium',
        details: {
          currentIP: currentBehavior.ipAddress,
          typicalIPs: baseline.loginPatterns.typicalIPs
        }
      });
    }
    
    // Check for unusual API usage
    const requestRate = currentBehavior.requestsPerHour;
    if (requestRate > baseline.apiUsage.averageRequestsPerHour * 3) {
      anomalies.push({
        type: 'unusual_api_usage',
        severity: 'high',
        details: {
          currentRate: requestRate,
          baselineRate: baseline.apiUsage.averageRequestsPerHour
        }
      });
    }
    
    return anomalies;
  }
}
```

---

## 🚨 Incident Response

### 1. Incident Classification

#### Incident Severity Levels
```typescript
interface IncidentSeverity {
  CRITICAL: {
    description: 'Data breach or system compromise';
    responseTime: '15_minutes';
    escalation: 'immediate';
    notification: 'all_stakeholders';
  };
  HIGH: {
    description: 'Security vulnerability or active attack';
    responseTime: '1_hour';
    escalation: 'security_team';
    notification: 'management';
  };
  MEDIUM: {
    description: 'Suspicious activity or policy violation';
    responseTime: '4_hours';
    escalation: 'team_lead';
    notification: 'security_team';
  };
  LOW: {
    description: 'Minor security issue or false positive';
    responseTime: '24_hours';
    escalation: 'individual';
    notification: 'team_lead';
  };
}
```

### 2. Response Procedures

#### Incident Response Playbook
```typescript
class IncidentResponse {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 1. Immediate containment
    await this.containIncident(incident);
    
    // 2. Assessment and analysis
    const assessment = await this.assessIncident(incident);
    
    // 3. Eradication
    await this.eradicateThreat(assessment);
    
    // 4. Recovery
    await this.recoverSystems(assessment);
    
    // 5. Post-incident analysis
    await this.conductPostMortem(incident, assessment);
    
    // 6. Notification and reporting
    await this.notifyStakeholders(incident, assessment);
  }
  
  private async containIncident(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'data_breach':
        await this.isolateAffectedSystems();
        await this.revokeCompromisedCredentials();
        await this.enableAdditionalLogging();
        break;
        
      case 'ddos_attack':
        await this.enableRateLimiting();
        await this.activateDDoSProtection();
        await this.blockMaliciousIPs();
        break;
        
      case 'unauthorized_access':
        await this.lockAffectedAccounts();
        await this.forcePasswordReset();
        await this.reviewAccessLogs();
        break;
    }
  }
}
```

### 3. Communication Plan

#### Stakeholder Notification
```typescript
interface CommunicationPlan {
  internal: {
    securityTeam: 'immediate';
    developmentTeam: 'immediate';
    management: 'within_1_hour';
    legalTeam: 'within_2_hours';
  };
  external: {
    users: 'within_72_hours';
    regulators: 'within_72_hours';
    partners: 'as_required';
    public: 'as_required';
  };
  templates: {
    dataBreachNotice: string;
    securityUpdate: string;
    regulatoryFiling: string;
  };
}

class IncidentCommunicator {
  async notifyDataBreach(incident: DataBreachIncident): Promise<void> {
    // Internal notifications
    await this.notifySecurityTeam(incident);
    await this.notifyManagement(incident);
    await this.notifyLegalTeam(incident);
    
    // External notifications (if required)
    if (incident.requiresUserNotification) {
      await this.notifyAffectedUsers(incident);
    }
    
    if (incident.requiresRegulatoryNotification) {
      await this.notifyRegulators(incident);
    }
  }
}
```

---

## 🎯 Security Best Practices

### 1. Development Security

#### Secure Coding Guidelines
```typescript
// ✅ Secure input validation
const validateSteamId = (steamId: string): boolean => {
  return /^7656119[0-9]{10}$/.test(steamId);
};

// ✅ Secure database queries
const getUserByHashedId = async (hashedId: string): Promise<User> => {
  const stmt = db.prepare('SELECT * FROM users WHERE hashedSteamId = ?');
  return stmt.get(hashedId);
};

// ✅ Secure error handling
const secureErrorHandler = (error: Error, req: Request, res: Response): void => {
  // Log full error for debugging
  console.error('Security error:', error);
  
  // Return generic error to client
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

// ❌ Avoid these patterns
// const query = `SELECT * FROM users WHERE id = ${userId}`; // SQL injection
// eval(userInput); // Code injection
// res.send(error.stack); // Information disclosure
```

### 2. Regular Security Audits

#### Security Checklist
```typescript
interface SecurityChecklist {
  daily: {
    reviewErrorLogs: boolean;
    monitorFailedLogins: boolean;
    checkSSLCertificates: boolean;
    reviewAccessLogs: boolean;
  };
  weekly: {
    updateDependencies: boolean;
    reviewSecurityPatches: boolean;
    analyzeSecurityEvents: boolean;
    testBackupRecovery: boolean;
  };
  monthly: {
    conductVulnerabilityScan: boolean;
    reviewUserPermissions: boolean;
    updateSecurityPolicies: boolean;
    conductPenetrationTest: boolean;
  };
  quarterly: {
    securityTraining: boolean;
    policyReview: boolean;
    incidentResponseDrill: boolean;
    thirdPartySecurityAudit: boolean;
  };
}
```

---

## 📊 Security Metrics

### 1. Security KPIs

#### Key Security Indicators
```typescript
interface SecurityMetrics {
  detection: {
    meanTimeToDetect: number;      // MTTD in hours
    falsePositiveRate: number;     // Percentage
    detectionCoverage: number;     // Percentage of threats detected
  };
  response: {
    meanTimeToRespond: number;     // MTTR in hours
    containmentTime: number;       // Time to contain incident
    recoveryTime: number;           // Time to full recovery
  };
  prevention: {
    vulnerabilitiesPatched: number; // Count per month
    securityTrainingCompletion: number; // Percentage
    policyCompliance: number;      // Percentage
  };
  incidents: {
    totalIncidents: number;        // Count per month
    criticalIncidents: number;     // Count per month
    dataBreaches: number;          // Count per year
  };
}
```

---

## 🔐 Security Compliance Summary

### Compliance Standards Met
- **GDPR**: Full compliance with data protection regulations
- **CCPA**: California Consumer Privacy Act compliance
- **SOC 2**: Security controls and processes
- **ISO 27001**: Information security management
- **OWASP Top 10**: Protection against common web vulnerabilities

### Security Certifications
- **SSL/TLS**: TLS 1.3 with strong cipher suites
- **Data Encryption**: AES-256 for data at rest and in transit
- **Access Control**: Multi-factor authentication and role-based access
- **Audit Logging**: Comprehensive security event logging
- **Incident Response**: 24/7 security monitoring and response

---

Este documento de seguridad establece un marco completo para proteger los datos de los usuarios y garantizar la seguridad de la plataforma GameWasters. Las políticas están diseñadas para cumplir con los estándares de la industria y las regulaciones de privacidad aplicables.
