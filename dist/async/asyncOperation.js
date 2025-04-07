"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncOperation = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * AsyncOperation class
 *
 * Represents an asynchronous operation that can be executed, cancelled, and report progress.
 */
class AsyncOperation {
    /**
     * Constructor
     *
     * @param executor Function that executes the operation
     */
    constructor(executor) {
        this.isCancelled = false;
        this.latestProgress = null;
        this.executor = executor;
    }
    /**
     * Execute the operation
     *
     * @param progressCallback Callback for progress updates
     * @returns Promise that resolves with the operation result
     */
    execute(progressCallback) {
        return new Promise((resolve, reject) => {
            // Create a safe progress reporting function
            const reportProgress = (progress) => {
                try {
                    this.latestProgress = progress;
                    if (progressCallback && !this.isCancelled) {
                        progressCallback(progress);
                    }
                }
                catch (error) {
                    // Don't let progress callback errors affect the operation
                    logger_1.default.error(`Error in progress callback: ${error instanceof Error ? error.message : String(error)}`);
                }
            };
            // Create safe resolve/reject functions
            const safeResolve = (value) => {
                try {
                    if (!this.isCancelled) {
                        resolve(value);
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error in resolve: ${error instanceof Error ? error.message : String(error)}`);
                    reject(error);
                }
            };
            const safeReject = (error) => {
                try {
                    if (!this.isCancelled) {
                        reject(error);
                    }
                }
                catch (innerError) {
                    logger_1.default.error(`Error in reject: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
                    // Still try to reject with the original error
                    reject(error);
                }
            };
            try {
                // Execute the operation
                this.executor(safeResolve, safeReject, reportProgress);
            }
            catch (error) {
                // Handle synchronous errors
                if (!this.isCancelled) {
                    safeReject(error instanceof Error ? error : new Error(String(error)));
                }
            }
        });
    }
    /**
     * Cancel the operation
     */
    cancel() {
        this.isCancelled = true;
    }
    /**
     * Get the latest progress
     */
    getLatestProgress() {
        return this.latestProgress;
    }
    /**
     * Check if the operation is cancelled
     */
    isOperationCancelled() {
        return this.isCancelled;
    }
}
exports.AsyncOperation = AsyncOperation;
