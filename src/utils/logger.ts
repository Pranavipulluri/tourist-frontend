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
export const logger = new Logger();

// Initialize persisted logs
logger.loadPersistedLogs();
