/**
 * TimeoutError class
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Options for the timeout function
 */
export interface TimeoutOptions<T> {
  /**
   * Milliseconds before timing out
   */
  milliseconds: number;

  /**
   * Custom error message or error to throw when it times out
   */
  message?: string;

  /**
   * Do something other than rejecting with an error on timeout
   */
  fallback?: () => T | Promise<T>;
}

/**
 * Timeout a promise after a specified amount of time
 *
 * @param promise Promise to timeout
 * @param options Timeout options
 * @returns Promise that resolves with the result or rejects with a timeout error
 */
export function timeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions<T>
): Promise<T> {
  const { milliseconds, message = `Promise timed out after ${milliseconds} milliseconds`, fallback } = options;

  // If milliseconds is Infinity, just return the promise
  if (milliseconds === Infinity) {
    return promise;
  }

  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (fallback) {
        // If a fallback is provided, resolve with the fallback value
        Promise.resolve(fallback()).then(value => {
          clearTimeout(timeoutId);
          resolve(value);
        }).catch(reject);
      } else {
        // Otherwise, reject with a timeout error
        reject(new TimeoutError(message));
      }
    }, milliseconds);

    // Ensure the timer is unref'd so it doesn't keep the process alive
    if (timeoutId.unref) {
      timeoutId.unref();
    }
  });

  // Create a promise that resolves when the original promise resolves
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(resolve).catch(reject);
  });

  // Race the original promise against the timeout
  return Promise.race([wrappedPromise, timeoutPromise]);
}

/**
 * Resolve variable used by the timeout function
 */
let resolve: (value: any) => void;

/**
 * Create a cancelable promise
 *
 * @param executor Function that executes the promise
 * @returns Cancelable promise
 */
export function createCancelablePromise<T>(
  executor: (
    resolve: (value: T) => void,
    reject: (reason?: any) => void,
    onCancel: (cancelHandler: () => void) => void
  ) => void
): CancelablePromise<T> {
  let isCanceled = false;
  let cancelHandler: (() => void) | null = null;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;

    executor(
      (value) => {
        if (!isCanceled) {
          resolvePromise(value);
        }
      },
      (reason) => {
        if (!isCanceled) {
          rejectPromise(reason);
        }
      },
      (handler) => {
        cancelHandler = handler;
      }
    );
  });

  const cancelablePromise = promise as CancelablePromise<T>;

  cancelablePromise.cancel = () => {
    if (isCanceled) {
      return;
    }

    isCanceled = true;

    if (cancelHandler) {
      cancelHandler();
    }
  };

  cancelablePromise.isCanceled = () => isCanceled;

  return cancelablePromise;
}

/**
 * Cancelable promise interface
 */
export interface CancelablePromise<T> extends Promise<T> {
  /**
   * Cancel the promise
   */
  cancel: () => void;

  /**
   * Check if the promise is canceled
   */
  isCanceled: () => boolean;
}
