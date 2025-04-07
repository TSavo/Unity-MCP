import { OperationResult, OperationInfo, OperationStatus } from './types';

/**
 * ResultStorage class
 * 
 * Stores and retrieves operation results.
 */
export class ResultStorage {
  private results: Map<string, OperationResult> = new Map();
  private runningOperations: Map<string, { cancel: () => void }> = new Map();

  /**
   * Store a result
   * 
   * @param logId Log ID
   * @param result Operation result
   */
  public storeResult(logId: string, result: OperationResult): void {
    this.results.set(logId, result);
  }

  /**
   * Get a result
   * 
   * @param logId Log ID
   * @returns Operation result or null if not found
   */
  public getResult(logId: string): OperationResult | null {
    return this.results.get(logId) || null;
  }

  /**
   * Register a running operation
   * 
   * @param logId Log ID
   * @param cancelFn Function to cancel the operation
   */
  public registerRunningOperation(logId: string, cancelFn: () => void): void {
    this.runningOperations.set(logId, { cancel: cancelFn });
  }

  /**
   * Unregister a running operation
   * 
   * @param logId Log ID
   */
  public unregisterRunningOperation(logId: string): void {
    this.runningOperations.delete(logId);
  }

  /**
   * Cancel an operation
   * 
   * @param logId Log ID
   * @returns true if the operation was cancelled, false otherwise
   */
  public cancelOperation(logId: string): boolean {
    const operation = this.runningOperations.get(logId);
    if (operation) {
      operation.cancel();
      this.unregisterRunningOperation(logId);
      
      // Update the result to indicate cancellation
      const result = this.getResult(logId);
      if (result) {
        result.status = OperationStatus.CANCELLED;
        result.is_complete = true;
        result.end_time = Date.now();
        result.message = 'Operation cancelled by user';
        this.storeResult(logId, result);
      }
      
      return true;
    }
    return false;
  }

  /**
   * List all operations
   * 
   * @returns Array of operation info
   */
  public listOperations(): OperationInfo[] {
    return Array.from(this.results.entries()).map(([logId, result]) => ({
      log_id: logId,
      status: result.status,
      is_complete: result.is_complete,
      start_time: result.start_time || 0,
      end_time: result.end_time,
      operation_type: typeof result.result
    }));
  }

  /**
   * Clear all results
   */
  public clearResults(): void {
    this.results.clear();
  }

  /**
   * Get the number of stored results
   */
  public getResultCount(): number {
    return this.results.size;
  }

  /**
   * Get the number of running operations
   */
  public getRunningOperationCount(): number {
    return this.runningOperations.size;
  }
}
