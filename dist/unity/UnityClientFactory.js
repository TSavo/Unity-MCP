"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnityClientFactory = void 0;
const UnityClient_1 = require("./UnityClient");
const ResilientUnityClient_1 = require("./ResilientUnityClient");
const MockUnityClient_1 = require("./MockUnityClient");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Factory for creating Unity clients
 */
class UnityClientFactory {
    /**
     * Create a Unity client
     * @param config Client configuration
     * @returns A Unity client instance
     */
    static createClient(config = {}) {
        const { host = 'localhost', port = 8082, resilient = true } = config;
        // Check if we should use a mock client
        if (process.env.UNITY_MOCK === 'true') {
            logger_1.default.info('Using mock Unity client');
            return this.createMockClient({
                connected: true,
                executionDelay: parseInt(process.env.UNITY_MOCK_DELAY || '50'),
                failureRate: parseFloat(process.env.UNITY_MOCK_FAILURE_RATE || '0')
            });
        }
        // Create a real client
        if (resilient) {
            logger_1.default.info(`Creating resilient Unity client for ${host}:${port}`);
            return new ResilientUnityClient_1.ResilientUnityClient(host, port, config.resilientOptions);
        }
        else {
            logger_1.default.info(`Creating standard Unity client for ${host}:${port}`);
            return new UnityClient_1.UnityClient(host, port);
        }
    }
    /**
     * Create a mock Unity client for testing
     * @param options Mock options
     * @returns A mock Unity client
     */
    static createMockClient(options = {}) {
        logger_1.default.info('Creating mock Unity client for testing');
        return new MockUnityClient_1.MockUnityClient({
            connected: options.connected ?? true,
            executionDelay: options.executionDelay ?? 50,
            failureRate: options.failureRate ?? 0
        });
    }
}
exports.UnityClientFactory = UnityClientFactory;
