import { AsyncExecutionSystem } from './asyncExecutionSystem';
import { OperationStatus } from './types';

describe('AsyncExecutionSystem', () => {
  let asyncExecutionSystem: AsyncExecutionSystem;

  beforeEach(() => {
    asyncExecutionSystem = new AsyncExecutionSystem();
  });

  afterEach(() => {
    asyncExecutionSystem.dispose();
  });

  describe('executeOperation', () => {
    it('should execute an operation and return a success result', async () => {
      // Create a simple executor that resolves with a value
      const executor = async ({ onProgress }: { onProgress: any, signal: AbortSignal }) => {
        onProgress('in progress');
        return 42;
      };

      // Execute the operation
      const result = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 100 });

      // Verify the result
      expect(result.status).toBe(OperationStatus.SUCCESS);
      expect(result.result).toBe(42);
      expect(result.isComplete).toBe(true);
      expect(result.logId).toBeDefined();
    });

    it('should handle errors in operations', async () => {
      // Create an executor that throws an error
      const executor = async () => {
        throw new Error('Test error');
      };

      // Execute the operation
      const result = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 100 });

      // Verify the result
      expect(result.status).toBe(OperationStatus.ERROR);
      expect(result.error).toBe('Test error');
      expect(result.isComplete).toBe(true);
      expect(result.logId).toBeDefined();
    });

    it('should handle timeouts', async () => {
      // Create an executor that never resolves
      const executor = async ({ onProgress }: { onProgress: any, signal: AbortSignal }) => {
        onProgress('in progress');
        return new Promise<number>(() => {
          // This promise never resolves
        });
      };

      // Execute the operation with a short timeout
      const result = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 10 });

      // Verify the result
      expect(result.status).toBe(OperationStatus.TIMEOUT);
      expect(result.partialResult).toBe('in progress');
      expect(result.isComplete).toBe(false);
      expect(result.logId).toBeDefined();
    });
  });

  describe('getResult', () => {
    it('should retrieve a result by log ID', async () => {
      // Execute an operation to get a log ID
      const executor = async () => 42;
      const result = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 100 });
      const logId = result.logId;

      // Retrieve the result
      const retrievedResult = await asyncExecutionSystem.getResult(logId);

      // Verify the result
      expect(retrievedResult.status).toBe(OperationStatus.SUCCESS);
      expect(retrievedResult.result).toBe(42);
      expect(retrievedResult.isComplete).toBe(true);
      expect(retrievedResult.logId).toBe(logId);
    });

    it('should return an error for an unknown log ID', async () => {
      // Retrieve a result with an unknown log ID
      const result = await asyncExecutionSystem.getResult('unknown-log-id');

      // Verify the result
      expect(result.status).toBe(OperationStatus.ERROR);
      expect(result.error).toContain('not found');
      expect(result.isComplete).toBe(true);
    });
  });

  describe('cancelOperation', () => {
    it('should cancel an operation', async () => {
      // Create an executor that never resolves
      const executor = async ({ onProgress }: { onProgress: any, signal: AbortSignal }) => {
        onProgress('in progress');
        return new Promise<number>(() => {
          // This promise never resolves
        });
      };

      // Execute the operation with a short timeout
      const result = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 10 });
      const logId = result.logId;

      // Cancel the operation
      const cancelResult = await asyncExecutionSystem.cancelOperation(logId);

      // Verify the cancel result
      expect(cancelResult.status).toBe(OperationStatus.SUCCESS);
      expect(cancelResult.message).toContain('cancelled');
    });

    it('should return an error for an unknown log ID', async () => {
      // Cancel an operation with an unknown log ID
      const result = await asyncExecutionSystem.cancelOperation('unknown-log-id');

      // Verify the result
      expect(result.status).toBe(OperationStatus.ERROR);
      expect(result.error).toContain('not found');
      expect(result.isComplete).toBe(true);
    });
  });

  describe('listOperations', () => {
    it('should list all operations', async () => {
      // Execute two operations
      const executor1 = async ({ onProgress }: { onProgress: any, signal: AbortSignal }) => {
        onProgress('in progress 1');
        return 42;
      };

      const executor2 = async ({ onProgress }: { onProgress: any, signal: AbortSignal }) => {
        onProgress('in progress 2');
        return 'hello';
      };

      const result1 = await asyncExecutionSystem.executeOperation(executor1, { timeoutMs: 100 });
      const result2 = await asyncExecutionSystem.executeOperation(executor2, { timeoutMs: 100 });

      // List all operations
      const operations = await asyncExecutionSystem.listOperations();

      // Verify the operations
      expect(operations.length).toBe(2);
      expect(operations.some(op => op.logId === result1.logId)).toBe(true);
      expect(operations.some(op => op.logId === result2.logId)).toBe(true);
    });
  });
});
