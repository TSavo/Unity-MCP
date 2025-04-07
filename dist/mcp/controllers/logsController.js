"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogsByName = exports.appendToLog = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const asyncExecutionSystem_1 = require("../../async/asyncExecutionSystem");
// Get the async execution system
const asyncExecutionSystem = asyncExecutionSystem_1.AsyncExecutionSystem.getInstance();
/**
 * Append data to a log
 */
const appendToLog = async (req, res) => {
    const { logName } = req.params;
    const data = req.body;
    try {
        logger_1.default.info(`Appending to log: ${logName}`);
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
    }
    catch (error) {
        logger_1.default.error(`Error appending to log: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.appendToLog = appendToLog;
/**
 * Get logs by name
 */
const getLogsByName = async (req, res) => {
    const { logName } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    try {
        logger_1.default.info(`Getting logs for: ${logName}`);
        // Get logs by name
        const logs = await asyncExecutionSystem.getLogsByName(logName, limit);
        res.json({
            status: 'success',
            logs
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getLogsByName = getLogsByName;
