import { Router } from 'express';
import * as toolController from '../controllers/toolController';

const router = Router();

// Get server manifest
router.get('/manifest', toolController.getManifest);

// Execute a tool
router.post('/tools', toolController.executeTool);

// Get result by log ID
router.get('/results/:logId', toolController.getResult);

// SSE endpoint
router.get('/sse', toolController.setupSSE);

// Get help documentation
router.get('/help', toolController.getHelp);

export default router;
