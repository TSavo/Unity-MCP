import { Request, Response } from 'express';
import { MCPTool, MCPToolRequest, MCPToolResponse } from '../types';
import { AsyncExecutionSystem } from '../../async/asyncExecutionSystem';
import { OperationExecutor, OperationStatus, OperationResult } from '../../async/types';
import { StorageAdapterFactoryOptions } from '../../async/storage/StorageAdapterFactory';
import { UnityClientFactory, UnityToolImplementation } from '../../unity';
import path from 'path';
import logger from '../../utils/logger';

// Create storage options
const storageOptions: StorageAdapterFactoryOptions = {
  type: 'nedb',
  dbPath: path.join(process.cwd(), 'data', 'operations')
};

// Create an instance of the AsyncExecutionSystem with persistent storage
const asyncExecutionSystem = new AsyncExecutionSystem(storageOptions);

// Create a Unity client
const unityClient = UnityClientFactory.createClient({
  host: process.env.UNITY_HOST || 'localhost',
  port: parseInt(process.env.UNITY_PORT || '8081'),
  resilient: true
});

// Create a Unity tool implementation
const unityToolImplementation = new UnityToolImplementation(unityClient);

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
  // Check if this is a Unity tool
  if (tool.id.startsWith('unity_') &&
      (tool.id === 'unity_execute_code' || tool.id === 'unity_query')) {
    try {
      // Forward to Unity tool implementation
      return await unityToolImplementation.executeUnityTool(
        tool.id,
        parameters,
        reportProgress
      );
    } catch (error) {
      logger.error(`Error executing Unity tool: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Handle other tools
  switch (tool.id) {
    case 'unity_help':
      return {
        documentation: 'Unity-AI Bridge Help Documentation',
        tools: tools.map(t => ({
          id: t.id,
          description: t.description
        }))
      };

    case 'unity_get_logs':
      // Get all logs from the AsyncExecutionSystem
      const operations = await asyncExecutionSystem.listOperations();
      return {
        operations
      };

    case 'unity_get_logs_by_name':
      // Get logs by name from the AsyncExecutionSystem
      const logsByName = await asyncExecutionSystem.getLogsByName(parameters.log_name, parameters.limit || 10);
      return {
        logs: logsByName
      };

    case 'unity_get_log_details':
      return {
        id: parameters.log_id,
        message: 'Detailed log message',
        timestamp: new Date().toISOString(),
        type: 'info',
        stackTrace: 'Stack trace...',
        context: { scene: 'Main' }
      };

    case 'unity_get_result':
      // Get the result from the AsyncExecutionSystem
      const result = await asyncExecutionSystem.getResult(parameters.log_id);
      return result;

    default:
      logger.warn(`Unsupported tool: ${tool.id}`);
      throw new Error(`Unsupported tool: ${tool.id}`);
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

/**
 * Update an operation result
 * This endpoint is used by Unity to update the result of a long-running operation
 */
export const updateOperation = async (req: Request, res: Response): Promise<void> => {
  const logId = req.params.logId;
  const update = req.body;

  try {
    // Get the current result
    const currentResult = await asyncExecutionSystem.getResult(logId);

    if (currentResult.status === OperationStatus.ERROR && currentResult.error?.includes('not found')) {
      const errorResponse: MCPToolResponse = {
        status: 'error',
        error: `Result not found for log ID: ${logId}`
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Create an updated result
    const updatedResult: OperationResult = {
      ...currentResult,
      ...update,
      logId, // Ensure the log ID is preserved
      // If the update includes a status, convert it from string to OperationStatus
      status: update.status ? stringToOperationStatus(update.status) : currentResult.status
    };

    // Store the updated result
    await asyncExecutionSystem.storage.storeResult(updatedResult);

    // Return success
    res.json({
      status: 'success',
      message: `Operation ${logId} updated successfully`,
      log_id: logId
    });
  } catch (error) {
    logger.error(`Error updating operation: ${error instanceof Error ? error.message : String(error)}`);
    const errorResponse: MCPToolResponse = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Convert a string status to OperationStatus
 */
function stringToOperationStatus(status: string): OperationStatus {
  switch (status.toLowerCase()) {
    case 'success':
      return OperationStatus.SUCCESS;
    case 'error':
      return OperationStatus.ERROR;
    case 'timeout':
      return OperationStatus.TIMEOUT;
    case 'cancelled':
      return OperationStatus.CANCELLED;
    case 'running':
      return OperationStatus.RUNNING;
    default:
      return OperationStatus.UNKNOWN;
  }
}