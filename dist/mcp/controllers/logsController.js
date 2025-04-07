"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearLog = exports.getLogs = exports.getLogByName = exports.appendToLog = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const loggingSystem_1 = require("../../logging/loggingSystem");
// Get the logging system
const loggingSystem = loggingSystem_1.LoggingSystem.getInstance();
/**
 * Append data to a log
 */
const appendToLog = async (req, res) => {
    const { logName } = req.params;
    const data = req.body;
    try {
        logger_1.default.info(`Appending to log: ${logName}`);
        // Append to the log
        const logId = await loggingSystem.appendToLog(logName, data);
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
const getLogByName = async (req, res) => {
    const { logName } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    try {
        logger_1.default.info(`Getting log for: ${logName}`);
        // Get log by name
        const entries = await loggingSystem.getLogByName(logName, limit);
        res.json({
            status: 'success',
            name: logName,
            entries
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting log: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getLogByName = getLogByName;
/**
 * Get all logs
 */
const getLogs = async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    try {
        logger_1.default.info('Getting all logs');
        // Get all logs
        const logs = await loggingSystem.getLogs(limit);
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
exports.getLogs = getLogs;
/**
 * Clear a log
 */
const clearLog = async (req, res) => {
    const { logName } = req.params;
    try {
        logger_1.default.info(`Clearing log: ${logName}`);
        // Clear the log
        const success = await loggingSystem.clearLog(logName);
        res.json({
            status: 'success',
            cleared: success
        });
    }
    catch (error) {
        logger_1.default.error(`Error clearing log: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.clearLog = clearLog;
