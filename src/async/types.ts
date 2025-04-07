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
  logId: string;
  result?: T;
  partialResult?: any;
  error?: string;
  isComplete: boolean;
  message?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Operation info interface for listing operations
 */
export interface OperationInfo {
  logId: string;
  status: OperationStatus;
  isComplete: boolean;
  startTime: number;
  endTime?: number;
  operationType?: string;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: any) => void;

/**
 * Operation options interface
 */
export interface OperationOptions {
  timeoutMs: number;
  onProgress?: ProgressCallback;
  context?: any;
}

/**
 * Operation executor function type
 */
export type OperationExecutor<T> = (
  options: {
    onProgress: ProgressCallback;
    signal: AbortSignal;
  }
) => Promise<T>;
