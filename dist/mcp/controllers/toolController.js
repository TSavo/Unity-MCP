"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOperation = exports.listOperations = exports.cancelOperation = exports.getHelp = exports.setupSSE = exports.getManifest = exports.getResult = exports.executeTool = void 0;
const asyncExecutionSystem_1 = require("../../async/asyncExecutionSystem");
const loggingSystem_1 = require("../../logging/loggingSystem");
const types_1 = require("../../async/types");
const unity_1 = require("../../unity");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../../utils/logger"));
// Create storage options
const storageOptions = {
    type: 'nedb',
    dbPath: path_1.default.join(process.cwd(), 'data', 'operations')
};
// Create an instance of the AsyncExecutionSystem with persistent storage
const asyncExecutionSystem = new asyncExecutionSystem_1.AsyncExecutionSystem(storageOptions);
// Create a logging system
const loggingSystem = loggingSystem_1.LoggingSystem.getInstance();
// Create a Unity client
const unityClient = unity_1.UnityClientFactory.createClient({
    host: process.env.UNITY_HOST || 'localhost',
    port: parseInt(process.env.UNITY_PORT || '8081'),
    resilient: true
});
// Create a Unity tool implementation
const unityToolImplementation = new unity_1.UnityToolImplementation(unityClient);
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
const executeTool = async (req, res) => {
    const toolRequest = req.body;
    const tools = req.app.locals.mcpManifest.tools;
    // Check if tool exists
    const tool = tools.find((t) => t.id === toolRequest.tool_id);
    if (!tool) {
        const errorResponse = {
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
        const executor = async ({ onProgress, signal }) => {
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
        const response = {
            status: operationResultStatusToMCPStatus(operationResult.status),
            log_id: operationResult.logId,
            result: operationResult.result,
            partial_result: operationResult.partialResult,
            error: operationResult.error,
            is_complete: operationResult.isComplete,
            message: operationResult.message
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error(`Error executing tool: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.executeTool = executeTool;
/**
 * Get a result by log ID
 */
const getResult = async (req, res) => {
    const logId = req.params.logId;
    try {
        // Get the result from the AsyncExecutionSystem
        const operationResult = await asyncExecutionSystem.getResult(logId);
        if (operationResult.status === types_1.OperationStatus.ERROR && operationResult.error?.includes('not found')) {
            const errorResponse = {
                status: 'error',
                error: `Result not found for log ID: ${logId}`
            };
            res.status(404).json(errorResponse);
            return;
        }
        // Convert the operation result to an MCP tool response
        const response = {
            status: operationResultStatusToMCPStatus(operationResult.status),
            log_id: operationResult.logId,
            result: operationResult.result,
            partial_result: operationResult.partialResult,
            error: operationResult.error,
            is_complete: operationResult.isComplete,
            message: operationResult.message
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.getResult = getResult;
/**
 * Get the server manifest
 */
const getManifest = (req, res) => {
    res.json(req.app.locals.mcpManifest);
};
exports.getManifest = getManifest;
/**
 * Set up SSE connection
 */
const setupSSE = (req, res) => {
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
        if (heartbeat)
            clearInterval(heartbeat);
    });
    // Send initial connection event
    res.write('event: connected\ndata: {}\n\n');
    // In test environment, end the response after sending the initial event
    if (isTest) {
        res.end();
    }
};
exports.setupSSE = setupSSE;
/**
 * Get help documentation
 */
const getHelp = async (req, res) => {
    const tools = req.app.locals.mcpManifest.tools;
    try {
        // Create an operation executor function for the help documentation
        const executor = async ({ onProgress, signal }) => {
            // Check if the operation was cancelled
            if (signal.aborted) {
                throw new Error('Operation was cancelled');
            }
            return {
                documentation: 'Unity-AI Bridge Help Documentation',
                tools: tools.map((t) => ({
                    id: t.id,
                    description: t.description
                }))
            };
        };
        // Execute the operation with a short timeout (help should be fast)
        const operationResult = await asyncExecutionSystem.executeOperation(executor, { timeoutMs: 100 });
        // Convert the operation result to an MCP tool response
        const response = {
            status: operationResultStatusToMCPStatus(operationResult.status),
            log_id: operationResult.logId,
            result: operationResult.result,
            is_complete: operationResult.isComplete,
            message: 'Help documentation retrieved successfully.'
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error(`Error getting help: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.getHelp = getHelp;
/**
 * Execute a tool implementation
 */
async function executeToolImplementation(tool, parameters, reportProgress, tools) {
    // Check if this is a Unity tool
    if (tool.id === 'execute_code' || tool.id === 'query') {
        try {
            // Forward to Unity tool implementation
            return await unityToolImplementation.executeUnityTool(tool.id, parameters, reportProgress);
        }
        catch (error) {
            logger_1.default.error(`Error executing Unity tool: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    // Handle other tools
    switch (tool.id) {
        case 'help':
            return {
                documentation: 'Unity-AI Bridge Help Documentation',
                tools: tools.map(t => ({
                    id: t.id,
                    description: t.description
                }))
            };
        case 'get_logs':
            // Get all logs from the LoggingSystem
            const logs = await loggingSystem.getLogs(parameters.limit || 10);
            return {
                logs
            };
        case 'get_log_by_name':
            // Get a log by name from the LoggingSystem
            const logEntries = await loggingSystem.getLogByName(parameters.log_name, parameters.limit || 10);
            return {
                name: parameters.log_name,
                entries: logEntries
            };
        case 'append_to_log':
            // Append to a log
            const logId = await loggingSystem.appendToLog(parameters.log_name, parameters.data);
            return {
                status: 'success',
                logId
            };
        case 'clear_log':
            // Clear a log
            const success = await loggingSystem.clearLog(parameters.log_name);
            return {
                status: 'success',
                cleared: success
            };
        case 'get_result':
            // Get the result from the AsyncExecutionSystem
            const result = await asyncExecutionSystem.getResult(parameters.log_id);
            return result;
        default:
            logger_1.default.warn(`Unsupported tool: ${tool.id}`);
            throw new Error(`Unsupported tool: ${tool.id}`);
    }
}
/**
 * Convert an operation status to an MCP status
 */
function operationResultStatusToMCPStatus(status) {
    switch (status) {
        case types_1.OperationStatus.SUCCESS:
            return 'success';
        case types_1.OperationStatus.ERROR:
            return 'error';
        case types_1.OperationStatus.TIMEOUT:
            return 'timeout';
        case types_1.OperationStatus.CANCELLED:
            return 'cancelled';
        case types_1.OperationStatus.RUNNING:
            return 'running';
        default:
            return 'unknown';
    }
}
/**
 * Cancel an operation
 */
const cancelOperation = async (req, res) => {
    const logId = req.params.logId;
    try {
        // Cancel the operation
        const result = await asyncExecutionSystem.cancelOperation(logId);
        // Convert the operation result to an MCP tool response
        const response = {
            status: operationResultStatusToMCPStatus(result.status),
            log_id: result.logId,
            message: result.message,
            error: result.error
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error(`Error cancelling operation: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.cancelOperation = cancelOperation;
/**
 * List all operations
 */
const listOperations = async (req, res) => {
    try {
        // Get all operations
        const operations = await asyncExecutionSystem.listOperations();
        res.json({
            status: 'success',
            operations
        });
    }
    catch (error) {
        logger_1.default.error(`Error listing operations: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.listOperations = listOperations;
/**
 * Update an operation result
 * This endpoint is used by Unity to update the result of a long-running operation
 */
const updateOperation = async (req, res) => {
    const logId = req.params.logId;
    const update = req.body;
    try {
        // Get the current result
        const currentResult = await asyncExecutionSystem.getResult(logId);
        if (currentResult.status === types_1.OperationStatus.ERROR && currentResult.error?.includes('not found')) {
            const errorResponse = {
                status: 'error',
                error: `Result not found for log ID: ${logId}`
            };
            res.status(404).json(errorResponse);
            return;
        }
        // Create an updated result
        const updatedResult = {
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
    }
    catch (error) {
        logger_1.default.error(`Error updating operation: ${error instanceof Error ? error.message : String(error)}`);
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        res.status(500).json(errorResponse);
    }
};
exports.updateOperation = updateOperation;
/**
 * Convert a string status to OperationStatus
 */
function stringToOperationStatus(status) {
    switch (status.toLowerCase()) {
        case 'success':
            return types_1.OperationStatus.SUCCESS;
        case 'error':
            return types_1.OperationStatus.ERROR;
        case 'timeout':
            return types_1.OperationStatus.TIMEOUT;
        case 'cancelled':
            return types_1.OperationStatus.CANCELLED;
        case 'running':
            return types_1.OperationStatus.RUNNING;
        default:
            return types_1.OperationStatus.UNKNOWN;
    }
}
