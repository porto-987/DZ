/**
 * Système de logging unifié pour l'application
 * 100% local et conforme aux standards algériens
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 
  | 'OCR' | 'FORMS' | 'PROCEDURES' | 'LEGAL' | 'SEARCH' 
  | 'ANALYTICS' | 'SECURITY' | 'PERFORMANCE' | 'UI' | 'NAVIGATION'
  | 'API' | 'CACHE' | 'VALIDATION' | 'WORKFLOW' | 'SYSTEM' | 'CLEANUP';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  source?: string;
  userId?: string;
  sessionId?: string;
}

class UnifiedLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite locale pour performance
  private isProduction = process.env.NODE_ENV === 'production';
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    source?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      source,
      sessionId: this.sessionId
    };
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Masquer les informations sensibles
      return data.replace(/password|token|secret|key/gi, '[MASKED]');
    }
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
        if (/password|token|secret|key/i.test(key)) {
          sanitized[key] = '[MASKED]';
        }
      });
      return sanitized;
    }
    return data;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    return true; // Développement : tous les logs
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any, source?: string) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, source);
    
    // Ajouter au stockage local
    this.logs.push(entry);
    
    // Limiter la taille du cache
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output uniquement en développement
    if (!this.isProduction) {
      const prefix = `[${level.toUpperCase()}] [${category}]${source ? ` [${source}]` : ''}`;
      const style = this.getConsoleStyle(level);
      
      console.groupCollapsed(`%c${prefix} ${message}`, style);
      if (data) console.log('Data:', data);
      console.log('Timestamp:', entry.timestamp);
      console.groupEnd();
    }

    // Stockage local pour analyse
    this.saveToLocalStorage(entry);
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: bold;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold; background: #FEF2F2;'
    };
    return styles[level];
  }

  private saveToLocalStorage(entry: LogEntry) {
    try {
      const storageKey = `dalil_logs_${new Date().toISOString().split('T')[0]}`;
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(entry);
      
      // Limiter les logs par jour
      if (existingLogs.length > 500) {
        existingLogs.splice(0, existingLogs.length - 500);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      // Silencieux en cas d'erreur de stockage
    }
  }

  // Méthodes publiques
  debug(category: LogCategory, message: string, data?: any, source?: string) {
    this.log('debug', category, message, data, source);
  }

  info(category: LogCategory, message: string, data?: any, source?: string) {
    this.log('info', category, message, data, source);
  }

  warn(category: LogCategory, message: string, data?: any, source?: string) {
    this.log('warn', category, message, data, source);
  }

  error(category: LogCategory, message: string, data?: any, source?: string) {
    this.log('error', category, message, data, source);
  }

  // Méthodes utilitaires
  getLogs(level?: LogLevel, category?: LogCategory): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (category && log.category !== category) return false;
      return true;
    });
  }

  clearLogs() {
    this.logs = [];
    // Nettoyer aussi le localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('dalil_logs_'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Méthodes de performance
  startTimer(category: LogCategory, operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(category, `Operation completed: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Méthodes spécialisées pour l'application
  ocrOperation(message: string, data?: any, source?: string) {
    this.info('OCR', message, data, source);
  }

  formValidation(message: string, data?: any, source?: string) {
    this.info('FORMS', message, data, source);
  }

  procedureStep(message: string, data?: any, source?: string) {
    this.info('PROCEDURES', message, data, source);
  }

  searchQuery(message: string, data?: any, source?: string) {
    this.info('SEARCH', message, data, source);
  }

  securityEvent(message: string, data?: any, source?: string) {
    this.warn('SECURITY', message, data, source);
  }

  performanceMetric(message: string, data?: any, source?: string) {
    this.info('PERFORMANCE', message, data, source);
  }
}

// Instance globale
export const logger = new UnifiedLogger();

// Fonctions utilitaires
export const logOCR = (message: string, data?: any, source?: string) => 
  logger.ocrOperation(message, data, source);

export const logForm = (message: string, data?: any, source?: string) => 
  logger.formValidation(message, data, source);

export const logProcedure = (message: string, data?: any, source?: string) => 
  logger.procedureStep(message, data, source);

export const logSearch = (message: string, data?: any, source?: string) => 
  logger.searchQuery(message, data, source);

export const logSecurity = (message: string, data?: any, source?: string) => 
  logger.securityEvent(message, data, source);

export const logPerformance = (message: string, data?: any, source?: string) => 
  logger.performanceMetric(message, data, source);

// Hook pour mesurer les performances
export const usePerformanceLogger = (category: LogCategory, operation: string) => {
  return logger.startTimer(category, operation);
};

export default logger;