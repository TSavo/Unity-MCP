"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilientUnityClient = void 0;
const UnityClient_1 = require("./UnityClient");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Unity client with retry and resilience features
 */
class ResilientUnityClient {
    constructor(host = 'localhost', port = 8081, options = {}) {
        this.client = new UnityClient_1.UnityClient(host, port);
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 500,
            useExponentialBackoff: options.useExponentialBackoff ?? true,
            connectionTimeout: options.connectionTimeout ?? 5000
        };
        logger_1.default.info(`Created resilient Unity client with ${this.options.maxRetries} max retries`);
    }
    /**
     * Execute C# code in Unity with retry logic
     */
    async executeCode(code, timeout) {
        return this.withRetry(() => this.client.executeCode(code, timeout));
    }
    /**
     * Execute a query in Unity with retry logic
     */
    async query(query, timeout) {
        return this.withRetry(() => this.client.query(query, timeout));
    }
    /**
     * Check connection with retry logic
     */
    async checkConnection() {
        try {
            await this.withRetry(() => this.client.checkConnection(), 
            // For connection checks, we want to return false instead of throwing
            (result) => result === true, 1 // Only retry once for connection checks
            );
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get environment info with retry logic
     */
    async getEnvironmentInfo() {
        return this.withRetry(() => this.client.getEnvironmentInfo());
    }
    /**
     * Get game state with retry logic
     */
    async getGameState() {
        return this.withRetry(() => this.client.getGameState());
    }
    /**
     * Start game with retry logic
     */
    async startGame() {
        return this.withRetry(() => this.client.startGame());
    }
    /**
     * Stop game with retry logic
     */
    async stopGame() {
        return this.withRetry(() => this.client.stopGame());
    }
    /**
     * Execute a function with retry logic
     * @param fn Function to execute
     * @param validateFn Optional function to validate the result
     * @param maxRetries Optional override for max retries
     */
    async withRetry(fn, validateFn = () => true, maxRetries) {
        const retries = maxRetries ?? this.options.maxRetries;
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await fn();
                // Validate the result
                if (!validateFn(result)) {
                    throw new Error('Operation returned invalid result');
                }
                return result;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger_1.default.warn(`Attempt ${attempt + 1}/${retries + 1} failed: ${lastError.message}`);
                if (attempt < retries) {
                    const delay = this.options.useExponentialBackoff
                        ? this.options.retryDelay * Math.pow(2, attempt)
                        : this.options.retryDelay;
                    logger_1.default.debug(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        logger_1.default.error(`Operation failed after ${retries + 1} attempts`);
        throw lastError || new Error('Operation failed after retries');
    }
}
exports.ResilientUnityClient = ResilientUnityClient;
