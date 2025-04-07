import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log entry
 */
export interface LogEntry {
  id?: string;
  name: string;
  data: any;
  timestamp: string;
}

/**
 * Logging system
 * This is a simple system for storing and retrieving logs
 */
export class LoggingSystem {
  private static instance: LoggingSystem;
  private logsDir: string;
  private initialized: boolean = false;

  /**
   * Create a new logging system
   */
  private constructor() {
    this.logsDir = path.join(process.cwd(), 'data', 'logs');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LoggingSystem {
    if (!LoggingSystem.instance) {
      LoggingSystem.instance = new LoggingSystem();
    }
    return LoggingSystem.instance;
  }

  /**
   * Initialize the logging system
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
      this.initialized = true;
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Append to a log
   *
   * @param logName Log name
   * @param data Log data
   * @returns Log ID
   */
  public async appendToLog(logName: string, data: any): Promise<string> {
    await this.ensureInitialized();

    const logId = this.generateId();
    const logEntry: LogEntry = {
      id: logId,
      name: logName,
      data,
      timestamp: new Date().toISOString()
    };

    try {
      // Get the log file path
      const logFilePath = path.join(this.logsDir, `${logName}.json`);

      // Read existing log entries or create an empty array
      let entries: LogEntry[] = [];
      if (fs.existsSync(logFilePath)) {
        const fileContent = fs.readFileSync(logFilePath, 'utf8');
        entries = JSON.parse(fileContent);
      }

      // Add the new entry
      entries.push(logEntry);

      // Write the updated entries back to the file
      fs.writeFileSync(logFilePath, JSON.stringify(entries, null, 2));

      logger.info(`Appended to log: ${logName}, ID: ${logId}`);
      return logId;
    } catch (error) {
      logger.error(`Error appending to log: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a log by name
   *
   * @param logName Log name
   * @param limit Maximum number of entries to return
   * @returns Log entries
   */
  public async getLogByName(logName: string, limit: number = 10): Promise<LogEntry[]> {
    await this.ensureInitialized();

    try {
      // Get the log file path
      const logFilePath = path.join(this.logsDir, `${logName}.json`);

      // Check if the log file exists
      if (!fs.existsSync(logFilePath)) {
        logger.info(`Log not found: ${logName}`);
        return [];
      }

      // Read the log entries
      const fileContent = fs.readFileSync(logFilePath, 'utf8');
      const entries: LogEntry[] = JSON.parse(fileContent);

      // Sort by timestamp (newest first) and limit the number of entries
      const sortedEntries = entries
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      logger.info(`Retrieved ${sortedEntries.length} entries for log: ${logName}`);
      return sortedEntries;
    } catch (error) {
      logger.error(`Error getting log by name: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all logs
   *
   * @param limit Maximum number of logs to return
   * @returns Logs
   */
  public async getLogs(limit: number = 10): Promise<LogEntry[]> {
    await this.ensureInitialized();

    try {
      // Get all log files
      const logFiles = fs.readdirSync(this.logsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.logsDir, file));

      // Get the most recent entry from each log
      const logEntries: LogEntry[] = [];

      for (const logFile of logFiles) {
        try {
          const fileContent = fs.readFileSync(logFile, 'utf8');
          const entries: LogEntry[] = JSON.parse(fileContent);

          if (entries.length > 0) {
            // Sort by timestamp (newest first) and get the most recent entry
            const sortedEntries = entries.sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            logEntries.push(sortedEntries[0]);
          }
        } catch (err) {
          logger.warn(`Error reading log file ${logFile}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      // Sort by timestamp (newest first) and limit the number of entries
      const sortedEntries = logEntries
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      logger.info(`Retrieved ${sortedEntries.length} logs`);
      return sortedEntries;
    } catch (error) {
      logger.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Clear a log
   *
   * @param logName Log name
   * @returns True if the log was cleared, false if it didn't exist
   */
  public async clearLog(logName: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Get the log file path
      const logFilePath = path.join(this.logsDir, `${logName}.json`);

      // Check if the log file exists
      if (!fs.existsSync(logFilePath)) {
        logger.info(`Log not found: ${logName}`);
        return false;
      }

      // Delete the log file
      fs.unlinkSync(logFilePath);

      logger.info(`Cleared log: ${logName}`);
      return true;
    } catch (error) {
      logger.error(`Error clearing log: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Dispose of the logging system
   */
  public async dispose(): Promise<void> {
    // Nothing to dispose
    this.initialized = false;
  }
}
