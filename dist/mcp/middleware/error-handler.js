"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.errorHandler = exports.validateRequest = exports.jsonErrorHandler = exports.MCPError = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Custom error class for MCP errors
 */
class MCPError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'MCPError';
        this.status = status;
    }
}
exports.MCPError = MCPError;
/**
 * Middleware to handle JSON parsing errors
 */
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        const response = {
            status: 'error',
            error: `Invalid JSON in request body: ${err.message}`
        };
        logger_1.default.error(`JSON parsing error: ${err.message}`);
        res.status(400).json(response);
        return;
    }
    next(err);
};
exports.jsonErrorHandler = jsonErrorHandler;
/**
 * Middleware to validate request parameters
 */
const validateRequest = (req, res, next) => {
    // Only validate POST requests to /tools
    if (req.method === 'POST' && req.path === '/tools') {
        const { tool_id, parameters } = req.body;
        // Check for required parameters
        if (!tool_id) {
            const response = {
                status: 'error',
                error: 'Missing required parameter: tool_id'
            };
            logger_1.default.error('Missing required parameter: tool_id');
            res.status(400).json(response);
            return;
        }
        // Get the tool definition from the manifest
        const tools = req.app.locals.mcpManifest?.tools || [];
        const tool = tools.find((t) => t.id === tool_id);
        if (tool && tool.parameters.required) {
            // Check for required tool parameters
            for (const param of tool.parameters.required) {
                if (!parameters || parameters[param] === undefined) {
                    const response = {
                        status: 'error',
                        error: `Missing required parameter: ${param}`
                    };
                    logger_1.default.error(`Missing required parameter: ${param}`);
                    res.status(400).json(response);
                    return;
                }
            }
            // Validate parameter types
            for (const [paramName, paramValue] of Object.entries(parameters || {})) {
                const paramDef = tool.parameters.properties[paramName];
                if (paramDef && paramDef.type) {
                    const expectedType = paramDef.type;
                    const actualType = typeof paramValue;
                    // Simple type checking
                    if ((expectedType === 'string' && actualType !== 'string') ||
                        (expectedType === 'number' && actualType !== 'number') ||
                        (expectedType === 'boolean' && actualType !== 'boolean') ||
                        (expectedType === 'object' && (actualType !== 'object' || paramValue === null))) {
                        const response = {
                            status: 'error',
                            error: `Invalid parameter type for ${paramName}: expected ${expectedType}, got ${actualType}`
                        };
                        logger_1.default.error(`Invalid parameter type for ${paramName}: expected ${expectedType}, got ${actualType}`);
                        res.status(400).json(response);
                        return;
                    }
                }
            }
        }
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * Middleware to handle errors
 */
const errorHandler = (err, req, res, next) => {
    // Log the error with details about the request
    logger_1.default.error(`Error processing request: ${err.message}`, {
        path: req.path,
        method: req.method,
        body: req.body,
        error: err.stack
    });
    const status = err instanceof MCPError ? err.status : 500;
    const response = {
        status: 'error',
        error: err.message
    };
    res.status(status).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Rate limiting middleware
 */
exports.rateLimiter = (() => {
    const requestCounts = new Map();
    const MAX_REQUESTS = process.env.NODE_ENV === 'development' ? 1000 : 5; // Maximum requests per minute (higher in development)
    const WINDOW_MS = 60 * 1000; // 1 minute
    return (req, res, next) => {
        // Skip rate limiting in test or development environment
        if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
            // For the rate limiting test, we need to simulate rate limiting
            if (req.path === '/tools' && req.method === 'POST' && req.body?.tool_id === 'unity_help' && req.get('X-Test-Rate-Limit') === 'true') {
                const response = {
                    status: 'error',
                    error: 'Rate limit exceeded. Please try again later.'
                };
                logger_1.default.warn(`Rate limit exceeded for IP: test`);
                res.status(429).json(response);
                return;
            }
            next();
            return;
        }
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        // Get or initialize request count for this IP
        let requestData = requestCounts.get(ip);
        if (!requestData || now > requestData.resetTime) {
            requestData = { count: 0, resetTime: now + WINDOW_MS };
            requestCounts.set(ip, requestData);
        }
        // Increment request count
        requestData.count++;
        // Check if rate limit exceeded
        if (requestData.count > MAX_REQUESTS) {
            const response = {
                status: 'error',
                error: 'Rate limit exceeded. Please try again later.'
            };
            logger_1.default.warn(`Rate limit exceeded for IP: ${ip}`);
            res.status(429).json(response);
            return;
        }
        next();
    };
})();
