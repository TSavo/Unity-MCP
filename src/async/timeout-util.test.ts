import { timeout, TimeoutError, createCancelablePromise } from './timeout-util';

describe('timeout utility', () => {
  it('should resolve when the promise resolves before timeout', async () => {
    // Create a promise that resolves after 50ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 50);
    });

    // Set a timeout of 100ms (longer than the promise)
    const result = await timeout(promise, {
      milliseconds: 100
    });

    // The promise should resolve with 'success'
    expect(result).toBe('success');
  });

  it('should reject when the promise takes longer than the timeout', async () => {
    // Create a promise that resolves after 100ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 100);
    });

    // Set a timeout of 50ms (shorter than the promise)
    try {
      await timeout(promise, {
        milliseconds: 50
      });

      // If we get here, the test should fail
      fail('Promise should have timed out');
    } catch (error) {
      // The promise should reject with a timeout error
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as Error).message).toContain('timed out after 50');
    }
  });

  it('should support custom error messages', async () => {
    // Create a promise that resolves after 100ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 100);
    });

    // Set a timeout of 50ms with a custom error message
    try {
      await timeout(promise, {
        milliseconds: 50,
        message: 'Custom timeout message'
      });

      // If we get here, the test should fail
      fail('Promise should have timed out');
    } catch (error) {
      // The promise should reject with the custom error message
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as Error).message).toBe('Custom timeout message');
    }
  });

  it('should support fallback values instead of rejecting', async () => {
    // Create a promise that resolves after 100ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 100);
    });

    // Set a timeout of 50ms with a fallback function
    const result = await timeout(promise, {
      milliseconds: 50,
      fallback: () => 'fallback value'
    });

    // The promise should resolve with the fallback value
    expect(result).toBe('fallback value');
  });
});

describe('createCancelablePromise', () => {
  it('should create a promise that can be canceled', async () => {
    // Create a cancelable promise
    const promise = createCancelablePromise<string>((resolve, reject, onCancel) => {
      const timeoutId = setTimeout(() => resolve('success'), 100);

      // Register a cancel handler
      onCancel(() => {
        clearTimeout(timeoutId);
      });
    });

    // Cancel the promise
    promise.cancel();

    // The promise should be canceled
    expect(promise.isCanceled()).toBe(true);
  });

  it('should not resolve a canceled promise', async () => {
    // Create a flag to track if the promise resolved
    let resolved = false;

    // Create a cancelable promise
    const promise = createCancelablePromise<string>((resolve, reject, onCancel) => {
      const timeoutId = setTimeout(() => resolve('success'), 100);

      // Register a cancel handler
      onCancel(() => {
        clearTimeout(timeoutId);
      });
    });

    // Set up a then handler to track resolution
    promise.then(() => {
      resolved = true;
    });

    // Cancel the promise
    promise.cancel();

    // Wait for the promise to potentially resolve
    await new Promise(resolve => setTimeout(resolve, 150));

    // The promise should not have resolved
    expect(resolved).toBe(false);
  });
});
