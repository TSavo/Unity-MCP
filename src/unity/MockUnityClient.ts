import { IUnityClient, UnityExecutionResult, UnityEnvironmentInfo } from './types';
import logger from '../utils/logger';

/**
 * Mock Unity client for testing
 */
export class MockUnityClient implements IUnityClient {
  private connected: boolean = true;
  private executionDelay: number = 0;
  private failureRate: number = 0;
  private mockEnvironmentInfo: UnityEnvironmentInfo;

  /**
   * Create a new mock Unity client
   * @param options Mock options
   */
  constructor(options: {
    connected?: boolean;
    executionDelay?: number;
    failureRate?: number;
    mockEnvironmentInfo?: Partial<UnityEnvironmentInfo>;
  } = {}) {
    this.connected = options.connected ?? true;
    this.executionDelay = options.executionDelay ?? 0;
    this.failureRate = options.failureRate ?? 0;

    this.mockEnvironmentInfo = {
      unityVersion: options.mockEnvironmentInfo?.unityVersion ?? '2022.3.16f1',
      platform: options.mockEnvironmentInfo?.platform ?? 'Windows',
      isEditor: options.mockEnvironmentInfo?.isEditor ?? true,
      sceneObjects: options.mockEnvironmentInfo?.sceneObjects ?? ['Main Camera', 'Directional Light', 'Player']
    };

    logger.info(`Created mock Unity client (connected: ${this.connected}, delay: ${this.executionDelay}ms, failure rate: ${this.failureRate})`);
  }

  /**
   * Set whether the mock client is connected
   */
  public setConnected(connected: boolean): void {
    this.connected = connected;
  }

  /**
   * Set the execution delay
   */
  public setExecutionDelay(delay: number): void {
    this.executionDelay = delay;
  }

  /**
   * Set the failure rate (0-1)
   */
  public setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Execute C# code in Unity (mock implementation)
   */
  public async executeCode(code: string, timeout: number = 1000): Promise<UnityExecutionResult> {
    logger.debug(`[MOCK] Executing code with timeout ${timeout}ms: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);


    // Check if connected
    if (!this.connected) {
      return {
        success: false,
        error: 'Unity is not connected'
      };
    }

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      return {
        success: false,
        error: 'Random failure in Unity execution'
      };
    }

    // Simulate execution delay
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    // Check if execution exceeded timeout
    if (this.executionDelay > timeout) {
      return {
        success: false,
        error: `Execution timed out after ${timeout}ms`
      };
    }

    try {
      // Try to parse and evaluate the code (very limited mock implementation)
      const result = this.mockEvaluateCode(code);

      return {
        success: true,
        result,
        logs: ['[MOCK] Code executed successfully'],
        executionTime: this.executionDelay
      };
    } catch (error) {
      return {
        success: false,
        error: `Error executing code: ${error instanceof Error ? error.message : String(error)}`,
        logs: [`[MOCK] Error: ${error instanceof Error ? error.message : String(error)}`],
        executionTime: this.executionDelay
      };
    }
  }

  /**
   * Check if Unity is connected (mock implementation)
   */
  public async checkConnection(): Promise<boolean> {
    logger.debug(`[MOCK] Checking Unity connection (${this.connected ? 'connected' : 'disconnected'})`);
    return this.connected;
  }

  /**
   * Get Unity environment info (mock implementation)
   */
  public async getEnvironmentInfo(): Promise<UnityEnvironmentInfo> {
    logger.debug('[MOCK] Getting Unity environment info');

    if (!this.connected) {
      throw new Error('Unity is not connected');
    }

    return { ...this.mockEnvironmentInfo };
  }

  /**
   * Mock code evaluation (very limited)
   * This only handles simple expressions and is for testing purposes only
   */
  private mockEvaluateCode(code: string): any {
    // Extract return statement if present
    const returnMatch = code.match(/return\s+(.*?);/);
    if (returnMatch) {
      code = returnMatch[1];
    }

    // Handle some common Unity patterns with mock responses
    if (code.includes('GameObject.Find')) {
      return { name: 'MockGameObject', transform: { position: { x: 0, y: 0, z: 0 } } };
    }

    if (code.includes('transform.position')) {
      return { x: 0, y: 0, z: 0 };
    }

    if (code.includes('GetComponent')) {
      return { enabled: true };
    }

    // For simple expressions, try to evaluate them
    // WARNING: This is extremely unsafe and only for testing!
    // In a real environment, never eval user input
    try {
      // Only allow simple expressions for testing
      if (/^[0-9+\-*/. ()]+$/.test(code)) {
        return eval(code);
      }

      // For other code, return a mock object
      return { mockResult: true, code };
    } catch (error) {
      throw new Error(`Cannot evaluate code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
