"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationRegistry = void 0;
const types_1 = require("./types");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * OperationRegistry class
 *
 * Manages the registration and retrieval of operations.
 */
class OperationRegistry {
    /**
     * Constructor
     *
     * @param storage Storage adapter
     */
    constructor(storage) {
        this.operations = new Map();
        this.storage = storage;
    }
    /**
     * Register an operation
     *
     * @param operation Operation to register
     */
    async registerOperation(operation) {
        const logId = operation.getLogId();
        this.operations.set(logId, operation);
        // Register the operation with the storage adapter
        await this.storage.registerRunningOperation(logId, () => {
            operation.cancel();
        });
    }
    /**
     * Unregister an operation
     *
     * @param logId Operation log ID
     */
    async unregisterOperation(logId) {
        this.operations.delete(logId);
        // Unregister the operation with the storage adapter
        await this.storage.unregisterRunningOperation(logId);
    }
    /**
     * Get an operation
     *
     * @param logId Operation log ID
     * @returns Operation or null if not found
     */
    getOperation(logId) {
        return this.operations.get(logId) || null;
    }
    /**
     * Get an operation result
     *
     * @param logId Operation log ID
     * @returns Operation result or null if not found
     */
    async getOperationResult(logId) {
        // First, try to get the result from the in-memory operation
        const operation = this.getOperation(logId);
        if (operation) {
            const result = operation.getResult();
            // Store the result in the storage adapter
            await this.storage.storeResult(result);
            return result;
        }
        // If not found in memory, try to get it from the storage adapter
        return this.storage.getResult(logId);
    }
    /**
     * Cancel an operation
     *
     * @param logId Operation log ID
     * @returns True if the operation was cancelled, false otherwise
     */
    async cancelOperation(logId) {
        try {
            // First, try to cancel the in-memory operation
            const operation = this.getOperation(logId);
            if (operation) {
                operation.cancel();
                return true;
            }
            // If not found in memory, try to cancel it in the storage adapter
            return this.storage.cancelOperation(logId);
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
        // Get operations from the storage adapter
        const storageOperations = await this.storage.listOperations();
        // Get operations from memory
        const memoryOperations = Array.from(this.operations.values()).map(operation => {
            const result = operation.getResult();
            return {
                logId: result.logId,
                status: result.status,
                isComplete: result.isComplete,
                startTime: result.startTime || 0,
                endTime: result.endTime,
                operationType: typeof result.result
            };
        });
        // Combine the operations, with memory operations taking precedence
        const memoryLogIds = new Set(memoryOperations.map(op => op.logId));
        const combinedOperations = [
            ...memoryOperations,
            ...storageOperations.filter(op => !memoryLogIds.has(op.logId))
        ];
        return combinedOperations;
    }
    /**
     * Clean up completed operations
     *
     * @param maxAge Maximum age in milliseconds
     */
    async cleanupCompletedOperations(maxAge) {
        // Clean up operations in memory
        const now = Date.now();
        const operationsToUnregister = [];
        for (const [logId, operation] of this.operations.entries()) {
            if (operation.isComplete()) {
                const result = operation.getResult();
                if (result.endTime && now - result.endTime > maxAge) {
                    operationsToUnregister.push(logId);
                }
            }
        }
        // Unregister operations
        for (const logId of operationsToUnregister) {
            await this.unregisterOperation(logId);
        }
        // Clean up operations in storage
        await this.storage.cleanupCompletedOperations(maxAge);
    }
    /**
     * Get the number of operations
     *
     * @returns Number of operations
     */
    getOperationCount() {
        return this.operations.size;
    }
    /**
     * Get the number of running operations
     *
     * @returns Number of running operations
     */
    getRunningOperationCount() {
        return Array.from(this.operations.values()).filter(operation => operation.getStatus() === types_1.OperationStatus.RUNNING).length;
    }
}
exports.OperationRegistry = OperationRegistry;
