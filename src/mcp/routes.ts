import express from 'express';
import { executeTool, getResult, getManifest, setupSSE, getHelp, cancelOperation, listOperations, updateOperation } from './controllers/toolController';
import { appendToLog, getLogsByName } from './controllers/logsController';

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
router.post('/logs', appendToLog); // Create a new log or append to existing log
router.get('/logs', getLogsByName); // Get logs by name (using query parameter)

export default router;
