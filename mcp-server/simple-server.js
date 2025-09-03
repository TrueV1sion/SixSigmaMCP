#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const server = new Server(
  {
    name: "six-sigma-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Simple test tool
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "test_six_sigma",
      description: "Test Six Sigma MCP is working",
      inputSchema: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      }
    }
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "test_six_sigma") {
    return {
      content: [
        {
          type: "text",
          text: `✅ Six Sigma MCP is working! You said: ${request.params.arguments.message}`
        }
      ]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Six Sigma MCP test server is running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});