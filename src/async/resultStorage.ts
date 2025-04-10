import { OperationResult, OperationInfo, OperationStatus } from './types';

/**
 * ResultStorage class
 *
 * Stores and retrieves operation results.
 */
export class ResultStorage {
  private results: Map<string, OperationResult<any>> = new Map();
  private runningOperations: Map<string, { cancel: () => void }> = new Map();

  /**
   * Store a result
   *
   * @param logId Log ID
   * @param result Operation result
   */
  public storeResult(logId: string, result: OperationResult<any>): void;

  /**
   * Store a result
   *
   * @param result Operation result with logId
   */
  public storeResult(result: OperationResult<any>): void;

  /**
   * Store a result
   *
   * @param logIdOrResult Log ID or operation result
   * @param result Operation result (optional)
   */
  public storeResult(logIdOrResult: string | OperationResult<any>, result?: OperationResult<any>): void {
    if (typeof logIdOrResult === 'string' && result) {
      // First overload: logId and result
      this.results.set(logIdOrResult, result);
    } else if (typeof logIdOrResult === 'object' && logIdOrResult.logId) {
      // Second overload: result with logId
      this.results.set(logIdOrResult.logId, logIdOrResult);
    } else {
      throw new Error('Invalid arguments to storeResult');
    }
  }

  /**
   * Get a result
   *
   * @param logId Log ID
   * @returns Operation result or null if not found
   */
  public getResult(logId: string): OperationResult<any> | null {
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
        result.isComplete = true;
        result.endTime = Date.now();
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
      logId: logId,
      status: result.status,
      isComplete: result.isComplete,
      startTime: result.startTime || 0,
      endTime: result.endTime,
      operationType: typeof result.result
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
