"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnityToolImplementation = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Unity tool implementation for the AsyncExecutionSystem
 */
class UnityToolImplementation {
    /**
     * Create a new Unity tool implementation
     * @param unityClient Unity client
     */
    constructor(unityClient) {
        this.unityClient = unityClient;
    }
    /**
     * Execute a Unity tool
     * @param toolId Tool ID
     * @param parameters Tool parameters
     * @param reportProgress Progress reporting function
     * @returns Tool execution result
     */
    async executeUnityTool(toolId, parameters, reportProgress) {
        logger_1.default.info(`Executing Unity tool: ${toolId}`);
        // Check Unity connection first
        const isConnected = await this.unityClient.checkConnection();
        if (!isConnected) {
            logger_1.default.error('Unity is not connected or not responding');
            throw new Error('Unity is not connected or not responding');
        }
        switch (toolId) {
            case 'unity_execute_code':
                return this.executeCode(parameters.code, parameters.timeout, reportProgress);
            case 'unity_query':
                return this.executeQuery(parameters.query, parameters.timeout, reportProgress);
            default:
                logger_1.default.error(`Unsupported Unity tool: ${toolId}`);
                throw new Error(`Unsupported Unity tool: ${toolId}`);
        }
    }
    /**
     * Execute code in Unity
     */
    async executeCode(code, timeout, reportProgress) {
        logger_1.default.debug(`Executing code in Unity: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
        if (reportProgress) {
            reportProgress({ status: 'compiling' });
        }
        const result = await this.unityClient.executeCode(code, timeout);
        if (!result.success) {
            logger_1.default.error(`Code execution failed: ${result.error}`);
            throw new Error(result.error || 'Code execution failed');
        }
        logger_1.default.debug(`Code execution successful: ${JSON.stringify(result.result).substring(0, 100)}...`);
        return {
            result: result.result,
            logs: result.logs,
            executionTime: result.executionTime
        };
    }
    /**
     * Execute a query in Unity
     */
    async executeQuery(query, timeout, reportProgress) {
        logger_1.default.debug(`Executing query in Unity: ${query}`);
        if (reportProgress) {
            reportProgress({ status: 'querying' });
        }
        // For a query, we just wrap it in a return statement to get the result
        const code = `return ${query};`;
        const result = await this.unityClient.executeCode(code, timeout);
        if (!result.success) {
            logger_1.default.error(`Query execution failed: ${result.error}`);
            throw new Error(result.error || 'Query execution failed');
        }
        logger_1.default.debug(`Query execution successful: ${JSON.stringify(result.result).substring(0, 100)}...`);
        return {
            result: result.result,
            query: query,
            executionTime: result.executionTime
        };
    }
}
exports.UnityToolImplementation = UnityToolImplementation;
