#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import all agents
import { DefineAgent } from "./agents/define-agent.js";
import { MeasureAgent } from "./agents/measure-agent.js";
import { AnalyzeAgent } from "./agents/analyze-agent.js";
import { ImproveAgent } from "./agents/improve-agent.js";
import { ControlAgent } from "./agents/control-agent.js";
import { SharedResourceManager } from "./shared/resource-manager.js";
import { QualityGateManager } from "./shared/quality-gates.js";
import { ProjectState, DMAICPhase, PhaseArtifacts } from "./types/index.js";

export class SixSigmaMCPServer {
  private server: Server;
  private projects: Map<string, ProjectState> = new Map();
  private resourceManager: SharedResourceManager;
  private qualityGates: QualityGateManager;
  
  // Phase agents
  private defineAgent: DefineAgent;
  private measureAgent: MeasureAgent;
  private analyzeAgent: AnalyzeAgent;
  private improveAgent: ImproveAgent;
  private controlAgent: ControlAgent;

  constructor() {
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

    // Initialize shared components
    this.resourceManager = new SharedResourceManager();
    this.qualityGates = new QualityGateManager();
    
    // Initialize agents
    this.defineAgent = new DefineAgent(this.resourceManager);
    this.measureAgent = new MeasureAgent(this.resourceManager);
    this.analyzeAgent = new AnalyzeAgent(this.resourceManager);
    this.improveAgent = new ImproveAgent(this.resourceManager);
    this.controlAgent = new ControlAgent(this.resourceManager);

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
              budget_limit: { type: "number", description: "Monthly budget in USD" },
              timeline_days: { type: "number", description: "Project timeline in days" }
            },
            required: ["project_name", "business_case", "requirements"]
          }
        },
        {
          name: "define_phase",
          description: "Execute Define phase: VOC analysis, CTQ tree, constraints",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
          }
        },        {
          name: "measure_phase",
          description: "Execute Measure phase: Define KPIs, establish baselines",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "analyze_phase",
          description: "Execute Analyze phase: Root cause analysis, FMEA",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "improve_phase",
          description: "Execute Improve phase: Generate solution with Claude",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" },
              use_claude: { type: "boolean", description: "Use Claude for code generation", default: true }
            },
            required: ["project_id"]
          }
        },        {
          name: "control_phase",
          description: "Execute Control phase: Validate deployment, set up monitoring",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "get_project_status",
          description: "Get detailed project status including phase artifacts and metrics",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "check_quality_gates",
          description: "Check if quality gates are met for phase transition",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" },
              from_phase: { type: "string", enum: ["DEFINE", "MEASURE", "ANALYZE", "IMPROVE", "CONTROL"] },
              to_phase: { type: "string", enum: ["MEASURE", "ANALYZE", "IMPROVE", "CONTROL", "COMPLETE"] }
            },
            required: ["project_id", "from_phase", "to_phase"]
          }
        }
      ]
    }));
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "create_project":
          return await this.createProject(args);
        case "define_phase":
          return await this.executeDefinePhase(args);
        case "measure_phase":
          return await this.executeMeasurePhase(args);
        case "analyze_phase":
          return await this.executeAnalyzePhase(args);
        case "improve_phase":
          return await this.executeImprovePhase(args);
        case "control_phase":
          return await this.executeControlPhase(args);
        case "get_project_status":
          return await this.getProjectStatus(args);
        case "check_quality_gates":
          return await this.checkQualityGates(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async createProject(args: any) {
    const projectId = `proj_${Date.now()}`;
    const project: ProjectState = {
      id: projectId,
      name: args.project_name,
      business_case: args.business_case,
      requirements: args.requirements,
      deployment_target: args.deployment_target || "cloud",
      budget_limit: args.budget_limit || 0,
      timeline_days: args.timeline_days || 90,
      created_at: new Date().toISOString(),
      current_phase: DMAICPhase.DEFINE,
      artifacts: {},
      metrics: {},
      quality_gates: {}
    };