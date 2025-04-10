/**
 * Interface for communicating with Unity
 */
export interface IUnityClient {
  /**
   * Execute C# code in Unity
   * @param code The C# code to execute
   * @param timeout Optional timeout in milliseconds
   * @returns A promise that resolves with the execution result
   */
  executeCode(code: string, timeout?: number): Promise<UnityExecutionResult>;

  /**
   * Execute a query in Unity
   * @param query The query to execute
   * @param timeout Optional timeout in milliseconds
   * @returns A promise that resolves with the query result
   */
  query(query: string, timeout?: number): Promise<UnityExecutionResult>;

  /**
   * Check if Unity is connected and responsive
   * @returns A promise that resolves with the connection status
   */
  checkConnection(): Promise<boolean>;

  /**
   * Get the current game state
   * @returns A promise that resolves with the game state
   */
  getGameState(): Promise<GameState>;

  /**
   * Start the game (enter play mode)
   * @returns A promise that resolves with the execution result
   */
  startGame(): Promise<UnityExecutionResult>;

  /**
   * Stop the game (exit play mode)
   * @returns A promise that resolves with the execution result
   */
  stopGame(): Promise<UnityExecutionResult>;

  /**
   * Get Unity version and environment information
   * @returns A promise that resolves with Unity environment info
   */
  getEnvironmentInfo(): Promise<UnityEnvironmentInfo>;
}

/**
 * Result of a Unity code execution
 */
export interface UnityExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  /** The result value (if any) */
  result?: any;
  /** Any error that occurred during execution */
  error?: string;
  /** Execution logs/output */
  logs?: string[];
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Unity environment information
 */
export interface UnityEnvironmentInfo {
  /** Unity version */
  unityVersion: string;
  /** Platform (Windows, macOS, Linux, etc.) */
  platform: string;
  /** Whether running in editor or standalone */
  isEditor: boolean;
  /** Available game objects in the scene (optional) */
  sceneObjects?: string[];
}

/**
 * Game state information
 */
export interface GameState {
  /** Whether the game is currently playing */
  isPlaying: boolean;
  /** Whether the game is currently paused */
  isPaused: boolean;
  /** Whether the editor is currently compiling */
  isCompiling: boolean;
  /** The name of the current scene */
  currentScene: string;
  /** The current time scale */
  timeScale: number;
  /** The current frame count */
  frameCount: number;
  /** The time in seconds since the start of the game */
  realtimeSinceStartup: number;
}

/**
 * Options for the resilient Unity client
 */
export interface ResilientUnityClientOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff?: boolean;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * Unity client configuration
 */
export interface UnityClientConfig {
  /** Unity host (default: localhost) */
  host?: string;
  /** Unity port (default: 8082) */
  port?: number;
  /** Whether to use resilient client with retries (default: true) */
  resilient?: boolean;
  /** Options for resilient client */
  resilientOptions?: ResilientUnityClientOptions;
}
