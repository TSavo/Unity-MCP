import { v4 as uuidv4 } from 'uuid';
import { AsyncOperation } from './asyncOperation';
import { ResultStorage } from './resultStorage';
import { OperationResult, OperationStatus, OperationInfo, OperationFunction } from './types';
import logger from '../utils/logger';

/**
 * AsyncExecutionSystem class
 * 
 * Manages the execution of asynchronous operations, including timeout handling,
 * result storage, and operation cancellation.
 */
export class AsyncExecutionSystem {
  private resultStorage: ResultStorage;

  /**
   * Constructor
   * 
   * @param resultStorage Optional result storage instance
   */
  constructor(resultStorage?: ResultStorage) {
    this.resultStorage = resultStorage || new ResultStorage();
  }

  /**
   * Execute an operation with a timeout
   * 
   * @param operation Operation to execute
   * @param timeoutMs Timeout in milliseconds
   * @returns Operation result
   */
  public async executeOperation<T>(
    operation: AsyncOperation<T> | OperationFunction<T>,
    timeoutMs: number
  ): Promise<OperationResult<T>> {
    const logId = uuidv4();
    const startTime = Date.now();
    
    // Create initial result
    const initialResult: OperationResult<T> = {
      status: OperationStatus.RUNNING,
      log_id: logId,
      is_complete: false,
      start_time: startTime
    };
    
    // Store initial result
    this.resultStorage.storeResult(logId, initialResult);
    
    // Create AsyncOperation if a function was provided
    const asyncOperation = typeof operation === 'function'
      ? new AsyncOperation<T>((resolve, reject, reportProgress) => {
          operation(reportProgress)
            .then(resolve)
            .catch(reject);
        })
      : operation;
    
    // Register the operation so it can be cancelled
    this.resultStorage.registerRunningOperation(logId, () => {
      asyncOperation.cancel();
    });
    
    // Create a promise that resolves when the operation completes or rejects on error
    const operationPromise = new Promise<OperationResult<T>>((resolve) => {
      let latestProgress: any = null;
      
      asyncOperation.execute((progress) => {
        latestProgress = progress;
        
        // Update the result with the latest progress
        const progressResult: OperationResult<T> = {
          ...initialResult,
          partial_result: progress
        };
        
        this.resultStorage.storeResult(logId, progressResult);
      })
        .then((result) => {
          // Operation completed successfully
          const successResult: OperationResult<T> = {
            status: OperationStatus.SUCCESS,
            log_id: logId,
            result,
            is_complete: true,
            start_time: startTime,
            end_time: Date.now(),
            message: 'Operation completed successfully'
          };
          
          this.resultStorage.storeResult(logId, successResult);
          this.resultStorage.unregisterRunningOperation(logId);
          
          resolve(successResult);
        })
        .catch((error) => {
          // Operation failed with an error
          const errorResult: OperationResult<T> = {
            status: OperationStatus.ERROR,
            log_id: logId,
            error: error.message || String(error),
            is_complete: true,
            start_time: startTime,
            end_time: Date.now()
          };
          
          this.resultStorage.storeResult(logId, errorResult);
          this.resultStorage.unregisterRunningOperation(logId);
          
          resolve(errorResult);
        });
    });
    
    // Create a promise that resolves after the timeout
    const timeoutPromise = new Promise<OperationResult<T>>((resolve) => {
      setTimeout(() => {
        // Get the latest progress
        const latestProgress = asyncOperation.getLatestProgress();
        
        // Create timeout result
        const timeoutResult: OperationResult<T> = {
          status: OperationStatus.TIMEOUT,
          log_id: logId,
          partial_result: latestProgress,
          is_complete: false,
          start_time: startTime,
          message: `Operation timed out after ${timeoutMs}ms, but is still running in the background`
        };
        
        // Store the timeout result
        this.resultStorage.storeResult(logId, timeoutResult);
        
        resolve(timeoutResult);
      }, timeoutMs);
    });
    
    // Race the operation against the timeout
    return Promise.race([operationPromise, timeoutPromise]);
  }

  /**
   * Get a result by log ID
   * 
   * @param logId Log ID
   * @returns Operation result
   */
  public async getResult(logId: string): Promise<OperationResult> {
    const result = this.resultStorage.getResult(logId);
    
    if (!result) {
      return {
        status: OperationStatus.ERROR,
        log_id: logId,
        error: `Result not found for log ID: ${logId}`,
        is_complete: true
      };
    }
    
    return result;
  }

  /**
   * Cancel an operation
   * 
   * @param logId Log ID
   * @returns Operation result
   */
  public async cancelOperation(logId: string): Promise<OperationResult> {
    const cancelled = this.resultStorage.cancelOperation(logId);
    
    if (!cancelled) {
      return {
        status: OperationStatus.ERROR,
        log_id: logId,
        error: `Operation not found for log ID: ${logId}`,
        is_complete: true
      };
    }
    
    return {
      status: OperationStatus.SUCCESS,
      log_id: logId,
      message: `Operation cancelled: ${logId}`,
      is_complete: true
    };
  }

  /**
   * List all operations
   * 
   * @returns Array of operation info
   */
  public async listOperations(): Promise<OperationInfo[]> {
    return this.resultStorage.listOperations();
  }

  /**
   * Get the result storage
   * 
   * @returns Result storage
   */
  public getResultStorage(): ResultStorage {
    return this.resultStorage;
  }
}
