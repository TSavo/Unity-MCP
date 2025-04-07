import { IUnityClient, UnityClientConfig } from './types';
import { UnityClient } from './UnityClient';
import { ResilientUnityClient } from './ResilientUnityClient';
import { MockUnityClient } from './MockUnityClient';
import logger from '../utils/logger';

/**
 * Factory for creating Unity clients
 */
export class UnityClientFactory {
  /**
   * Create a Unity client
   * @param config Client configuration
   * @returns A Unity client instance
   */
  public static createClient(config: UnityClientConfig = {}): IUnityClient {
    const { host = 'localhost', port = 8081, resilient = true } = config;

    // Check if we should use a mock client
    if (process.env.UNITY_MOCK === 'true') {
      logger.info('Using mock Unity client');
      return this.createMockClient({
        connected: true,
        executionDelay: parseInt(process.env.UNITY_MOCK_DELAY || '50'),
        failureRate: parseFloat(process.env.UNITY_MOCK_FAILURE_RATE || '0')
      });
    }

    // Create a real client
    if (resilient) {
      logger.info(`Creating resilient Unity client for ${host}:${port}`);
      return new ResilientUnityClient(host, port, config.resilientOptions);
    } else {
      logger.info(`Creating standard Unity client for ${host}:${port}`);
      return new UnityClient(host, port);
    }
  }

  /**
   * Create a mock Unity client for testing
   * @param options Mock options
   * @returns A mock Unity client
   */
  public static createMockClient(options: {
    connected?: boolean;
    executionDelay?: number;
    failureRate?: number;
  } = {}): MockUnityClient {
    logger.info('Creating mock Unity client for testing');
    return new MockUnityClient({
      connected: options.connected ?? true,
      executionDelay: options.executionDelay ?? 50,
      failureRate: options.failureRate ?? 0
    });
  }
}
