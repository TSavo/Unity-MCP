import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { AsyncExecutionSystem } from '../../async/asyncExecutionSystem';

// Get the async execution system
const asyncExecutionSystem = AsyncExecutionSystem.getInstance();

/**
 * Append data to a log
 */
export const appendToLog = async (req: Request, res: Response): Promise<void> => {
  const { logName } = req.params;
  const data = req.body;

  try {
    logger.info(`Appending to log: ${logName}`);

    // Create a log entry
    const logEntry = {
      logName,
      data,
      timestamp: new Date().toISOString()
    };

    // Store the log entry
    const logId = await asyncExecutionSystem.storeLogEntry(logName, logEntry);

    res.json({
      status: 'success',
      logId
    });
  } catch (error) {
    logger.error(`Error appending to log: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get logs by name
 */
export const getLogsByName = async (req: Request, res: Response): Promise<void> => {
  const { logName } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  try {
    logger.info(`Getting logs for: ${logName}`);

    // Get logs by name
    const logs = await asyncExecutionSystem.getLogsByName(logName, limit);

    res.json({
      status: 'success',
      logs
    });
  } catch (error) {
    logger.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
