/**
 * Operation status enum
 */
export enum OperationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
  RUNNING = 'running'
}

/**
 * Operation result interface
 */
export interface OperationResult<T = any> {
  status: OperationStatus;
  log_id: string;
  result?: T;
  partial_result?: any;
  error?: string;
  is_complete: boolean;
  message?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * Operation info interface for listing operations
 */
export interface OperationInfo {
  log_id: string;
  status: OperationStatus;
  is_complete: boolean;
  start_time: number;
  end_time?: number;
  operation_type?: string;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: any) => void;

/**
 * Operation function type
 */
export type OperationFunction<T = any> = (
  reportProgress: ProgressCallback
) => Promise<T>;
