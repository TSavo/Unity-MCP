import express from 'express';
import { executeTool, getResult, getManifest, setupSSE, getHelp, cancelOperation, listOperations, updateOperation } from './controllers/toolController';
import { appendToLog, getLogByName, getLogs, clearLog } from './controllers/logsController';

const router = express.Router();

// API endpoints
router.get('/manifest', getManifest);
router.get('/sse', setupSSE);
router.get('/help', getHelp);
router.get('/results/:logId', getResult);
router.get('/operations', listOperations);

router.post('/tools', executeTool);
router.post('/cancel/:logId', cancelOperation);

// New endpoint for Unity to update operation results
router.post('/update/:logId', updateOperation);

// Logs endpoints
router.post('/logs/:logName', appendToLog); // Append to a log
router.get('/logs/:logName', getLogByName); // Get a log by name
router.get('/logs', getLogs); // Get all logs
router.delete('/logs/:logName', clearLog); // Clear a log

export default router;
