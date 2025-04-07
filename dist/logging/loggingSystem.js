"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingSystem = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
/**
 * Logging system
 * This is a simple system for storing and retrieving logs
 */
class LoggingSystem {
    /**
     * Create a new logging system
     */
    constructor() {
        this.initialized = false;
        this.logsDir = path_1.default.join(process.cwd(), 'data', 'logs');
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!LoggingSystem.instance) {
            LoggingSystem.instance = new LoggingSystem();
        }
        return LoggingSystem.instance;
    }
    /**
     * Initialize the logging system
     */
    async ensureInitialized() {
        if (!this.initialized) {
            // Create logs directory if it doesn't exist
            if (!fs_1.default.existsSync(this.logsDir)) {
                fs_1.default.mkdirSync(this.logsDir, { recursive: true });
            }
            this.initialized = true;
        }
    }
    /**
     * Generate a unique ID
     */
    generateId() {
        return (0, uuid_1.v4)();
    }
    /**
     * Append to a log
     *
     * @param logName Log name
     * @param data Log data
     * @returns Log ID
     */
    async appendToLog(logName, data) {
        await this.ensureInitialized();
        const logId = this.generateId();
        const logEntry = {
            id: logId,
            name: logName,
            data,
            timestamp: new Date().toISOString()
        };
        try {
            // Get the log file path
            const logFilePath = path_1.default.join(this.logsDir, `${logName}.json`);
            // Read existing log entries or create an empty array
            let entries = [];
            if (fs_1.default.existsSync(logFilePath)) {
                const fileContent = fs_1.default.readFileSync(logFilePath, 'utf8');
                entries = JSON.parse(fileContent);
            }
            // Add the new entry
            entries.push(logEntry);
            // Write the updated entries back to the file
            fs_1.default.writeFileSync(logFilePath, JSON.stringify(entries, null, 2));
            logger_1.default.info(`Appended to log: ${logName}, ID: ${logId}`);
            return logId;
        }
        catch (error) {
            logger_1.default.error(`Error appending to log: ${error instanceof Error ? error.message : String(error)}`);
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
    async getLogByName(logName, limit = 10) {
        await this.ensureInitialized();
        try {
            // Get the log file path
            const logFilePath = path_1.default.join(this.logsDir, `${logName}.json`);
            // Check if the log file exists
            if (!fs_1.default.existsSync(logFilePath)) {
                logger_1.default.info(`Log not found: ${logName}`);
                return [];
            }
            // Read the log entries
            const fileContent = fs_1.default.readFileSync(logFilePath, 'utf8');
            const entries = JSON.parse(fileContent);
            // Sort by timestamp (newest first) and limit the number of entries
            const sortedEntries = entries
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
            logger_1.default.info(`Retrieved ${sortedEntries.length} entries for log: ${logName}`);
            return sortedEntries;
        }
        catch (error) {
            logger_1.default.error(`Error getting log by name: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get all logs
     *
     * @param limit Maximum number of logs to return
     * @returns Logs
     */
    async getLogs(limit = 10) {
        await this.ensureInitialized();
        try {
            // Get all log files
            const logFiles = fs_1.default.readdirSync(this.logsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => path_1.default.join(this.logsDir, file));
            // Get the most recent entry from each log
            const logEntries = [];
            for (const logFile of logFiles) {
                try {
                    const fileContent = fs_1.default.readFileSync(logFile, 'utf8');
                    const entries = JSON.parse(fileContent);
                    if (entries.length > 0) {
                        // Sort by timestamp (newest first) and get the most recent entry
                        const sortedEntries = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        logEntries.push(sortedEntries[0]);
                    }
                }
                catch (err) {
                    logger_1.default.warn(`Error reading log file ${logFile}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
            // Sort by timestamp (newest first) and limit the number of entries
            const sortedEntries = logEntries
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
            logger_1.default.info(`Retrieved ${sortedEntries.length} logs`);
            return sortedEntries;
        }
        catch (error) {
            logger_1.default.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Clear a log
     *
     * @param logName Log name
     * @returns True if the log was cleared, false if it didn't exist
     */
    async clearLog(logName) {
        await this.ensureInitialized();
        try {
            // Get the log file path
            const logFilePath = path_1.default.join(this.logsDir, `${logName}.json`);
            // Check if the log file exists
            if (!fs_1.default.existsSync(logFilePath)) {
                logger_1.default.info(`Log not found: ${logName}`);
                return false;
            }
            // Delete the log file
            fs_1.default.unlinkSync(logFilePath);
            logger_1.default.info(`Cleared log: ${logName}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error clearing log: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Dispose of the logging system
     */
    async dispose() {
        // Nothing to dispose
        this.initialized = false;
    }
}
exports.LoggingSystem = LoggingSystem;
