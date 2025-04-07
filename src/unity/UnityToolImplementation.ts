import { IUnityClient } from './types';
import logger from '../utils/logger';

/**
 * Unity tool implementation for the AsyncExecutionSystem
 */
export class UnityToolImplementation {
  private readonly unityClient: IUnityClient;

  /**
   * Create a new Unity tool implementation
   * @param unityClient Unity client
   */
  constructor(unityClient: IUnityClient) {
    this.unityClient = unityClient;
  }

  /**
   * Execute a Unity tool
   * @param toolId Tool ID
   * @param parameters Tool parameters
   * @param reportProgress Progress reporting function
   * @returns Tool execution result
   */
  public async executeUnityTool(
    toolId: string,
    parameters: Record<string, any>,
    reportProgress: (progress: any) => void
  ): Promise<any> {
    logger.info(`Executing Unity tool: ${toolId}`);

    // Check Unity connection first
    const isConnected = await this.unityClient.checkConnection();
    if (!isConnected) {
      logger.error('Unity is not connected or not responding');
      throw new Error('Unity is not connected or not responding');
    }

    switch (toolId) {
      case 'unity_execute_code':
        return this.executeCode(parameters.code, parameters.timeout, reportProgress);

      case 'unity_query':
        return this.executeQuery(parameters.query, parameters.timeout, reportProgress);

      default:
        logger.error(`Unsupported Unity tool: ${toolId}`);
        throw new Error(`Unsupported Unity tool: ${toolId}`);
    }
  }

  /**
   * Execute code in Unity
   */
  private async executeCode(
    code: string,
    timeout?: number,
    reportProgress?: (progress: any) => void
  ): Promise<any> {
    logger.debug(`Executing code in Unity: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);

    if (reportProgress) {
      reportProgress({ status: 'compiling' });
    }

    const result = await this.unityClient.executeCode(code, timeout);

    if (!result.success) {
      logger.error(`Code execution failed: ${result.error}`);
      throw new Error(result.error || 'Code execution failed');
    }

    logger.debug(`Code execution successful: ${JSON.stringify(result.result).substring(0, 100)}...`);

    return {
      result: result.result,
      logs: result.logs,
      executionTime: result.executionTime
    };
  }

  /**
   * Execute a query in Unity
   */
  private async executeQuery(
    query: string,
    timeout?: number,
    reportProgress?: (progress: any) => void
  ): Promise<any> {
    logger.debug(`Executing query in Unity: ${query}`);

    if (reportProgress) {
      reportProgress({ status: 'querying' });
    }

    // For a query, we just wrap it in a return statement to get the result
    const code = `return ${query};`;

    const result = await this.unityClient.executeCode(code, timeout);

    if (!result.success) {
      logger.error(`Query execution failed: ${result.error}`);
      throw new Error(result.error || 'Query execution failed');
    }

    logger.debug(`Query execution successful: ${JSON.stringify(result.result).substring(0, 100)}...`);

    return {
      result: result.result,
      query: query,
      executionTime: result.executionTime
    };
  }
}
