import { jest } from '@jest/globals';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Define mock types
type MockMcpServer = {
  tool: jest.Mock;
  connect: jest.Mock;
};

type MockStdioServerTransport = {};

// Mock the dependencies
jest.mock('axios');
jest.mock('fs');
jest.mock('path');

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    tool: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({}))
}));

// Import the module under test
// Note: This will fail until we create the implementation
import { createMcpStdioClient } from './index';

describe('MCP STDIO Client', () => {
  let mockServer: MockMcpServer;
  let mockTransport: MockStdioServerTransport;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mocks
    mockServer = {
      tool: jest.fn().mockReturnThis(),
      connect: jest.fn().mockResolvedValue(undefined)
    };
    mockTransport = {};

    // Mock the constructor
    (jest.requireMock('@modelcontextprotocol/sdk/server/mcp.js').McpServer as jest.Mock).mockImplementation(() => mockServer);
    (jest.requireMock('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport as jest.Mock).mockImplementation(() => mockTransport);
  });

  test('should create an MCP server with the correct configuration', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(jest.requireMock('@modelcontextprotocol/sdk/server/mcp.js').McpServer).toHaveBeenCalledWith({
      name: 'Unity-MCP',
      version: '1.0.0'
    });
  });

  test('should register the execute_code tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'execute_code',
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should register the query tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'query',
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should register the get_result tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_result',
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should connect to the stdio transport', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(jest.requireMock('@modelcontextprotocol/sdk/server/stdio.js').StdioServerTransport).toHaveBeenCalled();
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });

  test('execute_code tool should forward the request to the web server', async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        result: 'test result',
        logId: '123'
      }
    };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    // Mock fs.createWriteStream to return a mock stream
    const mockWriteStream = {
      write: jest.fn(),
      end: jest.fn()
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Act
    await createMcpStdioClient();

    // Get the execute_code handler
    const executeCodeHandler = mockServer.tool.mock.calls.find(
      (call: any) => call[0] === 'execute_code'
    )?.[2];

    if (!executeCodeHandler) {
      throw new Error('execute_code handler not found');
    }

    // Call the handler
    const result = await executeCodeHandler({
      code: 'console.log("test")',
      timeout: 2000
    });

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8080/api/tools',
      {
        tool_id: 'unity_execute_code',
        parameters: {
          code: 'console.log("test")',
          timeout: 2000
        }
      }
    );

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(mockResponse.data, null, 2)
      }]
    });

    // Verify logging
    expect(mockWriteStream.write).toHaveBeenCalled();
  });

  test('execute_code tool should handle errors', async () => {
    // Arrange
    const mockError = new Error('Test error');
    (axios.post as jest.Mock).mockRejectedValue(mockError);

    // Mock fs.createWriteStream to return a mock stream
    const mockWriteStream = {
      write: jest.fn(),
      end: jest.fn()
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Act
    await createMcpStdioClient();

    // Get the execute_code handler
    const executeCodeHandler = mockServer.tool.mock.calls.find(
      (call: any) => call[0] === 'execute_code'
    )?.[2];

    if (!executeCodeHandler) {
      throw new Error('execute_code handler not found');
    }

    // Call the handler
    const result = await executeCodeHandler({
      code: 'console.log("test")',
      timeout: 2000
    });

    // Assert
    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Error: Test error'
      }],
      isError: true
    });

    // Verify error logging
    expect(mockWriteStream.write).toHaveBeenCalled();
  });

  // Add tests for other tools
  test('should register the get_logs tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_logs',
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should register the get_log_details tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_log_details',
      expect.any(Object),
      expect.any(Function)
    );
  });

  test('should register the help tool', async () => {
    // Act
    await createMcpStdioClient();

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'help',
      expect.any(Object),
      expect.any(Function)
    );
  });
});
