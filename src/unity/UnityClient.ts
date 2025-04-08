import axios, { AxiosInstance } from 'axios';
import { IUnityClient, UnityExecutionResult, UnityEnvironmentInfo, GameState } from './types';
import logger from '../utils/logger';

/**
 * Unity client implementation using HTTP
 */
export class UnityClient implements IUnityClient {
  private readonly axios: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Create a new Unity client
   * @param host Unity host (default: localhost)
   * @param port Unity port (default: 8082)
   */
  constructor(host: string = 'localhost', port: number = 8082) {
    this.baseUrl = `http://${host}:${port}`;
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000, // Default request timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    logger.info(`Created Unity client for ${this.baseUrl}`);
  }

  /**
   * Execute C# code in Unity
   * @param code The C# code to execute
   * @param timeout Optional timeout in milliseconds
   * @returns A promise that resolves with the execution result
   */
  public async executeCode(code: string, timeout: number = 1000): Promise<UnityExecutionResult> {
    try {
      logger.debug(`Executing code in Unity with timeout ${timeout}ms`);
      const startTime = Date.now();

      const response = await this.axios.post('/api/CodeExecution/execute', {
        code,
        timeout
      });

      const executionTime = Date.now() - startTime;
      logger.debug(`Unity code execution completed in ${executionTime}ms`);

      return {
        success: response.data.success,
        result: response.data.result,
        error: response.data.error,
        logs: response.data.logs,
        executionTime
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error(`Unity execution failed: ${error.response.data.error || error.message}`);
        return {
          success: false,
          error: `Unity execution failed: ${error.response.data.error || error.message}`
        };
      }

      logger.error(`Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`);
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
  public async query(query: string, timeout: number = 1000): Promise<UnityExecutionResult> {
    try {
      logger.debug(`Executing query in Unity with timeout ${timeout}ms`);
      const startTime = Date.now();

      const response = await this.axios.post('/api/CodeExecution/query', {
        query,
        timeout
      });

      const executionTime = Date.now() - startTime;
      logger.debug(`Unity query execution completed in ${executionTime}ms`);

      return {
        success: response.data.success,
        result: response.data.result,
        error: response.data.error,
        logs: response.data.logs,
        executionTime
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error(`Unity query failed: ${error.response.data.error || error.message}`);
        return {
          success: false,
          error: `Unity query failed: ${error.response.data.error || error.message}`
        };
      }

      logger.error(`Failed to communicate with Unity: ${error instanceof Error ? error.message : String(error)}`);
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
  public async checkConnection(): Promise<boolean> {
    try {
      logger.debug('Checking Unity connection');
      await this.axios.get('/ping');
      logger.debug('Unity connection successful');
      return true;
    } catch (error) {
      logger.warn(`Unity connection failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get Unity version and environment information
   * @returns A promise that resolves with Unity environment info
   */
  public async getEnvironmentInfo(): Promise<UnityEnvironmentInfo> {
    try {
      logger.debug('Getting Unity environment info');
      const response = await this.axios.get('/api/CodeExecution/info');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }



  /**
   * Get the current game state
   * @returns A promise that resolves with the game state
   */
  public async getGameState(): Promise<GameState> {
    try {
      logger.debug('Getting game state from Unity');
      const startTime = Date.now();

      const response = await this.axios.get('/api/CodeExecution/game-state');

      const executionTime = Date.now() - startTime;
      logger.debug(`Unity game state query completed in ${executionTime}ms`);

      return response.data;
    } catch (error: any) {
      logger.error(`Error getting game state from Unity: ${error}`);
      throw new Error(`Failed to get game state: ${error.message || String(error)}`);
    }
  }

  /**
   * Start the game (enter play mode)
   * @returns A promise that resolves with the execution result
   */
  public async startGame(): Promise<UnityExecutionResult> {
    try {
      logger.debug('Starting game in Unity');
      const startTime = Date.now();

      const response = await this.axios.post('/api/CodeExecution/start-game');

      const executionTime = Date.now() - startTime;
      logger.debug(`Unity start game completed in ${executionTime}ms`);

      return {
        success: response.data.success,
        result: response.data.result,
        error: response.data.error,
        logs: response.data.logs,
        executionTime
      };
    } catch (error: any) {
      logger.error(`Error starting game in Unity: ${error}`);
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
  public async stopGame(): Promise<UnityExecutionResult> {
    try {
      logger.debug('Stopping game in Unity');
      const startTime = Date.now();

      const response = await this.axios.post('/api/CodeExecution/stop-game');

      const executionTime = Date.now() - startTime;
      logger.debug(`Unity stop game completed in ${executionTime}ms`);

      return {
        success: response.data.success,
        result: response.data.result,
        error: response.data.error,
        logs: response.data.logs,
        executionTime
      };
    } catch (error: any) {
      logger.error(`Error stopping game in Unity: ${error}`);
      return {
        success: false,
        error: `Failed to stop game: ${error.message || String(error)}`,
        logs: [],
        executionTime: 0
      };
    }
  }
}
