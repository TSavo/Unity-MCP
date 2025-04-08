"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnityClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Unity client implementation using HTTP
 */
class UnityClient {
    /**
     * Create a new Unity client
     * @param host Unity host (default: localhost)
     * @param port Unity port (default: 8081)
     */
    constructor(host = 'localhost', port = 8081) {
        this.baseUrl = `http://${host}:${port}`;
        this.axios = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 5000, // Default request timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
        logger_1.default.info(`Created Unity client for ${this.baseUrl}`);
    }
    /**
     * Execute C# code in Unity
     * @param code The C# code to execute
     * @param timeout Optional timeout in milliseconds
     * @returns A promise that resolves with the execution result
     */
    async executeCode(code, timeout = 1000) {
        try {
            logger_1.default.debug(`Executing code in Unity with timeout ${timeout}ms`);
            const startTime = Date.now();
            const response = await this.axios.post('/api/CodeExecution/execute', {
                code,
                timeout
            });
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Unity code execution completed in ${executionTime}ms`);
            return {
                success: response.data.success,
                result: response.data.result,
                error: response.data.error,
                logs: response.data.logs,
                executionTime
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response) {
                logger_1.default.error(`Unity execution failed: ${error.response.data.error || error.message}`);
                return {
                    success: false,
                    error: `Unity execution failed: ${error.response.data.error || error.message}`
                };
            }
            logger_1.default.error(`Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                error: `Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Execute a query in Unity
     * @param query The query to execute
     * @param timeout Optional timeout in milliseconds
     * @returns A promise that resolves with the query result
     */
    async query(query, timeout = 1000) {
        try {
            logger_1.default.debug(`Executing query in Unity with timeout ${timeout}ms`);
            const startTime = Date.now();
            const response = await this.axios.post('/api/CodeExecution/query', {
                query,
                timeout
            });
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Unity query execution completed in ${executionTime}ms`);
            return {
                success: response.data.success,
                result: response.data.result,
                error: response.data.error,
                logs: response.data.logs,
                executionTime
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response) {
                logger_1.default.error(`Unity query failed: ${error.response.data.error || error.message}`);
                return {
                    success: false,
                    error: `Unity query failed: ${error.response.data.error || error.message}`
                };
            }
            logger_1.default.error(`Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                error: `Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Check if Unity is connected and responsive
     * @returns A promise that resolves with the connection status
     */
    async checkConnection() {
        try {
            logger_1.default.debug('Checking Unity connection');
            await this.axios.get('/ping');
            logger_1.default.debug('Unity connection successful');
            return true;
        }
        catch (error) {
            logger_1.default.warn(`Unity connection failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * Get Unity version and environment information
     * @returns A promise that resolves with Unity environment info
     */
    async getEnvironmentInfo() {
        try {
            logger_1.default.debug('Getting Unity environment info');
            const response = await this.axios.get('/api/CodeExecution/info');
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the current game state
     * @returns A promise that resolves with the game state
     */
    async getGameState() {
        try {
            logger_1.default.debug('Getting game state from Unity');
            const startTime = Date.now();
            const response = await this.axios.get('/api/CodeExecution/game-state');
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Unity game state query completed in ${executionTime}ms`);
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`Error getting game state from Unity: ${error}`);
            throw new Error(`Failed to get game state: ${error.message || String(error)}`);
        }
    }
    /**
     * Start the game (enter play mode)
     * @returns A promise that resolves with the execution result
     */
    async startGame() {
        try {
            logger_1.default.debug('Starting game in Unity');
            const startTime = Date.now();
            const response = await this.axios.post('/api/CodeExecution/start-game');
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Unity start game completed in ${executionTime}ms`);
            return {
                success: response.data.success,
                result: response.data.result,
                error: response.data.error,
                logs: response.data.logs,
                executionTime
            };
        }
        catch (error) {
            logger_1.default.error(`Error starting game in Unity: ${error}`);
            return {
                success: false,
                error: `Failed to start game: ${error.message || String(error)}`,
                logs: [],
                executionTime: 0
            };
        }
    }
    /**
     * Stop the game (exit play mode)
     * @returns A promise that resolves with the execution result
     */
    async stopGame() {
        try {
            logger_1.default.debug('Stopping game in Unity');
            const startTime = Date.now();
            const response = await this.axios.post('/api/CodeExecution/stop-game');
            const executionTime = Date.now() - startTime;
            logger_1.default.debug(`Unity stop game completed in ${executionTime}ms`);
            return {
                success: response.data.success,
                result: response.data.result,
                error: response.data.error,
                logs: response.data.logs,
                executionTime
            };
        }
        catch (error) {
            logger_1.default.error(`Error stopping game in Unity: ${error}`);
            return {
                success: false,
                error: `Failed to stop game: ${error.message || String(error)}`,
                logs: [],
                executionTime: 0
            };
        }
    }
}
exports.UnityClient = UnityClient;
