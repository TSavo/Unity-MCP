import { AILogger, LogLevel } from '../logging/AILogger';

/**
 * Test script to verify interaction between AILogger and MCP tools
 */
async function runTest() {
  // Create a logger with a unique log name for this test
  const logName = `tool-test-${Date.now()}`;
  console.log(`Using log name: ${logName}`);
  
  const logger = new AILogger(logName);

  // Log some test messages
  console.log('Logging test messages...');
  
  await logger.info('This is a test message from AILogger', {
    testId: '12345',
    timestamp: new Date().toISOString()
  });
  
  await logger.error('This is an error message', {
    errorCode: 500,
    errorDetails: 'Something went wrong'
  });
  
  await logger.debug('This is a debug message with complex data', {
    user: {
      id: 'user123',
      name: 'Test User',
      roles: ['admin', 'user']
    },
    session: {
      id: 'session456',
      startTime: new Date().toISOString(),
      active: true
    }
  });

  console.log('Finished logging test messages');
  console.log(`Now use the MCP tools to retrieve logs for: ${logName}`);
  console.log('Example command: get_log_by_name_unity-ai-bridge with log_name parameter set to:', logName);
}

// Run the test
runTest().catch(error => {
  console.error('Error running test:', error);
});
