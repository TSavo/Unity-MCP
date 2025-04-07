"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncExecutionSystem = void 0;
const operation_1 = require("./operation");
const operationRegistry_1 = require("./operationRegistry");
const types_1 = require("./types");
const StorageAdapterFactory_1 = require("./storage/StorageAdapterFactory");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * AsyncExecutionSystem class
 *
 * Manages the execution of asynchronous operations.
 */
class AsyncExecutionSystem {
    /**
     * Constructor
     *
     * @param registry Optional operation registry
     * @param cleanupInterval Optional cleanup interval in milliseconds
     * @param maxOperationAge Optional maximum operation age in milliseconds
     */
    constructor(storageOptions = {}, cleanupInterval = 60000, // Default: 1 minute
    maxOperationAge = 3600000 // Default: 1 hour
    ) {
        this.maxOperationAge = maxOperationAge;
        this.defaultOptions = {
            timeoutMs: 30000 // Default timeout: 30 seconds
        };
        this.cleanupInterval = null;
        // Create the storage adapter
        this.storage = StorageAdapterFactory_1.StorageAdapterFactory.createAdapter(storageOptions);
        // Create the registry
        this.registry = new operationRegistry_1.OperationRegistry(this.storage);
        // Start the cleanup interval
        if (cleanupInterval > 0) {
            this.startCleanupInterval(cleanupInterval);
        }
    }
    /**
     * Execute an operation
     *
     * @param executor Operation executor function
     * @param options Operation options
     * @returns Operation result
     */
    async executeOperation(executor, options) {
        try {
            // Merge options with defaults
            const mergedOptions = {
                ...this.defaultOptions,
                ...options
            };
            // Create and register the operation
            const operation = new operation_1.Operation(executor, mergedOptions);
            await this.registry.registerOperation(operation);
            // Execute the operation
            const result = await operation.execute();
            // Store the result
            await this.storage.storeResult(result);
            // If the operation is complete, unregister it
            if (result.isComplete) {
                await this.registry.unregisterOperation(result.logId);
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`Error executing operation: ${error instanceof Error ? error.message : String(error)}`);
            return {
                status: types_1.OperationStatus.ERROR,
                logId: 'error',
                error: error instanceof Error ? error.message : String(error),
                isComplete: true
            };
        }
    }
    /**
     * Get a result by log ID
     *
     * @param logId Log ID
     * @returns Operation result
     */
    async getResult(logId) {
        try {
            // Try to get the result from the registry
            const result = await this.registry.getOperationResult(logId);
            if (!result) {
                return {
                    status: types_1.OperationStatus.ERROR,
                    logId,
                    error: `Result not found for log ID: ${logId}`,
                    isComplete: true
                };
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
            return {
                status: types_1.OperationStatus.ERROR,
                logId,
                error: error instanceof Error ? error.message : String(error),
                isComplete: true
            };
        }
    }
    /**
     * Cancel an operation
     *
     * @param logId Log ID
     * @returns Operation result
     */
    async cancelOperation(logId) {
        try {
            // Try to cancel the operation
            const cancelled = await this.registry.cancelOperation(logId);
            if (!cancelled) {
                return {
                    status: types_1.OperationStatus.ERROR,
                    logId,
                    error: `Operation not found for log ID: ${logId}`,
                    isComplete: true
                };
            }
            // Get the updated result
            const result = await this.getResult(logId);
            return {
                status: types_1.OperationStatus.SUCCESS,
                logId,
                message: `Operation cancelled: ${logId}`,
                isComplete: true
            };
        }
        catch (error) {
            logger_1.default.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
            return {
                status: types_1.OperationStatus.ERROR,
                logId,
                error: error instanceof Error ? error.message : String(error),
                isComplete: true
            };
        }
    }
    /**
     * List all operations
     *
     * @returns Array of operation info
     */
    async listOperations() {
        return await this.registry.listOperations();
    }
    /**
     * Start the cleanup interval
     *
     * @param interval Cleanup interval in milliseconds
     */
    startCleanupInterval(interval) {
        // Clear any existing interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Start a new interval
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.registry.cleanupCompletedOperations(this.maxOperationAge);
            }
            catch (error) {
                logger_1.default.error(`Error cleaning up operations: ${error instanceof Error ? error.message : String(error)}`);
            }
        }, interval);
        // Ensure the interval doesn't keep the process alive
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }
    /**
     * Stop the cleanup interval
     */
    stopCleanupInterval() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    /**
     * Dispose of the AsyncExecutionSystem
     */
    async dispose() {
        this.stopCleanupInterval();
        await this.storage.close();
    }
}
exports.AsyncExecutionSystem = AsyncExecutionSystem;
