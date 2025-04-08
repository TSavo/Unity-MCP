import { IUnityClient, UnityExecutionResult, UnityEnvironmentInfo, GameState, ResilientUnityClientOptions } from './types';
import { UnityClient } from './UnityClient';
import logger from '../utils/logger';

/**
 * Unity client with retry and resilience features
 */
export class ResilientUnityClient implements IUnityClient {
  private readonly client: UnityClient;
  private readonly options: Required<ResilientUnityClientOptions>;

  constructor(
    host: string = 'localhost',
    port: number = 8081,
    options: ResilientUnityClientOptions = {}
  ) {
    this.client = new UnityClient(host, port);
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 500,
      useExponentialBackoff: options.useExponentialBackoff ?? true,
      connectionTimeout: options.connectionTimeout ?? 5000
    };

    logger.info(`Created resilient Unity client with ${this.options.maxRetries} max retries`);
  }

  /**
   * Execute C# code in Unity with retry logic
   */
  public async executeCode(code: string, timeout?: number): Promise<UnityExecutionResult> {
    return this.withRetry(() => this.client.executeCode(code, timeout));
  }

  /**
   * Execute a query in Unity with retry logic
   */
  public async query(query: string, timeout?: number): Promise<UnityExecutionResult> {
    return this.withRetry(() => this.client.query(query, timeout));
  }

  /**
   * Check connection with retry logic
   */
  public async checkConnection(): Promise<boolean> {
    try {
      await this.withRetry(
        () => this.client.checkConnection(),
        // For connection checks, we want to return false instead of throwing
        (result) => result === true,
        1 // Only retry once for connection checks
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get environment info with retry logic
   */
  public async getEnvironmentInfo(): Promise<UnityEnvironmentInfo> {
    return this.withRetry(() => this.client.getEnvironmentInfo());
  }

  /**
   * Get game state with retry logic
   */
  public async getGameState(): Promise<GameState> {
    return this.withRetry(() => this.client.getGameState());
  }

  /**
   * Start game with retry logic
   */
  public async startGame(): Promise<UnityExecutionResult> {
    return this.withRetry(() => this.client.startGame());
  }

  /**
   * Stop game with retry logic
   */
  public async stopGame(): Promise<UnityExecutionResult> {
    return this.withRetry(() => this.client.stopGame());
  }

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param validateFn Optional function to validate the result
   * @param maxRetries Optional override for max retries
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    validateFn: (result: T) => boolean = () => true,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.options.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await fn();

        // Validate the result
        if (!validateFn(result)) {
          throw new Error('Operation returned invalid result');
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt + 1}/${retries + 1} failed: ${lastError.message}`);

        if (attempt < retries) {
          const delay = this.options.useExponentialBackoff
            ? this.options.retryDelay * Math.pow(2, attempt)
            : this.options.retryDelay;

          logger.debug(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`Operation failed after ${retries + 1} attempts`);
    throw lastError || new Error('Operation failed after retries');
  }
}
