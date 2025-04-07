import * as chokidar from 'chokidar';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

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
let tscProcess: ChildProcess | null = null;
let serverProcess: ChildProcess | null = null;
let unityClientProcess: ChildProcess | null = null;
let isCompiling = false;
let pendingRestart = false;
let lastTsChange = 0;
let lastCsChange = 0;

/**
 * Log a message with timestamp
 */
function log(message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'info':
      console.log(chalk.blue(prefix), message);
      break;
    case 'error':
      console.error(chalk.red(prefix), message);
      break;
    case 'success':
      console.log(chalk.green(prefix), message);
      break;
    case 'warning':
      console.log(chalk.yellow(prefix), message);
      break;
  }
}

/**
 * Start the TypeScript compiler in watch mode
 */
function startTypeScriptCompiler(): void {
  if (tscProcess) {
    log('TypeScript compiler is already running', 'warning');
    return;
  }
  
  log('Starting TypeScript compiler in watch mode...', 'info');
  
  tscProcess = spawn('npx', ['tsc', '--watch', '--preserveWatchOutput'], {
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
function startDockerServices(): void {
  log('Starting Docker services...', 'info');
  
  const dockerComposeUp = spawn('docker-compose', [
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
    } else {
      log(`Docker services failed to start with code ${code}`, 'error');
    }
  });
}

/**
 * Start Docker Compose logs
 */
function startDockerLogs(): void {
  log('Starting Docker logs...', 'info');
  
  const dockerComposeLogs = spawn('docker-compose', [
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
function restartServices(): void {
  // If we're currently compiling, set a flag to restart after compilation
  if (isCompiling) {
    log('Compilation in progress, will restart services when complete', 'info');
    pendingRestart = true;
    return;
  }
  
  log('Restarting Docker services...', 'info');
  
  const dockerComposeRestart = spawn('docker-compose', [
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
    } else {
      log(`Docker services failed to restart with code ${code}`, 'error');
    }
  });
}

/**
 * Watch for TypeScript file changes
 */
function watchTypeScriptFiles(): void {
  log('Watching for TypeScript file changes...', 'info');
  
  const watcher = chokidar.watch(`${config.tsSourceDir}/**/*.ts`, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    usePolling: true,        // Use polling for more reliable detection on Windows/Docker
    interval: 1000,          // Poll every 1 second
    awaitWriteFinish: true,  // Wait for writes to finish
  });
  
  watcher.on('change', (filePath: string) => {
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
function watchCSharpFiles(): void {
  log('Watching for C# file changes...', 'info');
  
  const watcher = chokidar.watch(`${config.unityClientDir}/**/*.cs`, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    usePolling: true,        // Use polling for more reliable detection on Windows/Docker
    interval: 1000,          // Poll every 1 second
    awaitWriteFinish: true,  // Wait for writes to finish
  });
  
  watcher.on('change', (filePath: string) => {
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
function restartUnityClient(): void {
  log('Restarting Unity client container...', 'info');
  
  const dockerComposeRestart = spawn('docker-compose', [
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
    } else {
      log(`Unity client container failed to restart with code ${code}`, 'error');
    }
  });
}

/**
 * Watch for compiled JavaScript file changes
 */
function watchCompiledJsFiles(): void {
  log('Watching for compiled JavaScript file changes...', 'info');
  
  const watcher = chokidar.watch(`${config.buildOutputDir}/**/*.js`, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    usePolling: true,        // Use polling for more reliable detection on Windows/Docker
    interval: 1000,          // Poll every 1 second
    awaitWriteFinish: true,  // Wait for writes to finish
  });
  
  watcher.on('change', (filePath: string) => {
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
function restartMcpServer(): void {
  log('Restarting MCP server container...', 'info');
  
  const dockerComposeRestart = spawn('docker-compose', [
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
    } else {
      log(`MCP server container failed to restart with code ${code}`, 'error');
    }
  });
}

/**
 * Stop all processes and exit
 */
function cleanup(): void {
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
  const dockerComposeDown = spawn('docker-compose', [
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
function main(): void {
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
