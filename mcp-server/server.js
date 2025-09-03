const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Six Sigma MCP Server - CommonJS version
class SixSigmaMCPServer {
  constructor() {
    this.projectState = new Map();
    this.currentPhase = "NONE";
    
    this.server = new Server(
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

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "create_project",
          description: "Initialize a new Six Sigma DMAIC project",
          inputSchema: {
            type: "object",
            properties: {
              project_name: { type: "string" },
              business_case: { type: "string" },
              requirements: { type: "array", items: { type: "string" } }
            },
            required: ["project_name", "business_case", "requirements"]
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "create_project") {
        return this.createProject(args);
      }
      
      throw new Error(`Unknown tool: ${name}`);
    });
  }
  createProject(args) {
    const projectId = `proj_${Date.now()}`;
    const project = {
      id: projectId,
      name: args.project_name,
      business_case: args.business_case,
      requirements: args.requirements,
      created_at: new Date().toISOString(),
      current_phase: "DEFINE"
    };

    this.projectState.set(projectId, project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Project created!\nID: ${projectId}\nName: ${args.project_name}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Six Sigma MCP Server running");
  }
}

// Start the server
const server = new SixSigmaMCPServer();
server.run().catch(console.error);