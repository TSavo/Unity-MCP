import { Operation } from './operation';
import { OperationInfo, OperationResult, OperationStatus } from './types';
import { StorageAdapter } from './storage/StorageAdapter';
import logger from '../utils/logger';

/**
 * OperationRegistry class
 *
 * Manages the registration and retrieval of operations.
 */
export class OperationRegistry {
  private operations: Map<string, Operation<any>> = new Map();
  private storage: StorageAdapter;

  /**
   * Constructor
   *
   * @param storage Storage adapter
   */
  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Register an operation
   *
   * @param operation Operation to register
   */
  public async registerOperation<T>(operation: Operation<T>): Promise<void> {
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
  public async unregisterOperation(logId: string): Promise<void> {
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
  public getOperation<T>(logId: string): Operation<T> | null {
    return this.operations.get(logId) as Operation<T> || null;
  }

  /**
   * Get an operation result
   *
   * @param logId Operation log ID
   * @returns Operation result or null if not found
   */
  public async getOperationResult<T>(logId: string): Promise<OperationResult<T> | null> {
    // First, try to get the result from the in-memory operation
    const operation = this.getOperation<T>(logId);
    if (operation) {
      const result = operation.getResult();

      // Store the result in the storage adapter
      await this.storage.storeResult(result);

      return result;
    }

    // If not found in memory, try to get it from the storage adapter
    return this.storage.getResult<T>(logId);
  }

  /**
   * Cancel an operation
   *
   * @param logId Operation log ID
   * @returns True if the operation was cancelled, false otherwise
   */
  public async cancelOperation(logId: string): Promise<boolean> {
    try {
      // First, try to cancel the in-memory operation
      const operation = this.getOperation(logId);
      if (operation) {
        operation.cancel();
        return true;
      }

      // If not found in memory, try to cancel it in the storage adapter
      return this.storage.cancelOperation(logId);
    } catch (error) {
      logger.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * List all operations
   *
   * @returns Array of operation info
   */
  public async listOperations(): Promise<OperationInfo[]> {
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
  public async cleanupCompletedOperations(maxAge: number): Promise<void> {
    // Clean up operations in memory
    const now = Date.now();
    const operationsToUnregister: string[] = [];

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
  public getOperationCount(): number {
    return this.operations.size;
  }

  /**
   * Get the number of running operations
   *
   * @returns Number of running operations
   */
  public getRunningOperationCount(): number {
    return Array.from(this.operations.values()).filter(operation =>
      operation.getStatus() === OperationStatus.RUNNING
    ).length;
  }
}
