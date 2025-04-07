import { OperationResult } from '../types';

/**
 * Storage adapter interface for storing operation results
 */
export interface StorageAdapter {
  /**
   * Store a result
   *
   * @param logId Log ID
   * @param result Operation result
   */
  storeResult(logId: string, result: OperationResult): Promise<void>;

  /**
   * Store a result
   *
   * @param result Operation result with log_id
   */
  storeResult(result: OperationResult): Promise<void>;

  /**
   * Get a result
   *
   * @param logId Log ID
   * @returns Operation result or null if not found
   */
  getResult<T = any>(logId: string): Promise<OperationResult<T> | null>;

  /**
   * Register a cancellation function for a running operation
   *
   * @param logId Log ID
   * @param cancelFn Function to call to cancel the operation
   */
  registerRunningOperation(logId: string, cancelFn: () => void): Promise<void>;

  /**
   * Unregister a running operation
   *
   * @param logId Log ID
   */
  unregisterRunningOperation(logId: string): Promise<void>;

  /**
   * Cancel an operation
   *
   * @param logId Log ID
   * @returns True if the operation was cancelled, false otherwise
   */
  cancelOperation(logId: string): Promise<boolean>;

  /**
   * List all operations
   *
   * @returns Array of operation info
   */
  listOperations(): Promise<any[]>;

  /**
   * Clean up completed operations
   *
   * @param maxAge Maximum age in milliseconds
   */
  cleanupCompletedOperations(maxAge: number): Promise<void>;

  /**
   * Store a log entry
   *
   * @param logId Log ID
   * @param logName Log name
   * @param logEntry Log entry
   */
  storeLogEntry(logId: string, logName: string, logEntry: any): Promise<void>;

  /**
   * Get logs by name
   *
   * @param logName Log name
   * @param limit Maximum number of logs to return
   * @returns Logs
   */
  getLogsByName(logName: string, limit?: number): Promise<any[]>;

  /**
   * Close the storage adapter
   * This is used to clean up resources when the adapter is no longer needed
   */
  close(): Promise<void>;
}
