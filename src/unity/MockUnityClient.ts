import { IUnityClient, UnityExecutionResult, UnityEnvironmentInfo, GameState } from './types';
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
   * Simulate execution with delay and potential failure
   * @returns A promise that resolves when the execution is complete
   */
  private async simulateExecution(): Promise<void> {
    // Simulate execution delay
    if (this.executionDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelay));
    }

    // Check if we should simulate a failure
    if (Math.random() < this.failureRate) {
      throw new Error('Simulated failure');
    }

    // Check if we're connected
    if (!this.connected) {
      throw new Error('Unity is not connected');
    }
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
   * Execute a query in Unity (mock implementation)
   */
  public async query(query: string, timeout: number = 1000): Promise<UnityExecutionResult> {
    logger.debug(`[MOCK] Executing query with timeout ${timeout}ms: ${query}`);

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
        error: 'Random failure in Unity query'
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
        error: `Query timed out after ${timeout}ms`
      };
    }

    try {
      // Try to parse and evaluate the query (very limited mock implementation)
      const result = this.mockEvaluateQuery(query);

      return {
        success: true,
        result,
        logs: ['[MOCK] Query executed successfully'],
        executionTime: this.executionDelay
      };
    } catch (error) {
      return {
        success: false,
        error: `Error executing query: ${error instanceof Error ? error.message : String(error)}`,
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
   * Get the current game state (mock implementation)
   */
  public async getGameState(): Promise<GameState> {
    logger.debug('[MOCK] Getting game state');

    if (!this.connected) {
      throw new Error('Unity is not connected');
    }

    await this.simulateExecution();

    return {
      isPlaying: false,
      isPaused: false,
      isCompiling: false,
      currentScene: 'SampleScene',
      timeScale: 1.0,
      frameCount: 0,
      realtimeSinceStartup: 0.0
    };
  }

  /**
   * Start the game (mock implementation)
   */
  public async startGame(): Promise<UnityExecutionResult> {
    logger.debug('[MOCK] Starting game');

    if (!this.connected) {
      throw new Error('Unity is not connected');
    }

    await this.simulateExecution();

    return {
      success: true,
      result: 'Game started successfully (mock)',
      logs: ['[MOCK] Game started successfully'],
      executionTime: this.executionDelay
    };
  }

  /**
   * Stop the game (mock implementation)
   */
  public async stopGame(): Promise<UnityExecutionResult> {
    logger.debug('[MOCK] Stopping game');

    if (!this.connected) {
      throw new Error('Unity is not connected');
    }

    await this.simulateExecution();

    return {
      success: true,
      result: 'Game stopped successfully (mock)',
      logs: ['[MOCK] Game stopped successfully'],
      executionTime: this.executionDelay
    };
  }

  /**
   * Mock code evaluation (very limited)
   * This only handles simple expressions and is for testing purposes only
   */
  private mockEvaluateCode(code: string): any {
    return this.mockEvaluate(code);
  }

  /**
   * Mock query evaluation (very limited)
   * This only handles simple expressions and is for testing purposes only
   */
  private mockEvaluateQuery(query: string): any {
    return this.mockEvaluate(query);
  }

  /**
   * Mock evaluation (very limited)
   * This only handles simple expressions and is for testing purposes only
   */
  private mockEvaluate(code: string): any {
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

      // For other code, return a mock object with a custom message
      return { mockResult: true, code, message: "This is a custom mock response added during hot reloading test!" };
    } catch (error) {
      throw new Error(`Cannot evaluate code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
