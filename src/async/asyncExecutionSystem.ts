import { Operation } from './operation';
import { OperationRegistry } from './operationRegistry';
import { OperationExecutor, OperationInfo, OperationOptions, OperationResult, OperationStatus } from './types';
import { StorageAdapter } from './storage/StorageAdapter';
import { StorageAdapterFactory, StorageAdapterFactoryOptions } from './storage/StorageAdapterFactory';
import logger from '../utils/logger';

/**
 * AsyncExecutionSystem class
 *
 * Manages the execution of asynchronous operations.
 */
export class AsyncExecutionSystem {
  private readonly registry: OperationRegistry;
  public readonly storage: StorageAdapter;
  private readonly defaultOptions: Partial<OperationOptions> = {
    timeoutMs: 30000 // Default timeout: 30 seconds
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Constructor
   *
   * @param registry Optional operation registry
   * @param cleanupInterval Optional cleanup interval in milliseconds
   * @param maxOperationAge Optional maximum operation age in milliseconds
   */
  constructor(
    storageOptions: StorageAdapterFactoryOptions = {},
    cleanupInterval: number = 60000, // Default: 1 minute
    private readonly maxOperationAge: number = 3600000 // Default: 1 hour
  ) {
    // Create the storage adapter
    this.storage = StorageAdapterFactory.createAdapter(storageOptions);

    // Create the registry
    this.registry = new OperationRegistry(this.storage);

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
  public async executeOperation<T>(
    executor: OperationExecutor<T>,
    options?: Partial<OperationOptions>
  ): Promise<OperationResult<T>> {
    try {
      // Merge options with defaults
      const mergedOptions: OperationOptions = {
        ...this.defaultOptions,
        ...options
      } as OperationOptions;

      // Create and register the operation
      const operation = new Operation<T>(executor, mergedOptions);
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
    } catch (error) {
      logger.error(`Error executing operation: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: OperationStatus.ERROR,
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
  public async getResult<T>(logId: string): Promise<OperationResult<T>> {
    try {
      // Try to get the result from the registry
      const result = await this.registry.getOperationResult<T>(logId);

      if (!result) {
        return {
          status: OperationStatus.ERROR,
          logId,
          error: `Result not found for log ID: ${logId}`,
          isComplete: true
        };
      }

      return result;
    } catch (error) {
      logger.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: OperationStatus.ERROR,
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
  public async cancelOperation(logId: string): Promise<OperationResult> {
    try {
      // Try to cancel the operation
      const cancelled = await this.registry.cancelOperation(logId);

      if (!cancelled) {
        return {
          status: OperationStatus.ERROR,
          logId,
          error: `Operation not found for log ID: ${logId}`,
          isComplete: true
        };
      }

      // Get the updated result
      const result = await this.getResult(logId);

      return {
        status: OperationStatus.SUCCESS,
        logId,
        message: `Operation cancelled: ${logId}`,
        isComplete: true
      };
    } catch (error) {
      logger.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: OperationStatus.ERROR,
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
  public async listOperations(): Promise<OperationInfo[]> {
    return await this.registry.listOperations();
  }

  /**
   * Start the cleanup interval
   *
   * @param interval Cleanup interval in milliseconds
   */
  private startCleanupInterval(interval: number): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Start a new interval
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.registry.cleanupCompletedOperations(this.maxOperationAge);
      } catch (error) {
        logger.error(`Error cleaning up operations: ${error instanceof Error ? error.message : String(error)}`);
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
  public stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Dispose of the AsyncExecutionSystem
   */
  public async dispose(): Promise<void> {
    this.stopCleanupInterval();
    await this.storage.close();
  }
}
