import { Request, Response } from 'express';
import { MCPTool, MCPToolRequest, MCPToolResponse } from '../types';
import { AsyncExecutionSystem } from '../../async/asyncExecutionSystem';
import { OperationExecutor, OperationStatus } from '../../async/types';
import { StorageAdapterFactoryOptions } from '../../async/storage/StorageAdapterFactory';
import path from 'path';
import logger from '../../utils/logger';

// Create storage options
const storageOptions: StorageAdapterFactoryOptions = {
  type: 'nedb',
  dbPath: path.join(process.cwd(), 'data', 'operations')
};

// Create an instance of the AsyncExecutionSystem with persistent storage
const asyncExecutionSystem = new AsyncExecutionSystem(storageOptions);

// Clean up resources when the process exits
process.on('exit', async () => {
  await asyncExecutionSystem.dispose();
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await asyncExecutionSystem.dispose();
  process.exit(0);
});

/**
 * Execute a tool and return the response
 */
export const executeTool = async (req: Request, res: Response): Promise<void> => {
  const toolRequest: MCPToolRequest = req.body;
  const tools = req.app.locals.mcpManifest.tools;

  // Check if tool exists
  const tool = tools.find((t: MCPTool) => t.id === toolRequest.tool_id);
  if (!tool) {
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: `Tool not found: ${toolRequest.tool_id}`
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Get timeout from parameters or use default
  const timeout = toolRequest.parameters?.timeout || 1000;

  try {
    // Create an operation executor function
    const executor: OperationExecutor<any> = async ({ onProgress, signal }) => {
      // Check if the operation was cancelled
      if (signal.aborted) {
        throw new Error('Operation was cancelled');
      }

      // Execute the tool implementation
      return executeToolImplementation(tool, toolRequest.parameters, onProgress, tools);
    };

    // Execute the operation with the specified timeout
    const operationResult = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: timeout });

    // Convert the operation result to an MCP tool response
    const response: MCPToolResponse = {
      status: operationResultStatusToMCPStatus(operationResult.status),
      log_id: operationResult.logId,
      result: operationResult.result,
      partial_result: operationResult.partialResult,
      error: operationResult.error,
      is_complete: operationResult.isComplete,
      message: operationResult.message
    };

    res.json(response);
  } catch (error) {
    logger.error(`Error executing tool: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Get a result by log ID
 */
export const getResult = async (req: Request, res: Response): Promise<void> => {
  const logId = req.params.logId;

  try {
    // Get the result from the AsyncExecutionSystem
    const operationResult = await asyncExecutionSystem.getResult(logId);

    if (operationResult.status === OperationStatus.ERROR && operationResult.error?.includes('not found')) {
      const errorResponse: MCPToolResponse = {
        status: 'error',
        error: `Result not found for log ID: ${logId}`
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Convert the operation result to an MCP tool response
    const response: MCPToolResponse = {
      status: operationResultStatusToMCPStatus(operationResult.status),
      log_id: operationResult.logId,
      result: operationResult.result,
      partial_result: operationResult.partialResult,
      error: operationResult.error,
      is_complete: operationResult.isComplete,
      message: operationResult.message
    };

    res.json(response);
  } catch (error) {
    logger.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Get the server manifest
 */
export const getManifest = (req: Request, res: Response): void => {
  res.json(req.app.locals.mcpManifest);
};

/**
 * Set up SSE connection
 */
export const setupSSE = (req: Request, res: Response): void => {
  // For testing purposes, check if this is a test environment
  const isTest = process.env.NODE_ENV === 'test';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a heartbeat every 30 seconds (only in non-test environment)
  const heartbeat = !isTest ? setInterval(() => {
    res.write('event: heartbeat\ndata: {}\n\n');
  }, 30000) : null;

  // Ensure the timer is unref'd so it doesn't keep the process alive
  if (heartbeat && heartbeat.unref) {
    heartbeat.unref();
  }

  // Clean up on close
  req.on('close', () => {
    if (heartbeat) clearInterval(heartbeat);
  });

  // Send initial connection event
  res.write('event: connected\ndata: {}\n\n');

  // In test environment, end the response after sending the initial event
  if (isTest) {
    res.end();
  }
};

/**
 * Get help documentation
 */
export const getHelp = async (req: Request, res: Response): Promise<void> => {
  const tools = req.app.locals.mcpManifest.tools;

  try {
    // Create an operation executor function for the help documentation
    const executor: OperationExecutor<any> = async ({ onProgress, signal }) => {
      // Check if the operation was cancelled
      if (signal.aborted) {
        throw new Error('Operation was cancelled');
      }

      return {
        documentation: 'Unity-AI Bridge Help Documentation',
        tools: tools.map((t: MCPTool) => ({
          id: t.id,
          description: t.description
        }))
      };
    };

    // Execute the operation with a short timeout (help should be fast)
    const operationResult = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 100 });

    // Convert the operation result to an MCP tool response
    const response: MCPToolResponse = {
      status: operationResultStatusToMCPStatus(operationResult.status),
      log_id: operationResult.logId,
      result: operationResult.result,
      is_complete: operationResult.isComplete,
      message: 'Help documentation retrieved successfully.'
    };

    res.json(response);
  } catch (error) {
    logger.error(`Error getting help: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Execute a tool implementation
 */
async function executeToolImplementation(
  tool: MCPTool,
  parameters: Record<string, any>,
  reportProgress: (progress: any) => void,
  tools: MCPTool[]
): Promise<any> {
  // For now, just return a mock response
  // In a real implementation, this would delegate to the appropriate handler
  switch (tool.id) {
    case 'unity_help':
      return {
        documentation: 'Unity-AI Bridge Help Documentation',
        tools: tools.map(t => ({
          id: t.id,
          description: t.description
        }))
      };

    case 'unity_execute_code':
      // Simulate progress reporting
      reportProgress({ status: 'compiling' });
      await new Promise(resolve => setTimeout(resolve, 50));

      reportProgress({ status: 'executing' });
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        message: `Code executed: ${parameters.code}`,
        output: 'Mock output from code execution'
      };

    case 'unity_query':
      // Simulate progress reporting
      reportProgress({ status: 'querying' });
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        message: `Query executed: ${parameters.query}`,
        result: 'Mock result from query'
      };

    default:
      return {
        message: `Tool ${tool.id} executed with parameters: ${JSON.stringify(parameters)}`
      };
  }
}

/**
 * Convert an operation status to an MCP status
 */
function operationResultStatusToMCPStatus(status: OperationStatus): 'success' | 'error' | 'timeout' | 'cancelled' | 'running' | 'unknown' {
  switch (status) {
    case OperationStatus.SUCCESS:
      return 'success';
    case OperationStatus.ERROR:
      return 'error';
    case OperationStatus.TIMEOUT:
      return 'timeout';
    case OperationStatus.CANCELLED:
      return 'cancelled';
    case OperationStatus.RUNNING:
      return 'running';
    default:
      return 'unknown';
  }
}

/**
 * Cancel an operation
 */
export const cancelOperation = async (req: Request, res: Response): Promise<void> => {
  const logId = req.params.logId;

  try {
    // Cancel the operation
    const result = await asyncExecutionSystem.cancelOperation(logId);

    // Convert the operation result to an MCP tool response
    const response: MCPToolResponse = {
      status: operationResultStatusToMCPStatus(result.status),
      log_id: result.logId,
      message: result.message,
      error: result.error
    };

    res.json(response);
  } catch (error) {
    logger.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * List all operations
 */
export const listOperations = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all operations
    const operations = await asyncExecutionSystem.listOperations();

    res.json({
      status: 'success',
      operations
    });
  } catch (error) {
    logger.error(`Error listing operations: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
}