"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPDiscovery = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * MCP Discovery Service
 *
 * Handles discovery and registration of MCP servers on the network.
 */
class MCPDiscovery {
    constructor() {
        this.servers = new Set();
        this.serverInfo = new Map();
    }
    /**
     * Add a server URL to the discovery service
     */
    addServer(url) {
        this.servers.add(url);
    }
    /**
     * Unregister a server from the discovery service
     */
    unregisterServer(url) {
        this.servers.delete(url);
        this.serverInfo.delete(url);
    }
    /**
     * Register a server with the discovery service
     */
    async registerServer(serverInfo) {
        this.servers.add(serverInfo.url);
        this.serverInfo.set(serverInfo.url, serverInfo);
    }
    /**
     * Discover MCP servers on the network
     */
    async discoverServers() {
        const discoveredServers = [];
        // Check each server in parallel
        const checkPromises = Array.from(this.servers).map(async (url) => {
            try {
                // If we already have info for this server, use it
                if (this.serverInfo.has(url)) {
                    discoveredServers.push(this.serverInfo.get(url));
                    return;
                }
                // Otherwise, fetch the manifest
                const response = await axios_1.default.get(`${url}/manifest`, {
                    timeout: 5000, // 5 second timeout
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                if (response.status === 200 && response.data) {
                    const manifest = response.data;
                    const serverInfo = {
                        url,
                        name: manifest.name,
                        description: manifest.description,
                        tools: manifest.tools.map(tool => tool.id)
                    };
                    // Store the server info for future use
                    this.serverInfo.set(url, serverInfo);
                    discoveredServers.push(serverInfo);
                }
            }
            catch (error) {
                // Server is unreachable or returned an error, ignore it
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.default.warn(`Failed to discover MCP server at ${url}:`, { errorMessage });
            }
        });
        // Wait for all checks to complete
        await Promise.all(checkPromises);
        return discoveredServers;
    }
    /**
     * Advertise an MCP server on the network
     *
     * This method would typically use mDNS or a similar protocol to advertise
     * the server on the local network. For simplicity, we're just storing the
     * server information locally.
     */
    advertiseServer(serverInfo) {
        this.registerServer(serverInfo);
        logger_1.default.info(`Advertising MCP server: ${serverInfo.name} at ${serverInfo.url}`);
    }
    /**
     * Stop advertising an MCP server on the network
     */
    stopAdvertising(url) {
        this.unregisterServer(url);
        logger_1.default.info(`Stopped advertising MCP server at ${url}`);
    }
}
exports.MCPDiscovery = MCPDiscovery;
