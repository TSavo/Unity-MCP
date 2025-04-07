import { AILogger, LogLevel } from '../logging/AILogger';

/**
 * Example service that uses AILogger
 */
class UserService {
  private logger: AILogger;

  constructor() {
    // Create a logger for this service
    this.logger = new AILogger('user-service', {
      defaultLevel: LogLevel.INFO,
      includeTimestamps: true
    });
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: string): Promise<any> {
    try {
      this.logger.info('Getting user by ID', { userId });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate user data
      const user = {
        id: userId,
        username: 'john.doe',
        email: 'john.doe@example.com',
        createdAt: '2025-01-01T00:00:00Z'
      };

      this.logger.debug('User retrieved successfully', { userId, user });

      return user;
    } catch (error) {
      this.logger.error('Error getting user by ID', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<any> {
    try {
      this.logger.info('Creating new user', { userData });

      // Validate user data
      if (!userData.username) {
        const error = new Error('Username is required');
        this.logger.warn('Validation failed', { error: error.message, userData });
        throw error;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate created user
      const user = {
        id: Math.random().toString(36).substring(2, 15),
        ...userData,
        createdAt: new Date().toISOString()
      };

      this.logger.info('User created successfully', { userId: user.id });

      return user;
    } catch (error) {
      this.logger.error('Error creating user', {
        userData,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  /**
   * Get all logs for this service
   */
  async getLogs(limit: number = 10): Promise<any[]> {
    return this.logger.getEntries(limit);
  }

  /**
   * Clear all logs for this service
   */
  async clearLogs(): Promise<boolean> {
    return this.logger.clear();
  }
}

/**
 * Example of how to use the AILogger in a service
 */
async function runAdvancedExample() {
  // Create a user service
  const userService = new UserService();

  console.log('Creating a user...');
  try {
    // Try to create a user with invalid data
    await userService.createUser({});
  } catch (error) {
    console.log('Expected error:', error instanceof Error ? error.message : String(error));
  }

  // Create a user with valid data
  const user = await userService.createUser({
    username: 'jane.doe',
    email: 'jane.doe@example.com'
  });
  console.log('User created:', user);

  // Get a user by ID
  const retrievedUser = await userService.getUserById(user.id);
  console.log('User retrieved:', retrievedUser);

  // Get logs
  console.log('Getting logs...');
  const logs = await userService.getLogs();
  console.log(`Retrieved ${logs.length} logs:`);
  console.log(JSON.stringify(logs, null, 2));

  // Clear logs
  console.log('Clearing logs...');
  const cleared = await userService.clearLogs();
  console.log(`Logs cleared: ${cleared}`);
}

// Run the advanced example
runAdvancedExample().catch(error => {
  console.error('Error running advanced example:', error);
});
