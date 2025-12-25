
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogEntry['level'], message: string, component?: string, metadata?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      component,
      metadata
    };
  }

  info(message: string, component?: string, metadata?: Record<string, any>) {
    const entry = this.formatMessage('info', message, component, metadata);
    this.addLog(entry);
    
    if (!this.isProduction) {
      console.log(`[INFO] ${component ? `[${component}] ` : ''}${message}`, metadata || '');
    }
  }

  warn(message: string, component?: string, metadata?: Record<string, any>) {
    const entry = this.formatMessage('warn', message, component, metadata);
    this.addLog(entry);
    
    console.warn(`[WARN] ${component ? `[${component}] ` : ''}${message}`, metadata || '');
  }

  error(message: string, component?: string, metadata?: Record<string, any>) {
    const entry = this.formatMessage('error', message, component, metadata);
    this.addLog(entry);
    
    console.error(`[ERROR] ${component ? `[${component}] ` : ''}${message}`, metadata || '');
  }

  debug(message: string, component?: string, metadata?: Record<string, any>) {
    if (this.isProduction) return;
    
    const entry = this.formatMessage('debug', message, component, metadata);
    this.addLog(entry);
    
    console.debug(`[DEBUG] ${component ? `[${component}] ` : ''}${message}`, metadata || '');
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // تنظيف السجلات القديمة
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(level?: LogEntry['level'], component?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (component && log.component !== component) return false;
      return true;
    });
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }

  // تتبع الأداء
  startTimer(operation: string, component?: string) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.info(`Operation "${operation}" completed in ${duration.toFixed(2)}ms`, component, {
        operation,
        duration,
        startTime,
        endTime
      });
      
      return duration;
    };
  }

  // تتبع أخطاء React
  logReactError(error: Error, errorInfo: any, component?: string) {
    this.error(`React Error: ${error.message}`, component || 'React', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  // تتبع استعلامات قاعدة البيانات
  logDatabaseQuery(query: string, duration?: number, component?: string) {
    this.debug(`Database Query: ${query}`, component || 'Database', {
      query,
      duration
    });
  }

  // تتبع طلبات API
  logApiRequest(url: string, method: string, status?: number, duration?: number, component?: string) {
    const level = status && status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method} ${url} - Status: ${status}`, component || 'API', {
      url,
      method,
      status,
      duration
    });
  }

  private log(level: LogEntry['level'], message: string, component?: string, metadata?: Record<string, any>) {
    switch (level) {
      case 'info':
        this.info(message, component, metadata);
        break;
      case 'warn':
        this.warn(message, component, metadata);
        break;
      case 'error':
        this.error(message, component, metadata);
        break;
      case 'debug':
        this.debug(message, component, metadata);
        break;
    }
  }
}

export const logger = new Logger();

// Hook للاستخدام في المكونات
export const useLogger = (component: string) => {
  return {
    info: (message: string, metadata?: Record<string, any>) => logger.info(message, component, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.warn(message, component, metadata),
    error: (message: string, metadata?: Record<string, any>) => logger.error(message, component, metadata),
    debug: (message: string, metadata?: Record<string, any>) => logger.debug(message, component, metadata),
    startTimer: (operation: string) => logger.startTimer(operation, component)
  };
};
