import { StorageAdapter } from './StorageAdapter';
import { OperationResult, OperationStatus } from '../types';
import logger from '../../utils/logger';

/**
 * Memory storage adapter for storing operation results
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private results: Map<string, OperationResult> = new Map();
  private cancelFunctions: Map<string, () => void> = new Map();

  /**
   * Store a result
   * 
   * @param logIdOrResult Log ID or operation result
   * @param result Operation result (optional)
   */
  public async storeResult(logIdOrResult: string | OperationResult, result?: OperationResult): Promise<void> {
    try {
      let resultToStore: OperationResult;

      if (typeof logIdOrResult === 'string' && result) {
        // First overload: logId and result
        resultToStore = result;
      } else if (typeof logIdOrResult === 'object' && logIdOrResult.logId) {
        // Second overload: result with logId
        resultToStore = logIdOrResult;
      } else {
        throw new Error('Invalid arguments to storeResult');
      }

      // Store the result
      this.results.set(resultToStore.logId, resultToStore);
    } catch (error) {
      logger.error(`Error storing result: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a result
   * 
   * @param logId Log ID
   * @returns Operation result or null if not found
   */
  public async getResult<T = any>(logId: string): Promise<OperationResult<T> | null> {
    try {
      // Find the result
      const result = this.results.get(logId) as OperationResult<T> | undefined;
      return result || null;
    } catch (error) {
      logger.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Register a cancellation function for a running operation
   * 
   * @param logId Log ID
   * @param cancelFn Function to call to cancel the operation
   */
  public async registerRunningOperation(logId: string, cancelFn: () => void): Promise<void> {
    try {
      // Store the cancel function
      this.cancelFunctions.set(logId, cancelFn);
    } catch (error) {
      logger.error(`Error registering operation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Unregister a running operation
   * 
   * @param logId Log ID
   */
  public async unregisterRunningOperation(logId: string): Promise<void> {
    try {
      // Remove the cancel function
      this.cancelFunctions.delete(logId);
    } catch (error) {
      logger.error(`Error unregistering operation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Cancel an operation
   * 
   * @param logId Log ID
   * @returns True if the operation was cancelled, false otherwise
   */
  public async cancelOperation(logId: string): Promise<boolean> {
    try {
      // Get the cancel function
      const cancelFn = this.cancelFunctions.get(logId);

      if (!cancelFn) {
        return false;
      }

      // Call the cancel function
      cancelFn();

      // Update the result
      const result = await this.getResult(logId);
      if (result) {
        result.status = OperationStatus.CANCELLED;
        result.isComplete = true;
        result.endTime = Date.now();
        result.message = 'Operation was cancelled';

        await this.storeResult(result);
      }

      return true;
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
  public async listOperations(): Promise<any[]> {
    try {
      // Convert to operation info
      return Array.from(this.results.values()).map(result => ({
        logId: result.logId,
        status: result.status,
        isComplete: result.isComplete,
        startTime: result.startTime || 0,
        endTime: result.endTime,
        operationType: typeof result.result
      }));
    } catch (error) {
      logger.error(`Error listing operations: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Clean up completed operations
   * 
   * @param maxAge Maximum age in milliseconds
   */
  public async cleanupCompletedOperations(maxAge: number): Promise<void> {
    try {
      const now = Date.now();
      const cutoff = now - maxAge;

      // Find completed operations that are older than the cutoff
      for (const [logId, result] of this.results.entries()) {
        if (result.isComplete && result.endTime && result.endTime < cutoff) {
          this.results.delete(logId);
        }
      }
    } catch (error) {
      logger.error(`Error cleaning up operations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Close the storage adapter
   * This is used to clean up resources when the adapter is no longer needed
   */
  public async close(): Promise<void> {
    // Nothing to do for memory storage
  }
}
