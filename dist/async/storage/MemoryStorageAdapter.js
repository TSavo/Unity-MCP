"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorageAdapter = void 0;
const types_1 = require("../types");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Memory storage adapter for storing operation results
 */
class MemoryStorageAdapter {
    constructor() {
        this.results = new Map();
        this.cancelFunctions = new Map();
    }
    /**
     * Store a result
     *
     * @param logIdOrResult Log ID or operation result
     * @param result Operation result (optional)
     */
    async storeResult(logIdOrResult, result) {
        try {
            let resultToStore;
            if (typeof logIdOrResult === 'string' && result) {
                // First overload: logId and result
                resultToStore = result;
            }
            else if (typeof logIdOrResult === 'object' && logIdOrResult.logId) {
                // Second overload: result with logId
                resultToStore = logIdOrResult;
            }
            else {
                throw new Error('Invalid arguments to storeResult');
            }
            // Store the result
            this.results.set(resultToStore.logId, resultToStore);
        }
        catch (error) {
            logger_1.default.error(`Error storing result: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get a result
     *
     * @param logId Log ID
     * @returns Operation result or null if not found
     */
    async getResult(logId) {
        try {
            // Find the result
            const result = this.results.get(logId);
            return result || null;
        }
        catch (error) {
            logger_1.default.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Register a cancellation function for a running operation
     *
     * @param logId Log ID
     * @param cancelFn Function to call to cancel the operation
     */
    async registerRunningOperation(logId, cancelFn) {
        try {
            // Store the cancel function
            this.cancelFunctions.set(logId, cancelFn);
        }
        catch (error) {
            logger_1.default.error(`Error registering operation: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Unregister a running operation
     *
     * @param logId Log ID
     */
    async unregisterRunningOperation(logId) {
        try {
            // Remove the cancel function
            this.cancelFunctions.delete(logId);
        }
        catch (error) {
            logger_1.default.error(`Error unregistering operation: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Cancel an operation
     *
     * @param logId Log ID
     * @returns True if the operation was cancelled, false otherwise
     */
    async cancelOperation(logId) {
        try {
            // Get the cancel function
            const cancelFn = this.cancelFunctions.get(logId);
            if (!cancelFn) {
                return false;
            }
            // Call the cancel function
            cancelFn();
            // Update the result
            const result = await this.getResult(logId);
            if (result) {
                result.status = types_1.OperationStatus.CANCELLED;
                result.isComplete = true;
                result.endTime = Date.now();
                result.message = 'Operation was cancelled';
                await this.storeResult(result);
            }
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * List all operations
     *
     * @returns Array of operation info
     */
    async listOperations() {
        try {
            // Convert to operation info
            return Array.from(this.results.values()).map(result => ({
                logId: result.logId,
                status: result.status,
                isComplete: result.isComplete,
                startTime: result.startTime || 0,
                endTime: result.endTime,
                operationType: typeof result.result
            }));
        }
        catch (error) {
            logger_1.default.error(`Error listing operations: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    /**
     * Clean up completed operations
     *
     * @param maxAge Maximum age in milliseconds
     */
    async cleanupCompletedOperations(maxAge) {
        try {
            const now = Date.now();
            const cutoff = now - maxAge;
            // Find completed operations that are older than the cutoff
            for (const [logId, result] of this.results.entries()) {
                if (result.isComplete && result.endTime && result.endTime < cutoff) {
                    this.results.delete(logId);
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Error cleaning up operations: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Close the storage adapter
     * This is used to clean up resources when the adapter is no longer needed
     */
    async close() {
        // Nothing to do for memory storage
    }
}
exports.MemoryStorageAdapter = MemoryStorageAdapter;
