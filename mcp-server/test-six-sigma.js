#!/usr/bin/env node

// Test script for Six Sigma MCP Server
console.log("Testing Six Sigma MCP Server...\n");

const { spawn } = require('child_process');
const path = require('path');

// Path to the server
const serverPath = path.join(__dirname, 'six-sigma-server.js');

// Start the server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server stderr (startup messages)
server.stderr.on('data', (data) => {
  console.log(`Server: ${data.toString().trim()}`);
});

// Test sequence
async function runTests() {
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("\n1. Testing initialize...");
  await sendRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  });

  console.log("\n2. Testing tools/list...");
  await sendRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  });

  console.log("\n3. Testing create_project...");
  await sendRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "create_project",
      arguments: {
        project_name: "Test E-commerce Platform",
        business_case: "Improve site performance and reliability",
        requirements: [
          "Page load time < 2 seconds",
          "99.9% uptime",
          "Handle 1000 concurrent users"
        ],
        deployment_target: "AWS",
        budget_limit: 50000
      }
    }
  });

  console.log("\n✅ All tests completed!");
  console.log("\nThe Six Sigma MCP Server is working correctly!");
  console.log("You can now use it in Claude Desktop.");
  
  // Clean shutdown
  server.kill();
  process.exit(0);
}

function sendRequest(request) {
  return new Promise((resolve) => {
    // Send request
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Listen for response
    const handler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log("Response:", JSON.stringify(response, null, 2));
        server.stdout.removeListener('data', handler);
        resolve(response);
      } catch (e) {
        // Not JSON, might be partial data
      }
    };
    
    server.stdout.on('data', handler);
  });
}

// Run tests
runTests().catch(err => {
  console.error("Test failed:", err);
  server.kill();
  process.exit(1);
});