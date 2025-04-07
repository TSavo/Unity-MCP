import { v4 as uuidv4 } from 'uuid';
import { OperationExecutor, OperationOptions, OperationResult, OperationStatus, ProgressCallback } from './types';
import logger from '../utils/logger';
import { timeout, createCancelablePromise, CancelablePromise } from './timeout-util';

/**
 * Operation class
 *
 * Represents an asynchronous operation that can be executed, cancelled, and report progress.
 */
export class Operation<T> {
  private readonly logId: string;
  private readonly executor: OperationExecutor<T>;
  private readonly options: OperationOptions;
  private readonly abortController: AbortController;
  private cancelablePromise: CancelablePromise<T> | null = null;
  private timeoutPromise: Promise<T> | null = null;
  private latestProgress: any = null;
  private startTime: number = 0;
  private endTime: number = 0;
  private status: OperationStatus = OperationStatus.RUNNING;
  private result: T | undefined;
  private error: Error | null = null;

  /**
   * Constructor
   *
   * @param executor Function that executes the operation
   * @param options Operation options
   */
  constructor(executor: OperationExecutor<T>, options: OperationOptions) {
    this.logId = uuidv4();
    this.executor = executor;
    this.options = options;
    this.abortController = new AbortController();
  }

  /**
   * Execute the operation
   *
   * @returns Promise that resolves with the operation result
   */
  public async execute(): Promise<OperationResult<T>> {
    this.startTime = Date.now();
    this.status = OperationStatus.RUNNING;

    try {
      // Create a cancelable promise
      this.cancelablePromise = createCancelablePromise<T>((resolve, reject, onCancel) => {
        // Handle cancellation
        onCancel(() => {
          this.abortController.abort();
          this.status = OperationStatus.CANCELLED;
          this.endTime = Date.now();
          logger.info(`Operation cancelled: ${this.logId}`);
        });

        // Create a progress callback
        const onProgress: ProgressCallback = (progress) => {
          try {
            this.latestProgress = progress;
            if (this.options.onProgress) {
              this.options.onProgress(progress);
            }
          } catch (error) {
            logger.error(`Error in progress callback: ${error instanceof Error ? error.message : String(error)}`);
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
      this.timeoutPromise = timeout(this.cancelablePromise, {
        milliseconds: this.options.timeoutMs,
        message: `Operation timed out after ${this.options.timeoutMs}ms`
      });

      // Execute the operation with timeout
      try {
        this.result = await this.timeoutPromise;
        this.status = OperationStatus.SUCCESS;
        this.endTime = Date.now();

        return this.createSuccessResult();
      } catch (error) {
        // Check if the error is a timeout error
        if (error instanceof Error && error.message.includes('timed out')) {
          this.status = OperationStatus.TIMEOUT;

          return this.createTimeoutResult();
        }

        // Handle other errors
        this.error = error instanceof Error ? error : new Error(String(error));
        this.status = OperationStatus.ERROR;
        this.endTime = Date.now();

        return this.createErrorResult();
      }
    } catch (error) {
      // Handle unexpected errors
      this.error = error instanceof Error ? error : new Error(String(error));
      this.status = OperationStatus.ERROR;
      this.endTime = Date.now();

      return this.createErrorResult();
    }
  }

  /**
   * Cancel the operation
   */
  public cancel(): void {
    if (this.cancelablePromise) {
      this.cancelablePromise.cancel();
    }
  }

  /**
   * Get the operation result
   *
   * @returns Operation result
   */
  public getResult(): OperationResult<T> {
    switch (this.status) {
      case OperationStatus.SUCCESS:
        return this.createSuccessResult();
      case OperationStatus.ERROR:
        return this.createErrorResult();
      case OperationStatus.TIMEOUT:
        return this.createTimeoutResult();
      case OperationStatus.CANCELLED:
        return this.createCancelledResult();
      case OperationStatus.RUNNING:
      default:
        return this.createRunningResult();
    }
  }

  /**
   * Get the operation log ID
   *
   * @returns Operation log ID
   */
  public getLogId(): string {
    return this.logId;
  }

  /**
   * Get the operation status
   *
   * @returns Operation status
   */
  public getStatus(): OperationStatus {
    return this.status;
  }

  /**
   * Check if the operation is complete
   *
   * @returns True if the operation is complete, false otherwise
   */
  public isComplete(): boolean {
    return this.status !== OperationStatus.RUNNING;
  }

  /**
   * Get the latest progress
   *
   * @returns Latest progress
   */
  public getLatestProgress(): any {
    return this.latestProgress;
  }

  /**
   * Create a success result
   *
   * @returns Success result
   */
  private createSuccessResult(): OperationResult<T> {
    return {
      status: OperationStatus.SUCCESS,
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
  private createErrorResult(): OperationResult<T> {
    return {
      status: OperationStatus.ERROR,
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
  private createTimeoutResult(): OperationResult<T> {
    return {
      status: OperationStatus.TIMEOUT,
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
  private createCancelledResult(): OperationResult<T> {
    return {
      status: OperationStatus.CANCELLED,
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
  private createRunningResult(): OperationResult<T> {
    return {
      status: OperationStatus.RUNNING,
      logId: this.logId,
      partialResult: this.latestProgress,
      isComplete: false,
      startTime: this.startTime,
      message: 'Operation is still running'
    };
  }
}
