import { ProgressCallback } from './types';
import logger from '../utils/logger';

/**
 * AsyncOperation class
 *
 * Represents an asynchronous operation that can be executed, cancelled, and report progress.
 */
export class AsyncOperation<T = any> {
  private executor: (
    resolve: (value: T) => void,
    reject: (error: Error) => void,
    reportProgress: ProgressCallback
  ) => void;

  private isCancelled: boolean = false;
  private latestProgress: any = null;

  /**
   * Constructor
   *
   * @param executor Function that executes the operation
   */
  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (error: Error) => void,
      reportProgress: ProgressCallback
    ) => void
  ) {
    this.executor = executor;
  }

  /**
   * Execute the operation
   *
   * @param progressCallback Callback for progress updates
   * @returns Promise that resolves with the operation result
   */
  public execute(progressCallback?: ProgressCallback): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Create a safe progress reporting function
      const reportProgress = (progress: any) => {
        try {
          this.latestProgress = progress;
          if (progressCallback && !this.isCancelled) {
            progressCallback(progress);
          }
        } catch (error) {
          // Don't let progress callback errors affect the operation
          logger.error(`Error in progress callback: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      // Create safe resolve/reject functions
      const safeResolve = (value: T) => {
        try {
          if (!this.isCancelled) {
            resolve(value);
          }
        } catch (error) {
          logger.error(`Error in resolve: ${error instanceof Error ? error.message : String(error)}`);
          reject(error);
        }
      };

      const safeReject = (error: Error) => {
        try {
          if (!this.isCancelled) {
            reject(error);
          }
        } catch (innerError) {
          logger.error(`Error in reject: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
          // Still try to reject with the original error
          reject(error);
        }
      };

      try {
        // Execute the operation
        this.executor(safeResolve, safeReject, reportProgress);
      } catch (error) {
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
  public cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Get the latest progress
   */
  public getLatestProgress(): any {
    return this.latestProgress;
  }

  /**
   * Check if the operation is cancelled
   */
  public isOperationCancelled(): boolean {
    return this.isCancelled;
  }
}
