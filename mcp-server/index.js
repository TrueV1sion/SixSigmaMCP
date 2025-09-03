#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Six Sigma MCP Server - Direct JavaScript version
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
          resources: {},
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
              project_name: { type: "string", description: "Name of the project" },
              business_case: { type: "string", description: "Business justification" },
              requirements: { 
                type: "array", 
                items: { type: "string" },
                description: "Initial requirements list"
              },
              deployment_target: { type: "string", description: "Target deployment platform" },
              budget_limit: { type: "number", description: "Monthly budget in USD" }
            },
            required: ["project_name", "business_case", "requirements"]
          }
        },        {
          name: "define_phase",
          description: "Execute Define phase: VOC analysis, CTQ tree, constraints",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "get_project_status",
          description: "Get current project status and phase",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" }
            },
            required: ["project_id"]
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "create_project":
          return await this.createProject(args);
        case "define_phase":
          return await this.definePhase(args);
        case "get_project_status":
          return await this.getProjectStatus(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }
  async createProject(args) {
    const projectId = `proj_${Date.now()}`;
    const project = {
      id: projectId,
      name: args.project_name,
      business_case: args.business_case,
      requirements: args.requirements,
      deployment_target: args.deployment_target || "Not specified",
      budget_limit: args.budget_limit || 0,
      created_at: new Date().toISOString(),
      current_phase: "DEFINE",
      artifacts: {},
      metrics: {}
    };

    this.projectState.set(projectId, project);
    this.currentPhase = "DEFINE";

    return {
      content: [
        {
          type: "text",
          text: `✅ Project created successfully!\n\nProject ID: ${projectId}\nName: ${args.project_name}\nPhase: DEFINE\n\nNext step: Run 'define_phase' with this project ID.`
        }
      ]
    };
  }

  async definePhase(args) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    const defineArtifacts = {
      voc_analysis: {
        functional_requirements: project.requirements.filter(r => !r.includes("performance")),
        non_functional_requirements: project.requirements.filter(r => r.includes("performance") || r.includes("load"))
      },
      ctq_tree: {
        performance: { page_load_time: { target: 2.0, usl: 3.0 } },
        reliability: { uptime: { target: 99.9, usl: 100 } }
      }
    };

    project.artifacts.define = defineArtifacts;
    project.current_phase = "MEASURE";

    return {
      content: [{
        type: "text", 
        text: `✅ Define Phase Complete!\n\n${JSON.stringify(defineArtifacts, null, 2)}`
      }]
    };
  }
  async getProjectStatus(args) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      return { 
        content: [{ 
          type: "text", 
          text: "❌ Project not found" 
        }] 
      };
    }

    return {
      content: [{
        type: "text",
        text: `📊 Project Status:\n\n${JSON.stringify(project, null, 2)}`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Six Sigma MCP Server running on stdio");
  }
}

// Start the server
const server = new SixSigmaMCPServer();
server.run().catch(console.error);