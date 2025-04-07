"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const toolController_1 = require("./controllers/toolController");
const logsController_1 = require("./controllers/logsController");
const router = express_1.default.Router();
// API endpoints
router.get('/manifest', toolController_1.getManifest);
router.get('/sse', toolController_1.setupSSE);
router.get('/help', toolController_1.getHelp);
router.get('/results/:logId', toolController_1.getResult);
router.get('/operations', toolController_1.listOperations);
router.post('/tools', toolController_1.executeTool);
router.post('/cancel/:logId', toolController_1.cancelOperation);
// New endpoint for Unity to update operation results
router.post('/update/:logId', toolController_1.updateOperation);
// Logs endpoints
router.post('/logs/:logName', logsController_1.appendToLog); // Append to a log
router.get('/logs/:logName', logsController_1.getLogByName); // Get a log by name
router.get('/logs', logsController_1.getLogs); // Get all logs
router.delete('/logs/:logName', logsController_1.clearLog); // Clear a log
exports.default = router;
