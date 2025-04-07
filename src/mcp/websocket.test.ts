import { jest } from '@jest/globals';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketManager } from './websocket';
import { PersistenceManager } from './persistence';

// Define mock types
type MockWebSocketServer = {
  on: jest.Mock;
};

type MockWebSocket = {
  on: jest.Mock;
  send: jest.Mock;
};

// Mock dependencies
jest.mock('ws');
jest.mock('./persistence');

describe('WebSocketManager', () => {
  let webSocketManager: WebSocketManager;
  let mockServer: any;
  let mockWsServer: MockWebSocketServer;
  let mockWs: MockWebSocket;
  let mockPersistenceManager: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mocks
    mockServer = {};
    mockWsServer = { on: jest.fn() };
    mockWs = { on: jest.fn(), send: jest.fn() };
    mockPersistenceManager = {
      storeLog: jest.fn().mockReturnValue('log-id'),
      storePendingOperation: jest.fn(),
      markOperationComplete: jest.fn(),
      getResult: jest.fn().mockReturnValue(null)
    };

    // Mock WebSocketServer constructor
    (WebSocketServer as jest.Mock).mockImplementation(() => mockWsServer);

    // Mock WebSocketServer events
    mockWsServer.on.mockImplementation((event: string, callback: any) => {
      if (event === 'connection') {
        // Simulate a connection
        callback(mockWs, {});
      }
      return mockWsServer;
    });

    // Mock WebSocket methods
    mockWs.on.mockReturnValue(mockWs);

    // Create the WebSocketManager
    webSocketManager = new WebSocketManager(mockServer, mockPersistenceManager as any);
  });

  test('should initialize a WebSocket server', () => {
    // Assert
    expect(WebSocketServer).toHaveBeenCalledWith({ server: mockServer });
    expect(mockWsServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('should handle a new connection', () => {
    // Assert
    expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('should execute code in Unity', async () => {
    // Arrange
    const code = 'console.log("test")';
    const logId = '123';

    // Mock the getResult method to return a result after a delay
    mockPersistenceManager.getResult.mockImplementation(() => ({
      success: true,
      data: 'test result',
      complete: true
    }));

    // Act
    const result = await webSocketManager.executeCode(code, logId);

    // Assert
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('executeCode'));
    expect(result).toEqual({
      success: true,
      data: 'test result',
      complete: true
    });
  });

  test('should handle code execution timeout', async () => {
    // Arrange
    const code = 'console.log("test")';
    const logId = '123';
    const timeout = 100; // Short timeout for testing

    // Mock the send method but don't simulate a response
    mockWs.send = jest.fn();

    // Act & Assert
    await expect(webSocketManager.executeCode(code, logId, timeout)).rejects.toThrow('Timeout');
  });

  test('should handle no Unity connection', async () => {
    // Arrange
    const code = 'console.log("test")';
    const logId = '123';

    // Simulate no Unity connection
    webSocketManager['unityConnections'] = new Map();

    // Act & Assert
    await expect(webSocketManager.executeCode(code, logId)).rejects.toThrow('No Unity connection available');
  });

  test('should broadcast a message to all Unity connections', () => {
    // Arrange
    const message = { type: 'test', data: 'test data' };

    // Add multiple connections
    const mockWs2: MockWebSocket = { on: jest.fn(), send: jest.fn() };

    webSocketManager['unityConnections'] = new Map([
      ['1', mockWs],
      ['2', mockWs2]
    ]);

    // Act
    webSocketManager.broadcast(message);

    // Assert
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  test('should handle Unity log messages', () => {
    // Arrange
    const logMessage = {
      type: 'log',
      level: 'info',
      message: 'Test log message',
      timestamp: Date.now()
    };

    // Simulate a message event
    const onMessageCallback = (mockWs.on as jest.Mock).mock.calls.find(
      (call: any) => call[0] === 'message'
    )?.[1];

    if (!onMessageCallback) {
      throw new Error('Message handler not found');
    }

    // Act
    onMessageCallback(JSON.stringify(logMessage));

    // Assert
    expect(mockPersistenceManager.storeLog).toHaveBeenCalledWith({
      level: 'info',
      message: 'Test log message',
      timestamp: expect.any(Number)
    });
  });
});
