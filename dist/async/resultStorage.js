"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultStorage = void 0;
const types_1 = require("./types");
/**
 * ResultStorage class
 *
 * Stores and retrieves operation results.
 */
class ResultStorage {
    constructor() {
        this.results = new Map();
        this.runningOperations = new Map();
    }
    /**
     * Store a result
     *
     * @param logIdOrResult Log ID or operation result
     * @param result Operation result (optional)
     */
    storeResult(logIdOrResult, result) {
        if (typeof logIdOrResult === 'string' && result) {
            // First overload: logId and result
            this.results.set(logIdOrResult, result);
        }
        else if (typeof logIdOrResult === 'object' && logIdOrResult.logId) {
            // Second overload: result with logId
            this.results.set(logIdOrResult.logId, logIdOrResult);
        }
        else {
            throw new Error('Invalid arguments to storeResult');
        }
    }
    /**
     * Get a result
     *
     * @param logId Log ID
     * @returns Operation result or null if not found
     */
    getResult(logId) {
        return this.results.get(logId) || null;
    }
    /**
     * Register a running operation
     *
     * @param logId Log ID
     * @param cancelFn Function to cancel the operation
     */
    registerRunningOperation(logId, cancelFn) {
        this.runningOperations.set(logId, { cancel: cancelFn });
    }
    /**
     * Unregister a running operation
     *
     * @param logId Log ID
     */
    unregisterRunningOperation(logId) {
        this.runningOperations.delete(logId);
    }
    /**
     * Cancel an operation
     *
     * @param logId Log ID
     * @returns true if the operation was cancelled, false otherwise
     */
    cancelOperation(logId) {
        const operation = this.runningOperations.get(logId);
        if (operation) {
            operation.cancel();
            this.unregisterRunningOperation(logId);
            // Update the result to indicate cancellation
            const result = this.getResult(logId);
            if (result) {
                result.status = types_1.OperationStatus.CANCELLED;
                result.isComplete = true;
                result.endTime = Date.now();
                result.message = 'Operation cancelled by user';
                this.storeResult(logId, result);
            }
            return true;
        }
        return false;
    }
    /**
     * List all operations
     *
     * @returns Array of operation info
     */
    listOperations() {
        return Array.from(this.results.entries()).map(([logId, result]) => ({
            logId: logId,
            status: result.status,
            isComplete: result.isComplete,
            startTime: result.startTime || 0,
            endTime: result.endTime,
            operationType: typeof result.result
        }));
    }
    /**
     * Clear all results
     */
    clearResults() {
        this.results.clear();
    }
    /**
     * Get the number of stored results
     */
    getResultCount() {
        return this.results.size;
    }
    /**
     * Get the number of running operations
     */
    getRunningOperationCount() {
        return this.runningOperations.size;
    }
}
exports.ResultStorage = ResultStorage;
