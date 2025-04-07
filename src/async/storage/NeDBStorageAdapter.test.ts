import { NeDBStorageAdapter } from './NeDBStorageAdapter';
import { OperationResult, OperationStatus } from '../types';
import fs from 'fs';
import path from 'path';

describe('NeDBStorageAdapter', () => {
  // Use a unique test DB path for each test run to avoid file permission issues
  const testDbPath = path.join(__dirname, `test-db-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  let adapter: NeDBStorageAdapter;

  beforeEach(async () => {
    // Create a new adapter for each test with a clean database
    adapter = new NeDBStorageAdapter(testDbPath);
    await adapter.initialize();
  });

  afterEach(async () => {
    // Close the adapter and clean up the test database
    await adapter.close();

    // Give the file system a moment to release file handles
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Remove the test database files if they exist
      if (fs.existsSync(testDbPath)) {
        // Get all files in the directory
        const files = fs.readdirSync(testDbPath);

        // Try to delete each file
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(testDbPath, file));
          } catch (e) {
            // Ignore errors when deleting individual files
          }
        }

        // Try to remove the directory
        try {
          fs.rmdirSync(testDbPath);
        } catch (e) {
          // Ignore errors when removing the directory
        }
      }
    } catch (error) {
      // Just log the error but don't fail the test
      console.warn(`Error cleaning up test database: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  describe('storeResult', () => {
    it('should store a result by log ID', async () => {
      // Create a test result
      const result: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      // Store the result
      await adapter.storeResult(result.logId, result);

      // Retrieve the result
      const retrievedResult = await adapter.getResult(result.logId);

      // Verify the result was stored correctly
      expect(retrievedResult).not.toBeNull();
      expect(retrievedResult?.logId).toBe(result.logId);
      expect(retrievedResult?.status).toBe(result.status);
      expect(retrievedResult?.result).toEqual(result.result);
      expect(retrievedResult?.isComplete).toBe(result.isComplete);
    });

    it('should store a result with just the result object', async () => {
      // Create a test result
      const result: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-2',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      // Store the result
      await adapter.storeResult(result);

      // Retrieve the result
      const retrievedResult = await adapter.getResult(result.logId);

      // Verify the result was stored correctly
      expect(retrievedResult).not.toBeNull();
      expect(retrievedResult?.logId).toBe(result.logId);
      expect(retrievedResult?.status).toBe(result.status);
      expect(retrievedResult?.result).toEqual(result.result);
      expect(retrievedResult?.isComplete).toBe(result.isComplete);
    });

    it('should update an existing result', async () => {
      // Create a test result
      const result: OperationResult = {
        status: OperationStatus.RUNNING,
        logId: 'test-log-id-3',
        partialResult: { progress: 50 },
        isComplete: false,
        startTime: Date.now()
      };

      // Store the result
      await adapter.storeResult(result);

      // Update the result
      const updatedResult: OperationResult = {
        ...result,
        status: OperationStatus.SUCCESS,
        result: { value: 42 },
        partialResult: undefined,
        isComplete: true,
        endTime: Date.now()
      };

      // Store the updated result
      await adapter.storeResult(updatedResult);

      // Retrieve the result
      const retrievedResult = await adapter.getResult(result.logId);

      // Verify the result was updated correctly
      expect(retrievedResult).not.toBeNull();
      expect(retrievedResult?.logId).toBe(result.logId);
      expect(retrievedResult?.status).toBe(OperationStatus.SUCCESS);
      expect(retrievedResult?.result).toEqual({ value: 42 });
      expect(retrievedResult?.isComplete).toBe(true);
      expect(retrievedResult?.endTime).toBeDefined();
    });
  });

  describe('getResult', () => {
    it('should return null for an unknown log ID', async () => {
      // Retrieve a result with an unknown log ID
      const result = await adapter.getResult('unknown-log-id');

      // Verify the result is null
      expect(result).toBeNull();
    });

    it('should retrieve a stored result', async () => {
      // Create a test result
      const result: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-4',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      // Store the result
      await adapter.storeResult(result);

      // Retrieve the result
      const retrievedResult = await adapter.getResult(result.logId);

      // Verify the result was retrieved correctly
      expect(retrievedResult).not.toBeNull();
      expect(retrievedResult?.logId).toBe(result.logId);
      expect(retrievedResult?.status).toBe(result.status);
      expect(retrievedResult?.result).toEqual(result.result);
      expect(retrievedResult?.isComplete).toBe(result.isComplete);
    });
  });

  describe('registerRunningOperation and cancelOperation', () => {
    it('should register and cancel an operation', async () => {
      // Create a mock cancel function
      const cancelFn = jest.fn();

      // Register the operation
      await adapter.registerRunningOperation('test-log-id-5', cancelFn);

      // Cancel the operation
      const cancelled = await adapter.cancelOperation('test-log-id-5');

      // Verify the operation was cancelled
      expect(cancelled).toBe(true);
      expect(cancelFn).toHaveBeenCalled();
    });

    it('should return false when cancelling an unknown operation', async () => {
      // Cancel an operation with an unknown log ID
      const cancelled = await adapter.cancelOperation('unknown-log-id');

      // Verify the operation was not cancelled
      expect(cancelled).toBe(false);
    });

    it('should unregister a running operation', async () => {
      // Create a mock cancel function
      const cancelFn = jest.fn();

      // Register the operation
      await adapter.registerRunningOperation('test-log-id-6', cancelFn);

      // Unregister the operation
      await adapter.unregisterRunningOperation('test-log-id-6');

      // Try to cancel the operation
      const cancelled = await adapter.cancelOperation('test-log-id-6');

      // Verify the operation was not cancelled
      expect(cancelled).toBe(false);
      expect(cancelFn).not.toHaveBeenCalled();
    });
  });

  describe('listOperations', () => {
    it('should list all operations', async () => {
      // Create some test results
      const result1: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-7',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      const result2: OperationResult = {
        status: OperationStatus.RUNNING,
        logId: 'test-log-id-8',
        partialResult: { progress: 50 },
        isComplete: false,
        startTime: Date.now()
      };

      // Store the results
      await adapter.storeResult(result1);
      await adapter.storeResult(result2);

      // List all operations
      const operations = await adapter.listOperations();

      // Verify the operations list
      expect(operations.length).toBe(2);
      expect(operations.some(op => op.logId === result1.logId)).toBe(true);
      expect(operations.some(op => op.logId === result2.logId)).toBe(true);
    });
  });

  describe('cleanupCompletedOperations', () => {
    it('should clean up old completed operations', async () => {
      // Create a test result that's "old"
      const oldResult: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-9',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now() - 2000, // 2 seconds ago
        endTime: Date.now() - 1000 // 1 second ago
      };

      // Create a test result that's "new"
      const newResult: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-10',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      // Store the results
      await adapter.storeResult(oldResult);
      await adapter.storeResult(newResult);

      // Clean up operations older than 500ms
      await adapter.cleanupCompletedOperations(500);

      // Verify the old result was cleaned up
      const retrievedOldResult = await adapter.getResult(oldResult.logId);
      expect(retrievedOldResult).toBeNull();

      // Verify the new result was not cleaned up
      const retrievedNewResult = await adapter.getResult(newResult.logId);
      expect(retrievedNewResult).not.toBeNull();
    });

    it('should not clean up incomplete operations', async () => {
      // Create a test result that's "old" but incomplete
      const oldIncompleteResult: OperationResult = {
        status: OperationStatus.RUNNING,
        logId: 'test-log-id-11',
        partialResult: { progress: 50 },
        isComplete: false,
        startTime: Date.now() - 2000 // 2 seconds ago
      };

      // Store the result
      await adapter.storeResult(oldIncompleteResult);

      // Clean up operations older than 500ms
      await adapter.cleanupCompletedOperations(500);

      // Verify the incomplete result was not cleaned up
      const retrievedResult = await adapter.getResult(oldIncompleteResult.logId);
      expect(retrievedResult).not.toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist data across adapter instances', async () => {
      // Create a test result
      const result: OperationResult = {
        status: OperationStatus.SUCCESS,
        logId: 'test-log-id-12',
        result: { value: 42 },
        isComplete: true,
        startTime: Date.now(),
        endTime: Date.now()
      };

      // Store the result
      await adapter.storeResult(result);

      // Close the adapter
      await adapter.close();

      // Give the file system a moment to release file handles
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create a new adapter instance with the same path
      const newAdapter = new NeDBStorageAdapter(testDbPath);
      await newAdapter.initialize();

      try {
        // Retrieve the result from the new adapter
        const retrievedResult = await newAdapter.getResult(result.logId);

        // Verify the result was retrieved correctly
        expect(retrievedResult).not.toBeNull();
        expect(retrievedResult?.logId).toBe(result.logId);
        expect(retrievedResult?.status).toBe(result.status);
        expect(retrievedResult?.result).toEqual(result.result);
        expect(retrievedResult?.isComplete).toBe(result.isComplete);
      } finally {
        // Close the new adapter
        await newAdapter.close();

        // Give the file system a moment to release file handles
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });
});
