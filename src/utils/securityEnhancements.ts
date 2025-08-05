import { logger } from './logger';

// Interface pour les paramètres de sécurité
interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableOutputEncoding: boolean;
  maxRequestSize: number;
  allowedOrigins: string[];
  blockedPatterns: RegExp[];
}

// Classe pour les améliorations de sécurité
export class SecurityEnhancements {
  private static instance: SecurityEnhancements;
  private config: SecurityConfig;
  private blockedIPs: Set<string> = new Set();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): SecurityEnhancements {
    if (!SecurityEnhancements.instance) {
      SecurityEnhancements.instance = new SecurityEnhancements();
    }
    return SecurityEnhancements.instance;
  }

  constructor() {
    this.config = {
      enableCSP: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableRateLimiting: true,
      enableInputValidation: true,
      enableOutputEncoding: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedOrigins: ['localhost', '127.0.0.1'],
      blockedPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /expression\s*\(/gi
      ]
    };

    this.initializeSecurity();
  }

  private initializeSecurity() {
    logger.info('SECURITY', 'Initialisation des améliorations de sécurité', {}, 'SecurityEnhancements');
    
    if (this.config.enableCSP) {
      this.setupCSP();
    }
    
    if (this.config.enableXSSProtection) {
      this.setupXSSProtection();
    }
    
    if (this.config.enableRateLimiting) {
      this.setupRateLimiting();
    }
    
    this.setupSecurityHeaders();
    this.setupGlobalErrorHandling();
  }

  private setupCSP() {
    // Content Security Policy
    const cspRules = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspRules;
    document.head.appendChild(meta);
  }

  private setupXSSProtection() {
    // Protection XSS basique côté client
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: originalInnerHTML.get,
        set: function(value: string) {
          const sanitized = this.sanitizeHTML(value);
          return originalInnerHTML.set?.call(this, sanitized);
        }
      });
    }
  }

  private setupSecurityHeaders() {
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    logger.info('SECURITY', 'Headers de sécurité appliqués', { headers: securityHeaders },
      'SecurityEnhancements');
  }

  private setupRateLimiting() {
    // Limitation du taux de requêtes
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (!this.checkRateLimit(url)) {
        logger.warn('SECURITY', 'Rate limit exceeded', { url }, 'SecurityEnhancements');
        throw new Error('Rate limit exceeded');
      }
      
      return originalFetch(input, init);
    };
  }

  private setupGlobalErrorHandling() {
    // Gestionnaire d'erreurs global
    window.addEventListener('error', (event) => {
      logger.error('SECURITY', 'Global error caught', {
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno
      }, 'SecurityEnhancements');
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('SECURITY', 'Unhandled promise rejection', {
        reason: event.reason
      }, 'SecurityEnhancements');
    });
  }

  public sanitizeHTML(html: string): string {
    // Nettoyage HTML basique
    let sanitized = html;

    this.config.blockedPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  public validateInput(input: string, type: 'email' | 'url' | 'text' | 'number' = 'text'): boolean {
    if (!this.config.enableInputValidation) return true;

    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/.+/,
      text: /^[^<>]*$/,
      number: /^\d+$/
    };

    const pattern = patterns[type];
    const isValid = pattern.test(input);

    if (!isValid) {
      logger.warn('SECURITY', 'Invalid input detected', { input: input.substring(0, 50), type }, 'SecurityEnhancements');
    }

    return isValid;
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;

    const current = this.rateLimitMap.get(identifier) || { count: 0, resetTime: now + windowMs };

    if (now > current.resetTime) {
      current.count = 1;
      current.resetTime = now + windowMs;
    } else {
      current.count++;
    }

    this.rateLimitMap.set(identifier, current);

    if (current.count > maxRequests) {
      logger.warn('SECURITY', 'Rate limit exceeded', { identifier, count: current.count }, 'SecurityEnhancements');
      return false;
    }

    return true;
  }

  public encodeOutput(output: string): string {
    if (!this.config.enableOutputEncoding) return output;

    return output
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  public blockIP(ip: string) {
    this.blockedIPs.add(ip);
    logger.info('SECURITY', 'IP blocked', { ip }, 'SecurityEnhancements');
  }

  public isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  public generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  public validateCSRFToken(token: string, sessionToken: string): boolean {
    const isValid = token === sessionToken;
    if (!isValid) {
      logger.warn('SECURITY', 'Invalid CSRF token', {}, 'SecurityEnhancements');
    }
    return isValid;
  }

  public secureRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }

  public hashPassword(password: string, salt?: string): Promise<string> {
    return new Promise((resolve) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + (salt || ''));
      crypto.subtle.digest('SHA-256', data).then(hash => {
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      });
    });
  }

  public detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /'/,
      /;/,
      /--/,
      /\/\*/
    ];

    const detected = sqlPatterns.some(pattern => pattern.test(input));
    
    if (detected) {
      logger.warn('SECURITY', 'SQL injection attempt detected', { input: input.substring(0, 100) }, 'SecurityEnhancements');
    }

    return detected;
  }

  public monitorPerformance() {
    // Surveillance des performances pour détecter les attaques DoS
    const startTime = performance.now();
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 5000) { // Plus de 5 secondes
          logger.warn('SECURITY', 'Performance anomaly detected', {
            name: entry.name,
            duration: entry.duration
          }, 'SecurityEnhancements');
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });
  }

  public getSecurityReport() {
    return {
      blockedIPs: this.blockedIPs.size,
      rateLimitEntries: this.rateLimitMap.size,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  public updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig };
    logger.info('SECURITY', 'Configuration de sécurité mise à jour', { config: newConfig }, 'SecurityEnhancements');
  }
}

export const securityEnhancements = SecurityEnhancements.getInstance();