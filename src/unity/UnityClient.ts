import axios, { AxiosInstance } from 'axios';
import { IUnityClient, UnityExecutionResult, UnityEnvironmentInfo } from './types';
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
   * @param port Unity port (default: 8081)
   */
  constructor(host: string = 'localhost', port: number = 8081) {
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

      const response = await this.axios.post('/execute', {
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
      const response = await this.axios.get('/info');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get Unity environment info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
