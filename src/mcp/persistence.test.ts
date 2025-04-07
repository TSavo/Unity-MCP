import { jest } from '@jest/globals';
import { PersistenceManager } from './persistence';

describe('PersistenceManager', () => {
  let persistenceManager: PersistenceManager;
  
  beforeEach(() => {
    persistenceManager = new PersistenceManager();
  });
  
  test('should store a result with a log ID', () => {
    // Arrange
    const logId = '123';
    const result = { success: true, data: 'test data' };
    
    // Act
    persistenceManager.storeResult(logId, result);
    
    // Assert
    expect(persistenceManager.getResult(logId)).toEqual(result);
  });
  
  test('should return null for a non-existent log ID', () => {
    // Act & Assert
    expect(persistenceManager.getResult('non-existent')).toBeNull();
  });
  
  test('should store a pending operation', () => {
    // Arrange
    const logId = '123';
    const operation = {
      code: 'console.log("test")',
      timeout: 2000,
      timestamp: Date.now()
    };
    
    // Act
    persistenceManager.storePendingOperation(logId, operation);
    
    // Assert
    expect(persistenceManager.getPendingOperation(logId)).toEqual(operation);
  });
  
  test('should mark an operation as complete', () => {
    // Arrange
    const logId = '123';
    const operation = {
      code: 'console.log("test")',
      timeout: 2000,
      timestamp: Date.now()
    };
    const result = { success: true, data: 'test data' };
    
    // Act
    persistenceManager.storePendingOperation(logId, operation);
    persistenceManager.markOperationComplete(logId, result);
    
    // Assert
    expect(persistenceManager.isOperationComplete(logId)).toBe(true);
    expect(persistenceManager.getResult(logId)).toEqual(result);
    expect(persistenceManager.getPendingOperation(logId)).toBeNull();
  });
  
  test('should store a log entry', () => {
    // Arrange
    const logEntry = {
      message: 'Test log message',
      level: 'info',
      timestamp: Date.now()
    };
    
    // Act
    const logId = persistenceManager.storeLog(logEntry);
    
    // Assert
    expect(persistenceManager.getLog(logId)).toEqual(logEntry);
  });
  
  test('should get logs with pagination', () => {
    // Arrange
    const logEntries = Array.from({ length: 10 }, (_, i) => ({
      message: `Test log message ${i}`,
      level: 'info',
      timestamp: Date.now() + i
    }));
    
    // Store logs
    logEntries.forEach(entry => persistenceManager.storeLog(entry));
    
    // Act
    const logs = persistenceManager.getLogs(5, 2);
    
    // Assert
    expect(logs.logs.length).toBe(5);
    expect(logs.total).toBe(10);
    // The logs should be sorted by timestamp in descending order
    expect(logs.logs[0].message).toBe('Test log message 7');
  });
  
  test('should clean up old results', () => {
    // Arrange
    const now = Date.now();
    const oldTimestamp = now - 1000 * 60 * 60 * 24 * 2; // 2 days ago
    
    // Create some old results
    for (let i = 0; i < 5; i++) {
      const logId = `old-${i}`;
      persistenceManager.storeResult(logId, {
        success: true,
        data: `old data ${i}`,
        timestamp: oldTimestamp
      });
    }
    
    // Create some new results
    for (let i = 0; i < 5; i++) {
      const logId = `new-${i}`;
      persistenceManager.storeResult(logId, {
        success: true,
        data: `new data ${i}`,
        timestamp: now
      });
    }
    
    // Act
    const cleanedCount = persistenceManager.cleanupOldResults(1000 * 60 * 60 * 24); // 1 day
    
    // Assert
    expect(cleanedCount).toBe(5);
    
    // Old results should be gone
    for (let i = 0; i < 5; i++) {
      expect(persistenceManager.getResult(`old-${i}`)).toBeNull();
    }
    
    // New results should still be there
    for (let i = 0; i < 5; i++) {
      expect(persistenceManager.getResult(`new-${i}`)).not.toBeNull();
    }
  });
});
