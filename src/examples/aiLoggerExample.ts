import { AILogger, LogLevel } from '../logging/AILogger';

/**
 * Example of how to use the AILogger
 */
async function runExample() {
  // Create a logger with default options
  const logger = new AILogger('example-log');

  console.log('Logging messages...');

  // Log messages at different levels
  await logger.debug('This is a debug message');
  await logger.info('This is an info message');
  await logger.warn('This is a warning message');
  await logger.error('This is an error message', { errorCode: 500 });
  await logger.fatal('This is a fatal message', { errorCode: 999, details: 'Critical system failure' });

  // Log with custom data
  await logger.info('User logged in', {
    userId: '12345',
    username: 'john.doe',
    loginTime: new Date().toISOString()
  });

  // Get log entries
  console.log('Getting log entries...');
  const entries = await logger.getEntries();
  console.log(`Retrieved ${entries.length} entries:`);
  console.log(JSON.stringify(entries, null, 2));

  // Clear the log
  console.log('Clearing log...');
  const cleared = await logger.clear();
  console.log(`Log cleared: ${cleared}`);

  // Verify log is cleared
  const entriesAfterClear = await logger.getEntries();
  console.log(`Entries after clear: ${entriesAfterClear.length}`);
}

// Run the example
runExample().catch(error => {
  console.error('Error running example:', error);
});
