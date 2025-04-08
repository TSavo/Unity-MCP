"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILogger = exports.LogLevel = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
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
class AILogger {
    /**
     * Create a new AILogger
     *
     * @param logName Name of the log
     * @param options Logger options
     */
    constructor(logName, options = {}) {
        this.logName = logName;
        this.mcpServerUrl = options.mcpServerUrl || 'http://localhost:3030';
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
    async log(level, message, data = {}) {
        try {
            // Create log entry data
            const logData = {
                level,
                message,
                timestamp: this.includeTimestamps ? new Date().toISOString() : data.timestamp || new Date().toISOString(),
                ...data
            };
            // Send log to MCP server
            const response = await axios_1.default.post(`${this.mcpServerUrl}/logs/${this.logName}`, logData);
            return response.data.logId;
        }
        catch (error) {
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
    async debug(message, data = {}) {
        return this.log(LogLevel.DEBUG, message, data);
    }
    /**
     * Log an info message
     *
     * @param message Message to log
     * @param data Additional data to log
     * @returns Promise that resolves when the log is written
     */
    async info(message, data = {}) {
        return this.log(LogLevel.INFO, message, data);
    }
    /**
     * Log a warning message
     *
     * @param message Message to log
     * @param data Additional data to log
     * @returns Promise that resolves when the log is written
     */
    async warn(message, data = {}) {
        return this.log(LogLevel.WARN, message, data);
    }
    /**
     * Log an error message
     *
     * @param message Message to log
     * @param data Additional data to log
     * @returns Promise that resolves when the log is written
     */
    async error(message, data = {}) {
        return this.log(LogLevel.ERROR, message, data);
    }
    /**
     * Log a fatal message
     *
     * @param message Message to log
     * @param data Additional data to log
     * @returns Promise that resolves when the log is written
     */
    async fatal(message, data = {}) {
        return this.log(LogLevel.FATAL, message, data);
    }
    /**
     * Clear the log
     *
     * @returns Promise that resolves when the log is cleared
     */
    async clear() {
        try {
            const response = await axios_1.default.delete(`${this.mcpServerUrl}/logs/${this.logName}`);
            return response.data.cleared;
        }
        catch (error) {
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
    async getEntries(limit = 10) {
        try {
            const response = await axios_1.default.get(`${this.mcpServerUrl}/logs/${this.logName}`, {
                params: { limit }
            });
            return response.data.entries || [];
        }
        catch (error) {
            console.error(`Error getting log entries for ${this.logName}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.AILogger = AILogger;
