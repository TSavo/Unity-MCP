import { Router } from 'express';
import * as toolController from '../controllers/toolController';

const router = Router();

// Get server manifest
router.get('/manifest', toolController.getManifest);

// Execute a tool
router.post('/tools', toolController.executeTool);

// Get result by log ID
router.get('/results/:logId', toolController.getResult);

// Cancel operation by log ID
router.post('/cancel/:logId', toolController.cancelOperation);

// SSE endpoint
router.get('/sse', toolController.setupSSE);

// Get help documentation
router.get('/help', toolController.getHelp);

// List all operations
router.get('/operations', toolController.listOperations);

export default router;
