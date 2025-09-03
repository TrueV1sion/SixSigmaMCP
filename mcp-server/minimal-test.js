#!/usr/bin/env node

// Minimal Six Sigma MCP test - no dependencies
console.error("Six Sigma MCP starting...");

// Simple stdio handler
process.stdin.on('data', (data) => {
  try {
    const request = JSON.parse(data.toString());
    console.error("Received request:", request.method);
    
    let response = {
      jsonrpc: "2.0",
      id: request.id
    };
    
    if (request.method === "initialize") {
      response.result = {
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "six-sigma-mcp",
          version: "1.0.0"
        }
      };
    } else if (request.method === "tools/list") {
      response.result = {
        tools: [{
          name: "six_sigma_test",
          description: "Test Six Sigma MCP",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }]
      };
    } else if (request.method === "tools/call") {
      response.result = {
        content: [{
          type: "text",
          text: "Six Sigma MCP is working!"
        }]
      };
    }
    
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (error) {
    console.error("Error:", error);
  }
});

console.error("Six Sigma MCP ready");