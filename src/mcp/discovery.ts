import axios from 'axios';
import { MCPServerManifest } from './types';
import logger from '../utils/logger';

/**
 * MCP Server information
 */
export interface MCPServerInfo {
  url: string;
  name: string;
  description: string;
  tools?: string[];
}

/**
 * MCP Discovery Service
 *
 * Handles discovery and registration of MCP servers on the network.
 */
export class MCPDiscovery {
  private servers: Set<string> = new Set();
  private serverInfo: Map<string, MCPServerInfo> = new Map();

  /**
   * Add a server URL to the discovery service
   */
  public addServer(url: string): void {
    this.servers.add(url);
  }

  /**
   * Unregister a server from the discovery service
   */
  public unregisterServer(url: string): void {
    this.servers.delete(url);
    this.serverInfo.delete(url);
  }

  /**
   * Register a server with the discovery service
   */
  public async registerServer(serverInfo: MCPServerInfo): Promise<void> {
    this.servers.add(serverInfo.url);
    this.serverInfo.set(serverInfo.url, serverInfo);
  }

  /**
   * Discover MCP servers on the network
   */
  public async discoverServers(): Promise<MCPServerInfo[]> {
    const discoveredServers: MCPServerInfo[] = [];

    // Check each server in parallel
    const checkPromises = Array.from(this.servers).map(async (url) => {
      try {
        // If we already have info for this server, use it
        if (this.serverInfo.has(url)) {
          discoveredServers.push(this.serverInfo.get(url)!);
          return;
        }

        // Otherwise, fetch the manifest
        const response = await axios.get<MCPServerManifest>(`${url}/manifest`, {
          timeout: 5000, // 5 second timeout
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.status === 200 && response.data) {
          const manifest = response.data;
          const serverInfo: MCPServerInfo = {
            url,
            name: manifest.name,
            description: manifest.description,
            tools: manifest.tools.map(tool => tool.id)
          };

          // Store the server info for future use
          this.serverInfo.set(url, serverInfo);

          discoveredServers.push(serverInfo);
        }
      } catch (error) {
        // Server is unreachable or returned an error, ignore it
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to discover MCP server at ${url}:`, { errorMessage });
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
  public advertiseServer(serverInfo: MCPServerInfo): void {
    this.registerServer(serverInfo);
    logger.info(`Advertising MCP server: ${serverInfo.name} at ${serverInfo.url}`);
  }

  /**
   * Stop advertising an MCP server on the network
   */
  public stopAdvertising(url: string): void {
    this.unregisterServer(url);
    logger.info(`Stopped advertising MCP server at ${url}`);
  }
}
