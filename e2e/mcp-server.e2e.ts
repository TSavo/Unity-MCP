import axios from 'axios';
import { MCPToolRequest, MCPToolResponse } from '../src/mcp/types';

describe('MCP Server E2E Tests', () => {
  // Test the manifest endpoint
  describe('GET /manifest', () => {
    it('should return the server manifest', async () => {
      const response = await axios.get(`${global.serverUrl}/manifest`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('schema_version', 'v1');
      expect(response.data).toHaveProperty('name', 'e2e-test-server');
      expect(response.data).toHaveProperty('description', 'MCP Server for E2E Testing');
      expect(response.data).toHaveProperty('tools');
      expect(Array.isArray(response.data.tools)).toBe(true);
      expect(response.data.tools.length).toBeGreaterThan(0);
    });
  });

  // Test the tools endpoint
  describe('POST /tools', () => {
    it('should execute the help tool and return a response', async () => {
      const toolRequest: MCPToolRequest = {
        tool_id: 'unity_help',
        parameters: {}
      };

      const response = await axios.post(`${global.serverUrl}/tools`, toolRequest);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'success');
      expect(response.data).toHaveProperty('log_id');
      expect(response.data).toHaveProperty('result');
      expect(response.data).toHaveProperty('is_complete', true);
      expect(response.data.result).toHaveProperty('documentation');
      expect(response.data.result).toHaveProperty('tools');
      expect(Array.isArray(response.data.result.tools)).toBe(true);
    });

    it('should return an error for an unknown tool', async () => {
      const toolRequest: MCPToolRequest = {
        tool_id: 'unknown_tool',
        parameters: {}
      };

      try {
        await axios.post(`${global.serverUrl}/tools`, toolRequest);
        // If the request succeeds, fail the test
        fail('Expected request to fail with 400 status code');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('status', 'error');
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Tool not found');
      }
    });

    it('should validate required parameters', async () => {
      const toolRequest: MCPToolRequest = {
        tool_id: 'unity_execute_code',
        parameters: {
          // Missing required 'code' parameter
        }
      };

      try {
        await axios.post(`${global.serverUrl}/tools`, toolRequest);
        // If the request succeeds, fail the test
        fail('Expected request to fail with 400 status code');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('status', 'error');
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Missing required parameter');
      }
    });
  });

  // Test the results endpoint
  describe('GET /results/:logId', () => {
    let logId: string;

    beforeAll(async () => {
      // Execute a tool to get a log ID
      const toolRequest: MCPToolRequest = {
        tool_id: 'unity_help',
        parameters: {}
      };

      const response = await axios.post<MCPToolResponse>(`${global.serverUrl}/tools`, toolRequest);
      logId = response.data.log_id!;
    });

    it('should retrieve a result by log ID', async () => {
      const response = await axios.get(`${global.serverUrl}/results/${logId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'success');
      expect(response.data).toHaveProperty('log_id', logId);
      expect(response.data).toHaveProperty('result');
      expect(response.data).toHaveProperty('is_complete', true);
    });

    it('should return an error for an unknown log ID', async () => {
      try {
        await axios.get(`${global.serverUrl}/results/unknown-log-id`);
        // If the request succeeds, fail the test
        fail('Expected request to fail with 404 status code');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('status', 'error');
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Result not found');
      }
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      try {
        await axios.post(
          `${global.serverUrl}/tools`,
          '{"tool_id": "unity_help", "parameters": {', // Malformed JSON
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        // If the request succeeds, fail the test
        fail('Expected request to fail with 400 status code');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('status', 'error');
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Invalid JSON');
      }
    });
  });

  // Test rate limiting
  describe('Rate Limiting', () => {
    it('should limit the number of requests from a single client', async () => {
      // Make a request with the test rate limit header
      try {
        await axios.post(
          `${global.serverUrl}/tools`,
          {
            tool_id: 'unity_help',
            parameters: {}
          },
          {
            headers: {
              'X-Test-Rate-Limit': 'true'
            }
          }
        );
        // If the request succeeds, fail the test
        fail('Expected request to fail with 429 status code');
      } catch (error: any) {
        expect(error.response.status).toBe(429);
        expect(error.response.data).toHaveProperty('status', 'error');
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('Rate limit exceeded');
      }
    });
  });
});
