import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { LoggingSystem } from '../../logging/loggingSystem';

// Get the logging system
const loggingSystem = LoggingSystem.getInstance();

/**
 * Append data to a log
 */
export const appendToLog = async (req: Request, res: Response): Promise<void> => {
  const { logName } = req.params;
  const data = req.body;

  try {
    logger.info(`Appending to log: ${logName}`);

    // Append to the log
    const logId = await loggingSystem.appendToLog(logName, data);

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
export const getLogByName = async (req: Request, res: Response): Promise<void> => {
  const { logName } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  try {
    logger.info(`Getting log for: ${logName}`);

    // Get log by name
    const entries = await loggingSystem.getLogByName(logName, limit);

    res.json({
      status: 'success',
      name: logName,
      entries
    });
  } catch (error) {
    logger.error(`Error getting log: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get all logs
 */
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  try {
    logger.info('Getting all logs');

    // Get all logs
    const logs = await loggingSystem.getLogs(limit);

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

/**
 * Clear a log
 */
export const clearLog = async (req: Request, res: Response): Promise<void> => {
  const { logName } = req.params;

  try {
    logger.info(`Clearing log: ${logName}`);

    // Clear the log
    const success = await loggingSystem.clearLog(logName);

    res.json({
      status: 'success',
      cleared: success
    });
  } catch (error) {
    logger.error(`Error clearing log: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};