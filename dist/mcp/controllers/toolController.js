"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHelp = exports.setupSSE = exports.getManifest = exports.getResult = exports.executeTool = void 0;
const uuid_1 = require("uuid");
// In-memory storage for results
const results = new Map();
/**
 * Execute a tool and return the response
 */
const executeTool = (req, res) => {
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
    // Execute the tool
    try {
        const logId = (0, uuid_1.v4)();
        const response = executeToolImplementation(tool, toolRequest.parameters, logId, tools);
        // Store the result
        results.set(logId, response);
        res.json(response);
    }
    catch (error) {
        const errorResponse = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        res.status(500).json(errorResponse);
    }
};
exports.executeTool = executeTool;
/**
 * Get a result by log ID
 */
const getResult = (req, res) => {
    const logId = req.params.logId;
    const result = results.get(logId);
    if (!result) {
        const errorResponse = {
            status: 'error',
            error: `Result not found for log ID: ${logId}`
        };
        res.status(404).json(errorResponse);
        return;
    }
    res.json(result);
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
const getHelp = (req, res) => {
    const logId = (0, uuid_1.v4)();
    const tools = req.app.locals.mcpManifest.tools;
    const response = {
        status: 'success',
        log_id: logId,
        result: {
            documentation: 'Unity-AI Bridge Help Documentation',
            tools: tools.map((t) => ({
                id: t.id,
                description: t.description
            }))
        },
        is_complete: true,
        message: 'Help documentation retrieved successfully.'
    };
    // Store the result
    results.set(logId, response);
    res.json(response);
};
exports.getHelp = getHelp;
/**
 * Execute a tool implementation
 */
function executeToolImplementation(tool, parameters, logId, tools) {
    // For now, just return a mock response
    // In a real implementation, this would delegate to the appropriate handler
    switch (tool.id) {
        case 'unity_help':
            return {
                status: 'success',
                log_id: logId,
                result: {
                    documentation: 'Unity-AI Bridge Help Documentation',
                    tools: tools.map(t => ({
                        id: t.id,
                        description: t.description
                    }))
                },
                is_complete: true,
                message: 'Help documentation retrieved successfully.'
            };
        default:
            return {
                status: 'success',
                log_id: logId,
                result: {
                    message: `Tool ${tool.id} executed with parameters: ${JSON.stringify(parameters)}`
                },
                is_complete: true,
                message: `Tool ${tool.id} executed successfully.`
            };
    }
}
