import { MCPServer } from '../src/mcp/server';
import { AddressInfo } from 'net';
import http from 'http';
import { Server } from 'http';
import logger from '../src/utils/logger';
import { MockUnityClient } from '../src/unity/MockUnityClient';
import { UnityClientFactory } from '../src/unity/UnityClientFactory';

// Set up environment for e2e tests
process.env.NODE_ENV = 'test';
process.env.UNITY_MOCK = 'true';
process.env.UNITY_MOCK_DELAY = '50';
process.env.UNITY_MOCK_FAILURE_RATE = '0';

// Create a mock Unity client that always returns success
const mockClient = UnityClientFactory.createMockClient({
  connected: true,
  executionDelay: 50,
  failureRate: 0
});

// Override the checkConnection method to always return true
const originalCheckConnection = mockClient.checkConnection;
mockClient.checkConnection = async () => true;

// Override the executeCode method to always return success
const originalExecuteCode = mockClient.executeCode;
mockClient.executeCode = async (code, timeout) => {
  return {
    success: true,
    result: { mockResult: true, message: 'Mock result for testing' },
    logs: ['[MOCK] Code executed successfully in test mode'],
    executionTime: 50
  };
};

// Monkey patch the factory to always return our mock client
UnityClientFactory.createClient = () => mockClient;

// Global variables for e2e tests
declare global {
  var testServer: MCPServer;
  var serverPort: number;
  var serverUrl: string;
  var httpServer: Server;
}

// Set up the test server before all tests
beforeAll(async () => {
  // Create a new MCP server for testing
  global.testServer = new MCPServer({
    name: 'e2e-test-server',
    description: 'MCP Server for E2E Testing',
    port: 0 // Use port 0 to let the OS assign a random available port
  });

  // Start the server
  const app = global.testServer.getExpressApp();
  global.httpServer = http.createServer(app);

  // Start the server and wait for it to be ready
  await new Promise<void>((resolve) => {
    global.httpServer.listen(0, () => {
      const address = global.httpServer.address() as AddressInfo;
      global.serverPort = address.port;
      global.serverUrl = `http://localhost:${global.serverPort}`;
      logger.info(`Test server running at ${global.serverUrl}`);
      resolve();
    });
  });
});

// Clean up after all tests
afterAll(async () => {
  // Stop the test server
  if (global.testServer) {
    global.testServer.stop();
  }

  // Close the HTTP server
  if (global.httpServer) {
    await new Promise<void>((resolve) => {
      global.httpServer.close(() => {
        resolve();
      });
    });
  }

  // Force garbage collection to clean up any remaining resources
  if (global.gc) {
    global.gc();
  }

  // Add a small delay to allow any remaining resources to be cleaned up
  await new Promise(resolve => setTimeout(resolve, 100));
});
