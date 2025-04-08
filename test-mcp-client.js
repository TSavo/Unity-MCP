// Simple script to test the MCP STDIO client
const { spawn } = require('child_process');
const path = require('path');

// Create a JSON-RPC 2.0 initialize request
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '1.0',
    capabilities: {
      tools: true,
      resources: true
    },
    clientInfo: {
      name: 'AILogger Test Client',
      version: '1.0.0'
    }
  }
};

// Create a JSON-RPC 2.0 request to execute code
const executeCodeRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'execute_code',
    arguments: {
      code: 'return "Hello from Unity!";',
      timeout: 5000
    }
  }
};

// Spawn the MCP STDIO client
const mcpClient = spawn('node', [path.join('dist', 'mcp-stdio-client.js')], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle stdout
mcpClient.stdout.on('data', (data) => {
  console.log(`Received from MCP client: ${data}`);
  
  try {
    const response = JSON.parse(data);
    console.log('Parsed response:', JSON.stringify(response, null, 2));
    
    // If this is the initialize response, send the execute_code request
    if (response.id === 1) {
      console.log('Sending execute_code request...');
      mcpClient.stdin.write(JSON.stringify(executeCodeRequest) + '\n');
    }
    
    // If this is the execute_code response, exit
    if (response.id === 2) {
      console.log('Test completed successfully!');
      mcpClient.kill();
      process.exit(0);
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }
});

// Handle stderr
mcpClient.stderr.on('data', (data) => {
  console.error(`MCP client stderr: ${data}`);
});

// Handle process exit
mcpClient.on('close', (code) => {
  console.log(`MCP client exited with code ${code}`);
});

// Send the initialize request
console.log('Sending initialize request...');
mcpClient.stdin.write(JSON.stringify(initializeRequest) + '\n');

// Set a timeout to kill the process if it doesn't complete
setTimeout(() => {
  console.error('Test timed out after 10 seconds');
  mcpClient.kill();
  process.exit(1);
}, 10000);
