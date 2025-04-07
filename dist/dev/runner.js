"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = __importStar(require("chokidar"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Development runner for Unity-MCP
 *
 * This script:
 * - Watches for changes in TypeScript and C# code
 * - Triggers compilation when changes are detected
 * - Restarts the appropriate services
 * - Provides a unified development experience
 */
// Configuration
const config = {
    // TypeScript
    tsSourceDir: path.resolve(__dirname, '../../src'),
    tsConfigPath: path.resolve(__dirname, '../../tsconfig.json'),
    // Unity Client
    unityClientDir: path.resolve(__dirname, '../../unity-client'),
    // Docker
    dockerComposeDevPath: path.resolve(__dirname, '../../docker-compose.dev.yml'),
    // Build output
    buildOutputDir: path.resolve(__dirname, '../../dist'),
    // Debounce time in ms
    debounceTime: 500,
};
// State
let tscProcess = null;
let serverProcess = null;
let unityClientProcess = null;
let isCompiling = false;
let pendingRestart = false;
let lastTsChange = 0;
let lastCsChange = 0;
/**
 * Log a message with timestamp
 */
function log(message, type = 'info') {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const prefix = `[${timestamp}]`;
    switch (type) {
        case 'info':
            console.log(chalk_1.default.blue(prefix), message);
            break;
        case 'error':
            console.error(chalk_1.default.red(prefix), message);
            break;
        case 'success':
            console.log(chalk_1.default.green(prefix), message);
            break;
        case 'warning':
            console.log(chalk_1.default.yellow(prefix), message);
            break;
    }
}
/**
 * Start the TypeScript compiler in watch mode
 */
function startTypeScriptCompiler() {
    if (tscProcess) {
        log('TypeScript compiler is already running', 'warning');
        return;
    }
    log('Starting TypeScript compiler in watch mode...', 'info');
    tscProcess = (0, child_process_1.spawn)('npx', ['tsc', '--watch', '--preserveWatchOutput'], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'pipe',
    });
    tscProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        // Check if compilation is starting
        if (output.includes('Starting compilation')) {
            isCompiling = true;
            log('TypeScript compilation started...', 'info');
        }
        // Check if compilation is complete
        if (output.includes('Watching for file changes')) {
            isCompiling = false;
            log('TypeScript compilation completed', 'success');
            // If a restart was requested during compilation, restart now
            if (pendingRestart) {
                pendingRestart = false;
                restartServices();
            }
        }
        // Check for errors
        if (output.includes('error TS')) {
            log('TypeScript compilation error', 'error');
            console.error(output);
        }
    });
    tscProcess.stderr?.on('data', (data) => {
        log(`TypeScript compiler error: ${data}`, 'error');
    });
    tscProcess.on('close', (code) => {
        log(`TypeScript compiler exited with code ${code}`, code === 0 ? 'info' : 'error');
        tscProcess = null;
    });
}
/**
 * Start Docker Compose services
 */
function startDockerServices() {
    log('Starting Docker services...', 'info');
    const dockerComposeUp = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'up', '--build', '-d'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeUp.on('close', (code) => {
        if (code === 0) {
            log('Docker services started successfully', 'success');
            startDockerLogs();
        }
        else {
            log(`Docker services failed to start with code ${code}`, 'error');
        }
    });
}
/**
 * Start Docker Compose logs
 */
function startDockerLogs() {
    log('Starting Docker logs...', 'info');
    const dockerComposeLogs = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'logs', '-f'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeLogs.on('close', (code) => {
        log(`Docker logs exited with code ${code}`, code === 0 ? 'info' : 'error');
    });
}
/**
 * Restart Docker services
 */
function restartServices() {
    // If we're currently compiling, set a flag to restart after compilation
    if (isCompiling) {
        log('Compilation in progress, will restart services when complete', 'info');
        pendingRestart = true;
        return;
    }
    log('Restarting Docker services...', 'info');
    const dockerComposeRestart = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'restart'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeRestart.on('close', (code) => {
        if (code === 0) {
            log('Docker services restarted successfully', 'success');
        }
        else {
            log(`Docker services failed to restart with code ${code}`, 'error');
        }
    });
}
/**
 * Watch for TypeScript file changes
 */
function watchTypeScriptFiles() {
    log('Watching for TypeScript file changes...', 'info');
    const watcher = chokidar.watch(`${config.tsSourceDir}/**/*.ts`, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true, // Use polling for more reliable detection on Windows/Docker
        interval: 1000, // Poll every 1 second
        awaitWriteFinish: true, // Wait for writes to finish
    });
    watcher.on('change', (filePath) => {
        const now = Date.now();
        // Debounce changes
        if (now - lastTsChange < config.debounceTime) {
            return;
        }
        lastTsChange = now;
        log(`TypeScript file changed: ${filePath}`, 'info');
        // TypeScript files are automatically compiled by the tsc --watch process
        // We don't need to trigger a manual compilation
    });
}
/**
 * Watch for C# file changes
 */
function watchCSharpFiles() {
    log('Watching for C# file changes...', 'info');
    const watcher = chokidar.watch(`${config.unityClientDir}/**/*.cs`, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true, // Use polling for more reliable detection on Windows/Docker
        interval: 1000, // Poll every 1 second
        awaitWriteFinish: true, // Wait for writes to finish
    });
    watcher.on('change', (filePath) => {
        const now = Date.now();
        // Debounce changes
        if (now - lastCsChange < config.debounceTime) {
            return;
        }
        lastCsChange = now;
        log(`C# file changed: ${filePath}`, 'info');
        // Restart the Unity client container
        restartUnityClient();
    });
}
/**
 * Restart the Unity client container
 */
function restartUnityClient() {
    log('Restarting Unity client container...', 'info');
    const dockerComposeRestart = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'restart', 'unity-client'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeRestart.on('close', (code) => {
        if (code === 0) {
            log('Unity client container restarted successfully', 'success');
        }
        else {
            log(`Unity client container failed to restart with code ${code}`, 'error');
        }
    });
}
/**
 * Watch for compiled JavaScript file changes
 */
function watchCompiledJsFiles() {
    log('Watching for compiled JavaScript file changes...', 'info');
    const watcher = chokidar.watch(`${config.buildOutputDir}/**/*.js`, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true, // Use polling for more reliable detection on Windows/Docker
        interval: 1000, // Poll every 1 second
        awaitWriteFinish: true, // Wait for writes to finish
    });
    watcher.on('change', (filePath) => {
        const now = Date.now();
        // Debounce changes
        if (now - lastTsChange < config.debounceTime) {
            return;
        }
        lastTsChange = now;
        log(`Compiled JavaScript file changed: ${filePath}`, 'info');
        // Restart the MCP server container
        restartMcpServer();
    });
}
/**
 * Restart the MCP server container
 */
function restartMcpServer() {
    log('Restarting MCP server container...', 'info');
    const dockerComposeRestart = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'restart', 'mcp-server'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeRestart.on('close', (code) => {
        if (code === 0) {
            log('MCP server container restarted successfully', 'success');
        }
        else {
            log(`MCP server container failed to restart with code ${code}`, 'error');
        }
    });
}
/**
 * Stop all processes and exit
 */
function cleanup() {
    log('Cleaning up...', 'info');
    if (tscProcess) {
        tscProcess.kill();
    }
    if (serverProcess) {
        serverProcess.kill();
    }
    if (unityClientProcess) {
        unityClientProcess.kill();
    }
    // Stop Docker services
    const dockerComposeDown = (0, child_process_1.spawn)('docker-compose', [
        '-f', config.dockerComposeDevPath,
        'down'
    ], {
        cwd: path.resolve(__dirname, '../..'),
        shell: true,
        stdio: 'inherit',
    });
    dockerComposeDown.on('close', (code) => {
        log(`Docker services stopped with code ${code}`, code === 0 ? 'success' : 'error');
        process.exit(0);
    });
}
/**
 * Main function
 */
function main() {
    log('Starting Unity-MCP development runner...', 'info');
    // Register cleanup handlers
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    // Start TypeScript compiler
    startTypeScriptCompiler();
    // Start Docker services
    startDockerServices();
    // Watch for file changes
    watchTypeScriptFiles();
    watchCSharpFiles();
    watchCompiledJsFiles();
    log('Development runner started successfully', 'success');
    log('Press Ctrl+C to stop', 'info');
}
// Run the main function
main();
