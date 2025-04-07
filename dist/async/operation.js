"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = void 0;
const uuid_1 = require("uuid");
const types_1 = require("./types");
const logger_1 = __importDefault(require("../utils/logger"));
const timeout_util_1 = require("./timeout-util");
/**
 * Operation class
 *
 * Represents an asynchronous operation that can be executed, cancelled, and report progress.
 */
class Operation {
    /**
     * Constructor
     *
     * @param executor Function that executes the operation
     * @param options Operation options
     */
    constructor(executor, options) {
        this.cancelablePromise = null;
        this.timeoutPromise = null;
        this.latestProgress = null;
        this.startTime = 0;
        this.endTime = 0;
        this.status = types_1.OperationStatus.RUNNING;
        this.error = null;
        this.logId = (0, uuid_1.v4)();
        this.executor = executor;
        this.options = options;
        this.abortController = new AbortController();
    }
    /**
     * Execute the operation
     *
     * @returns Promise that resolves with the operation result
     */
    async execute() {
        this.startTime = Date.now();
        this.status = types_1.OperationStatus.RUNNING;
        try {
            // Create a cancelable promise
            this.cancelablePromise = (0, timeout_util_1.createCancelablePromise)((resolve, reject, onCancel) => {
                // Handle cancellation
                onCancel(() => {
                    this.abortController.abort();
                    this.status = types_1.OperationStatus.CANCELLED;
                    this.endTime = Date.now();
                    logger_1.default.info(`Operation cancelled: ${this.logId}`);
                });
                // Create a progress callback
                const onProgress = (progress) => {
                    try {
                        this.latestProgress = progress;
                        if (this.options.onProgress) {
                            this.options.onProgress(progress);
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error in progress callback: ${error instanceof Error ? error.message : String(error)}`);
                    }
                };
                // Execute the operation
                this.executor({
                    onProgress,
                    signal: this.abortController.signal
                })
                    .then(resolve)
                    .catch(reject);
            });
            // Create a timeout promise
            this.timeoutPromise = (0, timeout_util_1.timeout)(this.cancelablePromise, {
                milliseconds: this.options.timeoutMs,
                message: `Operation timed out after ${this.options.timeoutMs}ms`
            });
            // Execute the operation with timeout
            try {
                this.result = await this.timeoutPromise;
                this.status = types_1.OperationStatus.SUCCESS;
                this.endTime = Date.now();
                return this.createSuccessResult();
            }
            catch (error) {
                // Check if the error is a timeout error
                if (error instanceof Error && error.message.includes('timed out')) {
                    this.status = types_1.OperationStatus.TIMEOUT;
                    return this.createTimeoutResult();
                }
                // Handle other errors
                this.error = error instanceof Error ? error : new Error(String(error));
                this.status = types_1.OperationStatus.ERROR;
                this.endTime = Date.now();
                return this.createErrorResult();
            }
        }
        catch (error) {
            // Handle unexpected errors
            this.error = error instanceof Error ? error : new Error(String(error));
            this.status = types_1.OperationStatus.ERROR;
            this.endTime = Date.now();
            return this.createErrorResult();
        }
    }
    /**
     * Cancel the operation
     */
    cancel() {
        if (this.cancelablePromise) {
            this.cancelablePromise.cancel();
        }
    }
    /**
     * Get the operation result
     *
     * @returns Operation result
     */
    getResult() {
        switch (this.status) {
            case types_1.OperationStatus.SUCCESS:
                return this.createSuccessResult();
            case types_1.OperationStatus.ERROR:
                return this.createErrorResult();
            case types_1.OperationStatus.TIMEOUT:
                return this.createTimeoutResult();
            case types_1.OperationStatus.CANCELLED:
                return this.createCancelledResult();
            case types_1.OperationStatus.RUNNING:
            default:
                return this.createRunningResult();
        }
    }
    /**
     * Get the operation log ID
     *
     * @returns Operation log ID
     */
    getLogId() {
        return this.logId;
    }
    /**
     * Get the operation status
     *
     * @returns Operation status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Check if the operation is complete
     *
     * @returns True if the operation is complete, false otherwise
     */
    isComplete() {
        return this.status !== types_1.OperationStatus.RUNNING;
    }
    /**
     * Get the latest progress
     *
     * @returns Latest progress
     */
    getLatestProgress() {
        return this.latestProgress;
    }
    /**
     * Create a success result
     *
     * @returns Success result
     */
    createSuccessResult() {
        return {
            status: types_1.OperationStatus.SUCCESS,
            logId: this.logId,
            result: this.result,
            isComplete: true,
            startTime: this.startTime,
            endTime: this.endTime,
            message: 'Operation completed successfully'
        };
    }
    /**
     * Create an error result
     *
     * @returns Error result
     */
    createErrorResult() {
        return {
            status: types_1.OperationStatus.ERROR,
            logId: this.logId,
            error: this.error?.message || 'Unknown error',
            isComplete: true,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }
    /**
     * Create a timeout result
     *
     * @returns Timeout result
     */
    createTimeoutResult() {
        return {
            status: types_1.OperationStatus.TIMEOUT,
            logId: this.logId,
            partialResult: this.latestProgress,
            isComplete: false,
            startTime: this.startTime,
            message: `Operation timed out after ${this.options.timeoutMs}ms, but is still running in the background`
        };
    }
    /**
     * Create a cancelled result
     *
     * @returns Cancelled result
     */
    createCancelledResult() {
        return {
            status: types_1.OperationStatus.CANCELLED,
            logId: this.logId,
            partialResult: this.latestProgress,
            isComplete: true,
            startTime: this.startTime,
            endTime: this.endTime,
            message: 'Operation was cancelled'
        };
    }
    /**
     * Create a running result
     *
     * @returns Running result
     */
    createRunningResult() {
        return {
            status: types_1.OperationStatus.RUNNING,
            logId: this.logId,
            partialResult: this.latestProgress,
            isComplete: false,
            startTime: this.startTime,
            message: 'Operation is still running'
        };
    }
}
exports.Operation = Operation;
