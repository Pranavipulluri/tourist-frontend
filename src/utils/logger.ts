type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100)));
    } catch (error) {
      // Ignore storage errors
    }
  }

  debug(message: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.debug(`[${entry.timestamp}] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.info(`[${entry.timestamp}] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
    
    console.warn(`[${entry.timestamp}] ${message}`, data);
  }

  error(message: string, error?: any): void {
    const entry = this.createLogEntry('error', message, error);
    this.addLog(entry);
    
    console.error(`[${entry.timestamp}] ${message}`, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  loadPersistedLogs(): void {
    try {
      const stored = localStorage.getItem('app_logs');
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        if (Array.isArray(parsedLogs)) {
          this.logs = parsedLogs;
        }
      }
    } catch (error) {
      // Ignore loading errors
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

// Initialize persisted logs
logger.loadPersistedLogs();
