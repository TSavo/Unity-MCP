"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceManager = void 0;
const uuid_1 = require("uuid");
/**
 * Persistence manager for storing and retrieving results, logs, and pending operations
 */
class PersistenceManager {
    constructor() {
        this.results = new Map();
        this.logs = new Map();
        this.pendingOperations = new Map();
    }
    /**
     * Store a result with a log ID
     * @param logId The log ID
     * @param result The result
     */
    storeResult(logId, result) {
        // Add timestamp if not provided
        if (!result.timestamp) {
            result.timestamp = Date.now();
        }
        this.results.set(logId, result);
    }
    /**
     * Get a result by log ID
     * @param logId The log ID
     * @returns The result, or null if not found
     */
    getResult(logId) {
        return this.results.get(logId) || null;
    }
    /**
     * Store a pending operation
     * @param logId The log ID
     * @param operation The pending operation
     */
    storePendingOperation(logId, operation) {
        this.pendingOperations.set(logId, operation);
    }
    /**
     * Get a pending operation by log ID
     * @param logId The log ID
     * @returns The pending operation, or null if not found
     */
    getPendingOperation(logId) {
        return this.pendingOperations.get(logId) || null;
    }
    /**
     * Mark an operation as complete
     * @param logId The log ID
     * @param result The result
     */
    markOperationComplete(logId, result) {
        // Store the result
        result.complete = true;
        this.storeResult(logId, result);
        // Remove the pending operation
        this.pendingOperations.delete(logId);
    }
    /**
     * Check if an operation is complete
     * @param logId The log ID
     * @returns True if the operation is complete, false otherwise
     */
    isOperationComplete(logId) {
        const result = this.getResult(logId);
        return result !== null && result.complete === true;
    }
    /**
     * Store a log entry
     * @param logEntry The log entry
     * @returns The log ID
     */
    storeLog(logEntry) {
        const logId = (0, uuid_1.v4)();
        this.logs.set(logId, logEntry);
        return logId;
    }
    /**
     * Get a log entry by log ID
     * @param logId The log ID
     * @returns The log entry, or null if not found
     */
    getLog(logId) {
        return this.logs.get(logId) || null;
    }
    /**
     * Get logs with pagination
     * @param count The number of logs to retrieve
     * @param offset The offset for pagination
     * @returns The logs and total count
     */
    getLogs(count = 10, offset = 0) {
        // Convert the logs map to an array
        const logsArray = Array.from(this.logs.entries()).map(([id, log]) => ({
            id,
            ...log
        }));
        // Sort by timestamp in descending order
        logsArray.sort((a, b) => b.timestamp - a.timestamp);
        // Apply pagination
        const paginatedLogs = logsArray.slice(offset, offset + count);
        return {
            logs: paginatedLogs,
            total: logsArray.length
        };
    }
    /**
     * Clean up old results
     * @param maxAge The maximum age of results to keep (in milliseconds)
     * @returns The number of results cleaned up
     */
    cleanupOldResults(maxAge) {
        const now = Date.now();
        let cleanedCount = 0;
        // Clean up old results
        for (const [logId, result] of this.results.entries()) {
            if (result.timestamp && now - result.timestamp > maxAge) {
                this.results.delete(logId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
}
exports.PersistenceManager = PersistenceManager;
