/**
 * MCP Feedback Collector - Logger Utility
 */

import fs from 'fs';
import path from 'path';
import { LogLevel } from '../types/index.js';

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  silent: 999
};

// Log colors
const LOG_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[37m', // White
  silent: ''         // No color
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private currentLevel: LogLevel = 'info';
  private logFile?: string;
  private fileLoggingEnabled = false;
  private colorsDisabled = false;

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Disable color output (for MCP mode)
   */
  disableColors(): void {
    this.colorsDisabled = true;
  }

  /**
   * Enable file logging
   */
  enableFileLogging(logDir: string = 'logs'): void {
    try {
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Generate log filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = path.join(logDir, `mcp-debug-${timestamp}.log`);
      this.fileLoggingEnabled = true;

      // Write log file header
      const header = `=== MCP Feedback Collector Debug Log ===\n` +
                    `Start Time: ${new Date().toISOString()}\n` +
                    `Log Level: ${this.currentLevel}\n` +
                    `==========================================\n\n`;

      fs.writeFileSync(this.logFile, header);

      console.log(`📁 Log file created: ${this.logFile}`);
    } catch (error) {
      console.error('❌ Unable to create log file:', error);
      this.fileLoggingEnabled = false;
    }
  }

  /**
   * Check if the specified log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    // Don't output any logs in silent mode
    if (this.currentLevel === 'silent') {
      return false;
    }
    return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = this.formatTimestamp();
    const levelStr = level.toUpperCase().padEnd(5);

    let formattedMessage: string;

    if (this.colorsDisabled) {
      // No color mode (for MCP)
      formattedMessage = `[${timestamp}] ${levelStr} ${message}`;
    } else {
      // Color mode (for terminal)
      const color = LOG_COLORS[level];
      formattedMessage = `${color}[${timestamp}] ${levelStr}${RESET_COLOR} ${message}`;
    }

    if (args.length > 0) {
      const argsStr = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      formattedMessage += ` ${argsStr}`;
    }

    return formattedMessage;
  }

  /**
   * Output log
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, ...args);

    // Console output
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // File output (remove color codes)
    if (this.fileLoggingEnabled && this.logFile) {
      try {
        const cleanMessage = this.removeColorCodes(formattedMessage);
        fs.appendFileSync(this.logFile, cleanMessage + '\n');
      } catch (error) {
        console.error('❌ Failed to write to log file:', error);
      }
    }
  }

  /**
   * Remove color codes
   */
  private removeColorCodes(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Error log
   */
  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Warning log
   */
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Information log
   */
  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Debug log
   */
  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Record HTTP request
   */
  request(method: string, url: string, statusCode?: number, duration?: number): void {
    const parts = [method.toUpperCase(), url];
    if (statusCode !== undefined) parts.push(`${statusCode}`);
    if (duration !== undefined) parts.push(`${duration}ms`);
    
    this.info(`HTTP ${parts.join(' ')}`);
  }

  /**
   * Record WebSocket event
   */
  socket(event: string, sessionId?: string, data?: unknown): void {
    const parts = ['WebSocket', event];
    if (sessionId) parts.push(`session:${sessionId}`);
    
    this.debug(parts.join(' '), data);
  }

  /**
   * Record MCP tool call
   */
  mcp(tool: string, params?: unknown, result?: unknown): void {
    this.info(`MCP Tool: ${tool}`, { params, result });
  }
}

// Create global logger instance
export const logger = new Logger();

// Export log level type
export type { LogLevel };
