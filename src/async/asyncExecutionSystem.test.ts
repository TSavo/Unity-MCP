import { AsyncExecutionSystem } from './asyncExecutionSystem';
import { AsyncOperation } from './asyncOperation';
import { ResultStorage } from './resultStorage';

describe('AsyncExecutionSystem', () => {
  let asyncExecutionSystem: AsyncExecutionSystem;
  let resultStorage: ResultStorage;

  beforeEach(() => {
    resultStorage = new ResultStorage();
    asyncExecutionSystem = new AsyncExecutionSystem(resultStorage);
  });

  describe('executeOperation', () => {
    it('should execute an operation and return a result within timeout', async () => {
      // Create a simple operation that resolves quickly
      const operation = new AsyncOperation<number>((resolve) => {
        setTimeout(() => resolve(42), 50);
      });

      // Execute the operation with a timeout of 100ms
      const result = await asyncExecutionSystem.executeOperation(operation, 100);

      // Verify the result
      expect(result.status).toBe('success');
      expect(result.result).toBe(42);
      expect(result.is_complete).toBe(true);
      expect(result.log_id).toBeDefined();
    });

    it('should handle timeout and return partial result', async () => {
      // Create an operation that takes longer than the timeout
      const operation = new AsyncOperation<number>((resolve, reject, reportProgress) => {
        // Report progress after 50ms
        setTimeout(() => reportProgress(21), 50);
        
        // Resolve after 200ms
        setTimeout(() => resolve(42), 200);
      });

      // Execute the operation with a timeout of 100ms
      const result = await asyncExecutionSystem.executeOperation(operation, 100);

      // Verify the result indicates a timeout
      expect(result.status).toBe('timeout');
      expect(result.partial_result).toBe(21);
      expect(result.is_complete).toBe(false);
      expect(result.log_id).toBeDefined();

      // Store the log ID for later retrieval
      const logId = result.log_id;

      // Wait for the operation to complete in the background
      await new Promise(resolve => setTimeout(resolve, 150));

      // Retrieve the result using the log ID
      const completedResult = await asyncExecutionSystem.getResult(logId);

      // Verify the completed result
      expect(completedResult.status).toBe('success');
      expect(completedResult.result).toBe(42);
      expect(completedResult.is_complete).toBe(true);
      expect(completedResult.log_id).toBe(logId);
    });

    it('should handle errors in operations', async () => {
      // Create an operation that throws an error
      const operation = new AsyncOperation<number>((resolve, reject) => {
        setTimeout(() => reject(new Error('Test error')), 50);
      });

      // Execute the operation
      const result = await asyncExecutionSystem.executeOperation(operation, 100);

      // Verify the result indicates an error
      expect(result.status).toBe('error');
      expect(result.error).toBe('Test error');
      expect(result.is_complete).toBe(true);
      expect(result.log_id).toBeDefined();
    });
  });

  describe('getResult', () => {
    it('should retrieve a stored result by log ID', async () => {
      // Create and execute an operation
      const operation = new AsyncOperation<number>((resolve) => {
        setTimeout(() => resolve(42), 50);
      });

      const result = await asyncExecutionSystem.executeOperation(operation, 100);
      const logId = result.log_id;

      // Retrieve the result using the log ID
      const retrievedResult = await asyncExecutionSystem.getResult(logId);

      // Verify the retrieved result matches the original
      expect(retrievedResult.status).toBe('success');
      expect(retrievedResult.result).toBe(42);
      expect(retrievedResult.is_complete).toBe(true);
      expect(retrievedResult.log_id).toBe(logId);
    });

    it('should return an error for unknown log ID', async () => {
      // Attempt to retrieve a result with an unknown log ID
      const result = await asyncExecutionSystem.getResult('unknown-log-id');

      // Verify the result indicates an error
      expect(result.status).toBe('error');
      expect(result.error).toBe('Result not found for log ID: unknown-log-id');
    });
  });

  describe('cancelOperation', () => {
    it('should cancel an ongoing operation', async () => {
      // Create an operation that takes a while to complete
      const operation = new AsyncOperation<number>((resolve, reject, reportProgress) => {
        // Report progress after 50ms
        setTimeout(() => reportProgress(21), 50);
        
        // Resolve after 500ms
        setTimeout(() => resolve(42), 500);
      });

      // Execute the operation with a timeout of 100ms
      const result = await asyncExecutionSystem.executeOperation(operation, 100);
      const logId = result.log_id;

      // Cancel the operation
      const cancelResult = await asyncExecutionSystem.cancelOperation(logId);

      // Verify the cancel result
      expect(cancelResult.status).toBe('success');
      expect(cancelResult.message).toContain('Operation cancelled');

      // Retrieve the result after cancellation
      const retrievedResult = await asyncExecutionSystem.getResult(logId);

      // Verify the result shows the operation was cancelled
      expect(retrievedResult.status).toBe('cancelled');
      expect(retrievedResult.is_complete).toBe(true);
    });

    it('should return an error when cancelling an unknown operation', async () => {
      // Attempt to cancel an operation with an unknown log ID
      const result = await asyncExecutionSystem.cancelOperation('unknown-log-id');

      // Verify the result indicates an error
      expect(result.status).toBe('error');
      expect(result.error).toBe('Operation not found for log ID: unknown-log-id');
    });
  });

  describe('listOperations', () => {
    it('should list all ongoing operations', async () => {
      // Create and execute multiple operations
      const operation1 = new AsyncOperation<number>((resolve, reject, reportProgress) => {
        setTimeout(() => reportProgress(10), 50);
        setTimeout(() => resolve(42), 200);
      });

      const operation2 = new AsyncOperation<string>((resolve, reject, reportProgress) => {
        setTimeout(() => reportProgress('in progress'), 50);
        setTimeout(() => resolve('completed'), 300);
      });

      // Execute the operations with timeouts
      const result1 = await asyncExecutionSystem.executeOperation(operation1, 100);
      const result2 = await asyncExecutionSystem.executeOperation(operation2, 100);

      // List all operations
      const operations = await asyncExecutionSystem.listOperations();

      // Verify the operations list
      expect(operations.length).toBe(2);
      expect(operations.some(op => op.log_id === result1.log_id)).toBe(true);
      expect(operations.some(op => op.log_id === result2.log_id)).toBe(true);
    });
  });
});
