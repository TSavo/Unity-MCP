import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import { getResult, getLogs, getLogDetails } from './resultController';
import { PersistenceManager } from '../persistence';

// Mock express types
type MockRequest = Partial<Request>;
type MockResponse = {
  json: jest.Mock;
  status: jest.Mock;
};

// Mock dependencies
jest.mock('../persistence');

describe('Result Controller', () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockPersistenceManager: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mocks
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockPersistenceManager = {
      getResult: jest.fn(),
      getLogs: jest.fn(),
      getLog: jest.fn()
    };

    // Add persistence manager to app.locals
    mockRequest.app = {
      locals: {
        persistenceManager: mockPersistenceManager
      }
    } as any;
  });

  describe('getResult', () => {
    test('should return a result by log ID', () => {
      // Arrange
      const logId = '123';
      const result = { success: true, data: 'test data' };

      mockRequest.params = { logId };
      mockPersistenceManager.getResult.mockReturnValue(result);

      // Act
      getResult(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getResult).toHaveBeenCalledWith(logId);
      expect(mockResponse.json).toHaveBeenCalledWith(result);
    });

    test('should return 404 for a non-existent log ID', () => {
      // Arrange
      const logId = 'non-existent';

      mockRequest.params = { logId };
      mockPersistenceManager.getResult.mockReturnValue(null);

      // Act
      getResult(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getResult).toHaveBeenCalledWith(logId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Result not found'
      });
    });
  });

  describe('getLogs', () => {
    test('should return logs with pagination', () => {
      // Arrange
      const count = 10;
      const offset = 0;
      const logs = {
        logs: Array.from({ length: count }, (_, i) => ({
          message: `Test log message ${i}`,
          level: 'info',
          timestamp: Date.now() + i
        })),
        total: 100
      };

      mockRequest.query = { count: count.toString(), offset: offset.toString() };
      mockPersistenceManager.getLogs.mockReturnValue(logs);

      // Act
      getLogs(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getLogs).toHaveBeenCalledWith(count, offset);
      expect(mockResponse.json).toHaveBeenCalledWith(logs);
    });

    test('should use default pagination values', () => {
      // Arrange
      const logs = {
        logs: Array.from({ length: 10 }, (_, i) => ({
          message: `Test log message ${i}`,
          level: 'info',
          timestamp: Date.now() + i
        })),
        total: 100
      };

      mockRequest.query = {};
      mockPersistenceManager.getLogs.mockReturnValue(logs);

      // Act
      getLogs(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getLogs).toHaveBeenCalledWith(10, 0); // Default values
      expect(mockResponse.json).toHaveBeenCalledWith(logs);
    });
  });

  describe('getLogDetails', () => {
    test('should return log details by log ID', () => {
      // Arrange
      const logId = '123';
      const log = {
        message: 'Test log message',
        level: 'info',
        timestamp: Date.now()
      };

      mockRequest.params = { logId };
      mockPersistenceManager.getLog.mockReturnValue(log);

      // Act
      getLogDetails(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getLog).toHaveBeenCalledWith(logId);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        log
      });
    });

    test('should return 404 for a non-existent log ID', () => {
      // Arrange
      const logId = 'non-existent';

      mockRequest.params = { logId };
      mockPersistenceManager.getLog.mockReturnValue(null);

      // Act
      getLogDetails(mockRequest as any, mockResponse as any);

      // Assert
      expect(mockPersistenceManager.getLog).toHaveBeenCalledWith(logId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Log not found'
      });
    });
  });
});
