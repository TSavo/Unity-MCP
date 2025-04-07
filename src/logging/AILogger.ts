import axios from 'axios';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Log entry data
 */
export interface LogEntryData {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * AILogger options
 */
export interface AILoggerOptions {
  /**
   * MCP server URL
   */
  mcpServerUrl?: string;
  
  /**
   * Default log level
   */
  defaultLevel?: LogLevel;
  
  /**
   * Whether to include timestamps automatically
   */
  includeTimestamps?: boolean;
}

/**
 * AILogger
 * 
 * A simple logger for AI tools that logs to the MCP server.
 * 
 * Example:
 * ```typescript
 * const logger = new AILogger('my-component');
 * logger.info('Hello, world!');
 * logger.error('Something went wrong', { error: 'Error message' });
 * ```
 */
export class AILogger {
  private logName: string;
  private mcpServerUrl: string;
  private defaultLevel: LogLevel;
  private includeTimestamps: boolean;

  /**
   * Create a new AILogger
   * 
   * @param logName Name of the log
   * @param options Logger options
   */
  constructor(logName: string, options: AILoggerOptions = {}) {
    this.logName = logName;
    this.mcpServerUrl = options.mcpServerUrl || 'http://localhost:8080';
    this.defaultLevel = options.defaultLevel || LogLevel.INFO;
    this.includeTimestamps = options.includeTimestamps !== false; // Default to true
  }

  /**
   * Log a message at the specified level
   * 
   * @param level Log level
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async log(level: LogLevel, message: string, data: Record<string, any> = {}): Promise<string> {
    try {
      // Create log entry data
      const logData: LogEntryData = {
        level,
        message,
        timestamp: this.includeTimestamps ? new Date().toISOString() : data.timestamp || new Date().toISOString(),
        ...data
      };

      // Send log to MCP server
      const response = await axios.post(`${this.mcpServerUrl}/logs/${this.logName}`, logData);
      
      return response.data.logId;
    } catch (error) {
      console.error(`Error logging to ${this.logName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Log a debug message
   * 
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async debug(message: string, data: Record<string, any> = {}): Promise<string> {
    return this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log an info message
   * 
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async info(message: string, data: Record<string, any> = {}): Promise<string> {
    return this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a warning message
   * 
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async warn(message: string, data: Record<string, any> = {}): Promise<string> {
    return this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an error message
   * 
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async error(message: string, data: Record<string, any> = {}): Promise<string> {
    return this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Log a fatal message
   * 
   * @param message Message to log
   * @param data Additional data to log
   * @returns Promise that resolves when the log is written
   */
  public async fatal(message: string, data: Record<string, any> = {}): Promise<string> {
    return this.log(LogLevel.FATAL, message, data);
  }

  /**
   * Clear the log
   * 
   * @returns Promise that resolves when the log is cleared
   */
  public async clear(): Promise<boolean> {
    try {
      const response = await axios.delete(`${this.mcpServerUrl}/logs/${this.logName}`);
      return response.data.cleared;
    } catch (error) {
      console.error(`Error clearing log ${this.logName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get log entries
   * 
   * @param limit Maximum number of entries to return
   * @returns Promise that resolves with the log entries
   */
  public async getEntries(limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.mcpServerUrl}/logs/${this.logName}`, {
        params: { limit }
      });
      
      return response.data.entries || [];
    } catch (error) {
      console.error(`Error getting log entries for ${this.logName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
