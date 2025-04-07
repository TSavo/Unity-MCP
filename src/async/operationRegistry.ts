import { Operation } from './operation';
import { OperationInfo, OperationResult, OperationStatus } from './types';
import logger from '../utils/logger';

/**
 * OperationRegistry class
 *
 * Manages the registration and retrieval of operations.
 */
export class OperationRegistry {
  private operations: Map<string, Operation<any>> = new Map();

  /**
   * Register an operation
   *
   * @param operation Operation to register
   */
  public registerOperation<T>(operation: Operation<T>): void {
    const logId = operation.getLogId();
    this.operations.set(logId, operation);
  }

  /**
   * Unregister an operation
   *
   * @param logId Operation log ID
   */
  public unregisterOperation(logId: string): void {
    this.operations.delete(logId);
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
  public getOperationResult<T>(logId: string): OperationResult<T> | null {
    const operation = this.getOperation<T>(logId);
    if (!operation) {
      return null;
    }

    // Store the result in case it's needed later
    const result = operation.getResult();
    if (result.isComplete) {
      this.operations.set(logId, operation);
    }

    return result;
  }

  /**
   * Cancel an operation
   *
   * @param logId Operation log ID
   * @returns True if the operation was cancelled, false otherwise
   */
  public cancelOperation(logId: string): boolean {
    try {
      const operation = this.getOperation(logId);
      if (operation) {
        operation.cancel();
        return true;
      }
      return false;
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
  public listOperations(): OperationInfo[] {
    return Array.from(this.operations.values()).map(operation => {
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
  }

  /**
   * Clean up completed operations
   *
   * @param maxAge Maximum age in milliseconds
   */
  public cleanupCompletedOperations(maxAge: number): void {
    const now = Date.now();
    for (const [logId, operation] of this.operations.entries()) {
      if (operation.isComplete()) {
        const result = operation.getResult();
        if (result.endTime && now - result.endTime > maxAge) {
          this.unregisterOperation(logId);
        }
      }
    }
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
