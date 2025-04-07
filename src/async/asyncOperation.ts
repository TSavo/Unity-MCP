import { ProgressCallback } from './types';

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
      const reportProgress = (progress: any) => {
        this.latestProgress = progress;
        if (progressCallback) {
          progressCallback(progress);
        }
      };

      try {
        this.executor(
          (value) => {
            if (!this.isCancelled) {
              resolve(value);
            }
          },
          (error) => {
            if (!this.isCancelled) {
              reject(error);
            }
          },
          reportProgress
        );
      } catch (error) {
        if (!this.isCancelled) {
          reject(error);
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
