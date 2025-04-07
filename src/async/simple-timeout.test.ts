describe('Simple timeout utility', () => {
  /**
   * A simple timeout function that wraps a promise with a timeout
   */
  function timeout<T>(promise: Promise<T>, timeoutMs: number, fallback?: () => T): Promise<T> {
    // Create a promise that resolves after the timeout
    const timeoutPromise = new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (fallback) {
          resolve(fallback());
        } else {
          reject(new Error(`Promise timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      // Ensure the timer is unref'd so it doesn't keep the process alive
      if (timeoutId.unref) {
        timeoutId.unref();
      }
    });

    // Race the original promise against the timeout
    return Promise.race([promise, timeoutPromise]);
  }

  it('should resolve when the promise resolves before timeout', async () => {
    // Create a promise that resolves after 50ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 50);
    });

    // Set a timeout of 100ms (longer than the promise)
    const result = await timeout(promise, 100);

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
      await timeout(promise, 50);

      // If we get here, the test should fail
      fail('Promise should have timed out');
    } catch (error) {
      // The promise should reject with a timeout error
      expect((error as Error).message).toContain('timed out after 50');
    }
  });

  it('should support fallback values instead of rejecting', async () => {
    // Create a promise that resolves after 100ms
    const promise = new Promise<string>(resolve => {
      setTimeout(() => resolve('success'), 100);
    });

    // Set a timeout of 50ms with a fallback function
    const result = await timeout(promise, 50, () => 'fallback value');

    // The promise should resolve with the fallback value
    expect(result).toBe('fallback value');
  });
});
