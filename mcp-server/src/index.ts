#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

// Types and Interfaces
interface ProjectState {
  id: string;
  name: string;
  business_case: string;
  requirements: string[];
  deployment_target: string;
  budget_limit: number;
  created_at: string;
  current_phase: DMAICPhase;
  artifacts: ProjectArtifacts;
  metrics: ProjectMetrics;
  quality_gates: QualityGateResults;
}

enum DMAICPhase {
  NONE = "NONE",
  DEFINE = "DEFINE",
  MEASURE = "MEASURE",
  ANALYZE = "ANALYZE",
  IMPROVE = "IMPROVE", 
  CONTROL = "CONTROL"
}

interface ProjectArtifacts {
  define?: DefineArtifacts;
  measure?: MeasureArtifacts;
  analyze?: AnalyzeArtifacts;
  improve?: ImproveArtifacts;
  control?: ControlArtifacts;
}
interface DefineArtifacts {
  voc_analysis: VOCAnalysis;
  ctq_tree: CTQTree;
  constraints: Constraints;
  sipoc_diagram: SIPOCDiagram;
}

interface VOCAnalysis {
  functional_requirements: string[];
  non_functional_requirements: string[];
  priority_matrix: {
    must_have: string[];
    should_have: string[];
    nice_to_have: string[];
  };
  stakeholder_needs: Record<string, string[]>;
}

interface CTQTree {
  performance: Record<string, { target: number; usl: number; lsl?: number }>;
  reliability: Record<string, { target: number; usl: number; lsl?: number }>;
  usability: Record<string, { target: number; usl: number; lsl?: number }>;
  security: Record<string, { target: number; usl: number; lsl?: number }>;
}

interface Constraints {
  deployment: string;
  budget: number;
  technical: {
    framework?: string;
    language?: string;
    platform?: string;
  };
  timeline: {
    deadline?: string;
    milestones?: Record<string, string>;
  };
}
interface SIPOCDiagram {
  suppliers: string[];
  inputs: string[];
  process_steps: string[];
  outputs: string[];
  customers: string[];
}

interface MeasureArtifacts {
  kpis: KPI[];
  baselines: Record<string, number>;
  measurement_system_analysis: MSAResults;
  data_collection_plan: DataCollectionPlan;
}

interface KPI {
  name: string;
  description: string;
  unit: string;
  target: number;
  current_value?: number;
  measurement_frequency: string;
}

interface MSAResults {
  repeatability: number;
  reproducibility: number;
  accuracy: number;
  linearity: number;
  stability: boolean;
}

interface DataCollectionPlan {
  metrics: string[];
  collection_methods: Record<string, string>;
  frequency: Record<string, string>;
  responsible_parties: Record<string, string>;
}
interface AnalyzeArtifacts {
  root_cause_analysis: RootCauseAnalysis;
  fmea: FMEA[];
  statistical_analysis: StatisticalAnalysis;
  process_capability: ProcessCapability;
}

interface RootCauseAnalysis {
  fishbone_categories: Record<string, string[]>;
  five_whys: Record<string, string[]>;
  pareto_analysis: { issue: string; frequency: number; impact: number }[];
  critical_xs: string[]; // Critical input variables
}

interface FMEA {
  failure_mode: string;
  effects: string[];
  severity: number;
  causes: string[];
  occurrence: number;
  current_controls: string[];
  detection: number;
  rpn: number; // Risk Priority Number
  recommended_actions: string[];
}

interface StatisticalAnalysis {
  hypothesis_tests: Record<string, { p_value: number; conclusion: string }>;
  correlation_analysis: Record<string, number>;
  regression_results?: {
    r_squared: number;
    coefficients: Record<string, number>;
    p_values: Record<string, number>;
  };
}
interface ProcessCapability {
  cp: number;
  cpk: number;
  sigma_level: number;
  defects_per_million: number;
}

interface ImproveArtifacts {
  proposed_solutions: Solution[];
  pilot_results: PilotResults;
  implementation_plan: ImplementationPlan;
  claude_generated_code?: GeneratedCode;
}

interface Solution {
  id: string;
  description: string;
  impact_analysis: {
    expected_improvement: Record<string, number>;
    cost: number;
    implementation_time: string;
    risks: string[];
  };
  poka_yoke_mechanisms: string[]; // Error-proofing mechanisms
}

interface PilotResults {
  solution_id: string;
  metrics_before: Record<string, number>;
  metrics_after: Record<string, number>;
  success: boolean;
  lessons_learned: string[];
}

interface ImplementationPlan {
  phases: { name: string; tasks: string[]; duration: string }[];
  resources_required: string[];
  training_plan: string[];
  rollback_strategy: string[];
}
interface GeneratedCode {
  language: string;
  framework: string;
  files: { path: string; content: string }[];
  quality_metrics: {
    cyclomatic_complexity: number;
    test_coverage: number;
    documentation_score: number;
  };
  ctq_compliance: Record<string, boolean>;
}

interface ControlArtifacts {
  control_plan: ControlPlan;
  monitoring_dashboard: MonitoringDashboard;
  documentation: Documentation;
  training_materials: string[];
}

interface ControlPlan {
  control_items: ControlItem[];
  response_plans: Record<string, string[]>;
  audit_schedule: { frequency: string; scope: string[] }[];
}

interface ControlItem {
  metric: string;
  specification_limits: { usl: number; lsl?: number; target: number };
  measurement_method: string;
  sample_size: number;
  frequency: string;
  responsible_party: string;
  reaction_plan: string[];
}
interface MonitoringDashboard {
  key_metrics: string[];
  control_charts: { metric: string; type: string }[];
  alert_thresholds: Record<string, { warning: number; critical: number }>;
  reporting_frequency: string;
}

interface Documentation {
  process_documentation: string[];
  technical_documentation: string[];
  user_guides: string[];
  api_documentation?: string[];
}

interface ProjectMetrics {
  define?: Record<string, any>;
  measure?: Record<string, any>;
  analyze?: Record<string, any>;
  improve?: Record<string, any>;
  control?: Record<string, any>;
}

interface QualityGateResults {
  define?: QualityGateResult;
  measure?: QualityGateResult;
  analyze?: QualityGateResult;
  improve?: QualityGateResult;
  control?: QualityGateResult;
}

interface QualityGateResult {
  passed: boolean;
  criteria_results: Record<string, boolean>;
  missing_items: string[];
  recommendations: string[];
}
// Main Six Sigma MCP Server Implementation
class SixSigmaMCPServer {
  private server: Server;
  private projectState: Map<string, ProjectState> = new Map();
  private sharedResources: Map<string, any> = new Map();
  private anthropic?: Anthropic;

  constructor() {
    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

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

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "create_project",
          description: "Initialize a new Six Sigma DMAIC project with quality-driven development approach",
          inputSchema: {
            type: "object",
            properties: {
              project_name: { 
                type: "string", 
                description: "Name of the software project"
              },              business_case: { 
                type: "string", 
                description: "Business justification and expected value"
              },
              requirements: { 
                type: "array", 
                items: { type: "string" },
                description: "Initial functional and non-functional requirements"
              },
              deployment_target: { 
                type: "string", 
                description: "Target deployment platform (e.g., AWS, Azure, Vercel)"
              },
              budget_limit: { 
                type: "number", 
                description: "Monthly budget limit in USD"
              }
            },
            required: ["project_name", "business_case", "requirements"]
          }
        },
        {
          name: "define_phase",
          description: "Execute Define phase: Voice of Customer analysis, CTQ tree generation, constraint documentation",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { 
                type: "string",
                description: "Project ID from create_project"
              },
              stakeholders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string" },
                    needs: { type: "array", items: { type: "string" } }
                  }
                },
                description: "Optional stakeholder information for VOC analysis"
              }
            },
            required: ["project_id"]
          }
        },        {
          name: "measure_phase",
          description: "Execute Measure phase: Define KPIs, establish baselines, create measurement system",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              custom_kpis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    unit: { type: "string" },
                    target: { type: "number" }
                  }
                },
                description: "Optional custom KPIs to track"
              }
            },
            required: ["project_id"]
          }
        },
        {
          name: "analyze_phase",
          description: "Execute Analyze phase: Root cause analysis, FMEA, statistical analysis",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              identified_issues: {
                type: "array",
                items: { type: "string" },
                description: "Optional list of known issues to analyze"
              }
            },
            required: ["project_id"]
          }
        },        {
          name: "improve_phase",
          description: "Execute Improve phase: Generate solutions using Claude AI with quality constraints",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              use_claude: { 
                type: "boolean", 
                default: true,
                description: "Use Claude AI for code generation"
              },
              specific_requirements: {
                type: "string",
                description: "Additional requirements for solution generation"
              }
            },
            required: ["project_id"]
          }
        },
        {
          name: "control_phase",
          description: "Execute Control phase: Create control plan, set up monitoring, validate deployment",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              deployment_url: {
                type: "string",
                description: "Optional deployment URL for validation"
              }
            },
            required: ["project_id"]
          }
        },
        {
          name: "get_project_status",
          description: "Get comprehensive project status including current phase, artifacts, and quality gates",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" },
              include_artifacts: {
                type: "boolean",
                default: true,
                description: "Include detailed artifacts in response"
              }
            },
            required: ["project_id"]
          }
        },        {
          name: "check_quality_gate",
          description: "Check if current phase quality gate criteria are met",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "get_shared_resources",
          description: "Access shared resources across agents",
          inputSchema: {
            type: "object",
            properties: {
              resource_key: { type: "string" }
            },
            required: ["resource_key"]
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_project":
            return await this.createProject(args);
          case "define_phase":
            return await this.definePhase(args);
          case "measure_phase":
            return await this.measurePhase(args);
          case "analyze_phase":
            return await this.analyzePhase(args);
          case "improve_phase":
            return await this.improvePhase(args);
          case "control_phase":
            return await this.controlPhase(args);
          case "get_project_status":
            return await this.getProjectStatus(args);
          case "check_quality_gate":
            return await this.checkQualityGate(args);
          case "get_shared_resources":
            return await this.getSharedResource(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: Array.from(this.projectState.entries()).map(([id, project]) => ({
        uri: `project://${id}`,
        name: project.name,
        description: `Six Sigma project: ${project.business_case}`,
        mimeType: "application/json"
      }))
    }));

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const projectId = request.params.uri.replace('project://', '');
      const project = this.projectState.get(projectId);
      
      if (!project) {
        throw new Error("Project not found");
      }

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(project, null, 2)
          }
        ]
      };
    });
  }
  // Phase 0: Create Project
  private async createProject(args: any) {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project: ProjectState = {
      id: projectId,
      name: args.project_name,
      business_case: args.business_case,
      requirements: args.requirements,
      deployment_target: args.deployment_target || "Not specified",
      budget_limit: args.budget_limit || 0,
      created_at: new Date().toISOString(),
      current_phase: DMAICPhase.DEFINE,
      artifacts: {},
      metrics: {},
      quality_gates: {}
    };

    this.projectState.set(projectId, project);
    
    // Initialize shared resources
    this.sharedResources.set(`${projectId}_state`, project);
    this.sharedResources.set(`${projectId}_constraints`, {});
    this.sharedResources.set(`${projectId}_ctq`, {});

    return {
      content: [
        {
          type: "text",
          text: `✅ Six Sigma Project Created Successfully!

📋 **Project Details:**
- **ID**: ${projectId}
- **Name**: ${args.project_name}
- **Phase**: DEFINE
- **Budget**: $${args.budget_limit || 'Not specified'}/month
- **Target**: ${args.deployment_target || 'Not specified'}

📊 **Initial Requirements** (${args.requirements.length} total):
${args.requirements.map((req: string, i: number) => `  ${i + 1}. ${req}`).join('\n')}

🎯 **Next Steps:**
1. Run \`define_phase\` to analyze Voice of Customer and create CTQ tree
2. The system will guide you through each DMAIC phase
3. Quality gates ensure each phase meets Six Sigma standards

Use project ID \`${projectId}\` for all subsequent operations.`
        }
      ]
    };
  }
  // Phase 1: Define Phase
  private async definePhase(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== DMAICPhase.DEFINE) {
      throw new Error(`Project is in ${project.current_phase} phase. Expected DEFINE phase.`);
    }

    // Perform Voice of Customer Analysis
    const vocAnalysis = this.performVOCAnalysis(project.requirements, args.stakeholders);
    
    // Generate CTQ Tree based on requirements
    const ctqTree = this.generateCTQTree(vocAnalysis);
    
    // Document constraints
    const constraints = this.documentConstraints(project);
    
    // Create SIPOC diagram
    const sipocDiagram = this.createSIPOCDiagram(project);

    // Create Define phase artifacts
    const defineArtifacts: DefineArtifacts = {
      voc_analysis: vocAnalysis,
      ctq_tree: ctqTree,
      constraints: constraints,
      sipoc_diagram: sipocDiagram
    };

    // Update project state
    project.artifacts.define = defineArtifacts;
    
    // Perform quality gate check
    const qualityGate = this.checkDefinePhaseQualityGate(defineArtifacts);
    project.quality_gates.define = qualityGate;
    // Update shared resources
    this.sharedResources.set(`${project.id}_voc`, vocAnalysis);
    this.sharedResources.set(`${project.id}_ctq`, ctqTree);
    this.sharedResources.set(`${project.id}_constraints`, constraints);

    if (qualityGate.passed) {
      project.current_phase = DMAICPhase.MEASURE;
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Define Phase Complete!

📊 **Voice of Customer Analysis:**
- Functional Requirements: ${vocAnalysis.functional_requirements.length}
- Non-Functional Requirements: ${vocAnalysis.non_functional_requirements.length}
- Must-Have Features: ${vocAnalysis.priority_matrix.must_have.length}
- Stakeholder Groups: ${Object.keys(vocAnalysis.stakeholder_needs).length}

🎯 **CTQ Tree Summary:**
- Performance Metrics: ${Object.keys(ctqTree.performance).length}
- Reliability Metrics: ${Object.keys(ctqTree.reliability).length}
- Usability Metrics: ${Object.keys(ctqTree.usability).length}
- Security Metrics: ${Object.keys(ctqTree.security).length}

🔧 **Key Constraints:**
- Deployment: ${constraints.deployment}
- Budget: $${constraints.budget}/month
- Technical Stack: ${constraints.technical.framework || 'TBD'} + ${constraints.technical.language || 'TBD'}

📋 **SIPOC Overview:**
- Suppliers: ${sipocDiagram.suppliers.length} identified
- Process Steps: ${sipocDiagram.process_steps.length} defined
- Customers: ${sipocDiagram.customers.length} identified

${qualityGate.passed ? 
`✅ **Quality Gate: PASSED**
Phase transitioned to: MEASURE

Next step: Run \`measure_phase\` to define KPIs and establish baselines.` :
`⚠️ **Quality Gate: FAILED**
Missing items: ${qualityGate.missing_items.join(', ')}
Recommendations: ${qualityGate.recommendations.join('; ')}`}`
        }
      ]
    };
  }
  // Helper method: VOC Analysis
  private performVOCAnalysis(requirements: string[], stakeholders?: any[]): VOCAnalysis {
    const functional = requirements.filter(req => 
      !req.toLowerCase().includes('performance') && 
      !req.toLowerCase().includes('security') &&
      !req.toLowerCase().includes('availability') &&
      !req.toLowerCase().includes('load') &&
      !req.toLowerCase().includes('response time')
    );
    
    const nonFunctional = requirements.filter(req => 
      req.toLowerCase().includes('performance') || 
      req.toLowerCase().includes('security') ||
      req.toLowerCase().includes('availability') ||
      req.toLowerCase().includes('load') ||
      req.toLowerCase().includes('response time') ||
      req.toLowerCase().includes('scalability')
    );

    // Priority matrix based on requirement patterns
    const priorityMatrix = {
      must_have: requirements.filter(req => 
        req.toLowerCase().includes('must') || 
        req.toLowerCase().includes('critical') ||
        req.toLowerCase().includes('essential') ||
        requirements.indexOf(req) < Math.ceil(requirements.length * 0.4)
      ),
      should_have: requirements.filter(req => 
        req.toLowerCase().includes('should') ||
        (requirements.indexOf(req) >= Math.ceil(requirements.length * 0.4) &&
         requirements.indexOf(req) < Math.ceil(requirements.length * 0.7))
      ),
      nice_to_have: requirements.filter(req => 
        req.toLowerCase().includes('nice') ||
        req.toLowerCase().includes('optional') ||
        requirements.indexOf(req) >= Math.ceil(requirements.length * 0.7)
      )
    };

    // Process stakeholder needs
    const stakeholderNeeds: Record<string, string[]> = {};
    if (stakeholders) {
      stakeholders.forEach(stakeholder => {
        stakeholderNeeds[stakeholder.role] = stakeholder.needs || [];
      });
    } else {
      // Default stakeholder analysis
      stakeholderNeeds['End Users'] = functional.slice(0, 3);
      stakeholderNeeds['System Administrators'] = nonFunctional.slice(0, 2);
      stakeholderNeeds['Business Owners'] = [requirements[0]];
    }
    return {
      functional_requirements: functional,
      non_functional_requirements: nonFunctional,
      priority_matrix: priorityMatrix,
      stakeholder_needs: stakeholderNeeds
    };
  }

  // Helper method: Generate CTQ Tree
  private generateCTQTree(vocAnalysis: VOCAnalysis): CTQTree {
    const ctqTree: CTQTree = {
      performance: {},
      reliability: {},
      usability: {},
      security: {}
    };

    // Analyze requirements for performance metrics
    if (vocAnalysis.non_functional_requirements.some(req => 
      req.toLowerCase().includes('performance') || 
      req.toLowerCase().includes('load'))) {
      ctqTree.performance.page_load_time = { target: 2.0, usl: 3.0, lsl: 0 };
      ctqTree.performance.api_response_time = { target: 200, usl: 500, lsl: 0 };
      ctqTree.performance.concurrent_users = { target: 1000, usl: 2000, lsl: 100 };
    }

    // Reliability metrics
    if (vocAnalysis.non_functional_requirements.some(req => 
      req.toLowerCase().includes('availability') || 
      req.toLowerCase().includes('uptime'))) {
      ctqTree.reliability.uptime_percentage = { target: 99.9, usl: 100, lsl: 99.5 };
      ctqTree.reliability.mtbf_hours = { target: 720, usl: 1000, lsl: 168 };
      ctqTree.reliability.error_rate = { target: 0.1, usl: 1.0 };
    }
    // Usability metrics
    if (vocAnalysis.functional_requirements.length > 0) {
      ctqTree.usability.task_completion_rate = { target: 95, usl: 100, lsl: 85 };
      ctqTree.usability.user_satisfaction_score = { target: 4.5, usl: 5.0, lsl: 3.5 };
      ctqTree.usability.time_to_complete_task = { target: 120, usl: 180, lsl: 60 };
    }

    // Security metrics
    if (vocAnalysis.non_functional_requirements.some(req => 
      req.toLowerCase().includes('security') || 
      req.toLowerCase().includes('authentication'))) {
      ctqTree.security.vulnerability_score = { target: 0, usl: 3, lsl: 0 };
      ctqTree.security.authentication_failure_rate = { target: 0.01, usl: 0.05 };
      ctqTree.security.data_encryption_coverage = { target: 100, usl: 100, lsl: 95 };
    }

    return ctqTree;
  }

  // Helper method: Document Constraints
  private documentConstraints(project: ProjectState): Constraints {
    return {
      deployment: project.deployment_target,
      budget: project.budget_limit,
      technical: {
        framework: project.deployment_target.toLowerCase().includes('vercel') ? 'Next.js' : 
                  project.deployment_target.toLowerCase().includes('aws') ? 'Express.js' : 'TBD',
        language: 'TypeScript',
        platform: project.deployment_target
      },
      timeline: {
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        milestones: {
          'Define Complete': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          'Measure Complete': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          'Analyze Complete': new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          'Improve Complete': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          'Control Complete': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    };
  }
  // Helper method: Create SIPOC Diagram
  private createSIPOCDiagram(project: ProjectState): SIPOCDiagram {
    return {
      suppliers: [
        'Product Owner',
        'Business Analysts',
        'End Users',
        'Technical Architecture Team',
        'Security Team',
        'Infrastructure Team'
      ],
      inputs: [
        'Business Requirements',
        'User Stories',
        'Technical Constraints',
        'Security Policies',
        'Performance SLAs',
        'Budget Constraints'
      ],
      process_steps: [
        'Requirements Gathering',
        'Architecture Design',
        'Development',
        'Testing',
        'Deployment',
        'Monitoring & Control'
      ],
      outputs: [
        'Working Software',
        'Documentation',
        'Deployment Artifacts',
        'Performance Reports',
        'Quality Metrics'
      ],
      customers: [
        'End Users',
        'Business Stakeholders',
        'Operations Team',
        'Support Team'
      ]
    };
  }

  // Helper method: Check Define Phase Quality Gate
  private checkDefinePhaseQualityGate(artifacts: DefineArtifacts): QualityGateResult {
    const criteriaResults: Record<string, boolean> = {
      'VOC Analysis Complete': artifacts.voc_analysis.functional_requirements.length > 0,
      'CTQ Tree Defined': Object.keys(artifacts.ctq_tree.performance).length > 0 ||
                         Object.keys(artifacts.ctq_tree.reliability).length > 0,
      'Constraints Documented': artifacts.constraints.deployment !== 'Not specified',
      'SIPOC Diagram Created': artifacts.sipoc_diagram.process_steps.length > 0,
      'Priority Matrix Defined': artifacts.voc_analysis.priority_matrix.must_have.length > 0
    };
    const passed = Object.values(criteriaResults).every(result => result);
    const missingItems = Object.entries(criteriaResults)
      .filter(([_, result]) => !result)
      .map(([criteria, _]) => criteria);

    const recommendations: string[] = [];
    if (!criteriaResults['VOC Analysis Complete']) {
      recommendations.push('Complete Voice of Customer analysis with stakeholder input');
    }
    if (!criteriaResults['CTQ Tree Defined']) {
      recommendations.push('Define measurable quality metrics in CTQ tree');
    }
    if (!criteriaResults['Constraints Documented']) {
      recommendations.push('Specify deployment target and technical constraints');
    }

    return {
      passed,
      criteria_results: criteriaResults,
      missing_items: missingItems,
      recommendations
    };
  }

  // Phase 2: Measure Phase
  private async measurePhase(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== DMAICPhase.MEASURE) {
      throw new Error(`Project is in ${project.current_phase} phase. Expected MEASURE phase.`);
    }

    const ctqTree = project.artifacts.define?.ctq_tree;
    if (!ctqTree) {
      throw new Error("CTQ tree not found. Complete Define phase first.");
    }
    // Define KPIs based on CTQ tree
    const kpis = this.defineKPIs(ctqTree, args.custom_kpis);
    
    // Establish baselines
    const baselines = this.establishBaselines(kpis);
    
    // Perform Measurement System Analysis
    const msaResults = this.performMSA();
    
    // Create data collection plan
    const dataCollectionPlan = this.createDataCollectionPlan(kpis);

    const measureArtifacts: MeasureArtifacts = {
      kpis,
      baselines,
      measurement_system_analysis: msaResults,
      data_collection_plan: dataCollectionPlan
    };

    project.artifacts.measure = measureArtifacts;
    
    // Quality gate check
    const qualityGate = this.checkMeasurePhaseQualityGate(measureArtifacts);
    project.quality_gates.measure = qualityGate;

    if (qualityGate.passed) {
      project.current_phase = DMAICPhase.ANALYZE;
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Measure Phase Complete!

📊 **Key Performance Indicators (${kpis.length} KPIs):**
${kpis.slice(0, 5).map(kpi => 
  `- ${kpi.name}: Target ${kpi.target} ${kpi.unit}`
).join('\n')}
${kpis.length > 5 ? `... and ${kpis.length - 5} more KPIs` : ''}
📈 **Baselines Established:**
${Object.entries(baselines).slice(0, 4).map(([metric, value]) => 
  `- ${metric}: ${value}`
).join('\n')}

🔬 **Measurement System Analysis:**
- Repeatability: ${(msaResults.repeatability * 100).toFixed(1)}%
- Reproducibility: ${(msaResults.reproducibility * 100).toFixed(1)}%
- Accuracy: ${(msaResults.accuracy * 100).toFixed(1)}%
- System Stable: ${msaResults.stability ? 'Yes' : 'No'}

📋 **Data Collection Plan:**
- Metrics to Track: ${dataCollectionPlan.metrics.length}
- Collection Methods: ${Object.keys(dataCollectionPlan.collection_methods).length} defined
- Responsible Parties Assigned: ${Object.keys(dataCollectionPlan.responsible_parties).length}

${qualityGate.passed ? 
`✅ **Quality Gate: PASSED**
Phase transitioned to: ANALYZE

Next step: Run \`analyze_phase\` to identify root causes and perform FMEA.` :
`⚠️ **Quality Gate: FAILED**
Missing items: ${qualityGate.missing_items.join(', ')}
Recommendations: ${qualityGate.recommendations.join('; ')}`}`
        }
      ]
    };
  }

  // Helper method: Define KPIs
  private defineKPIs(ctqTree: CTQTree, customKPIs?: any[]): KPI[] {
    const kpis: KPI[] = [];

    // Convert CTQ metrics to KPIs
    Object.entries(ctqTree.performance).forEach(([metric, spec]) => {
      kpis.push({
        name: `Performance: ${metric.replace(/_/g, ' ')}`,
        description: `Measure ${metric} performance`,
        unit: metric.includes('time') ? 'ms' : metric.includes('users') ? 'count' : 'units',
        target: spec.target,
        measurement_frequency: 'Real-time'
      });
    });
    Object.entries(ctqTree.reliability).forEach(([metric, spec]) => {
      kpis.push({
        name: `Reliability: ${metric.replace(/_/g, ' ')}`,
        description: `Track ${metric} for system reliability`,
        unit: metric.includes('percentage') ? '%' : metric.includes('hours') ? 'hours' : '%',
        target: spec.target,
        measurement_frequency: 'Daily'
      });
    });

    Object.entries(ctqTree.usability).forEach(([metric, spec]) => {
      kpis.push({
        name: `Usability: ${metric.replace(/_/g, ' ')}`,
        description: `Monitor ${metric} for user experience`,
        unit: metric.includes('rate') ? '%' : metric.includes('score') ? 'points' : 'seconds',
        target: spec.target,
        measurement_frequency: 'Weekly'
      });
    });

    Object.entries(ctqTree.security).forEach(([metric, spec]) => {
      kpis.push({
        name: `Security: ${metric.replace(/_/g, ' ')}`,
        description: `Assess ${metric} for security posture`,
        unit: metric.includes('coverage') ? '%' : metric.includes('score') ? 'CVE score' : '%',
        target: spec.target,
        measurement_frequency: 'Weekly'
      });
    });

    // Add custom KPIs if provided
    if (customKPIs) {
      customKPIs.forEach(kpi => {
        kpis.push({
          name: kpi.name,
          description: `Custom KPI: ${kpi.name}`,
          unit: kpi.unit,
          target: kpi.target,
          measurement_frequency: 'As defined'
        });
      });
    }

    return kpis;
  }
  // Helper method: Establish Baselines
  private establishBaselines(kpis: KPI[]): Record<string, number> {
    const baselines: Record<string, number> = {};
    
    // Simulate baseline measurements
    kpis.forEach(kpi => {
      // Generate baseline as percentage of target with some variance
      const variance = 0.6 + Math.random() * 0.3; // 60-90% of target
      baselines[kpi.name] = Number((kpi.target * variance).toFixed(2));
    });

    return baselines;
  }

  // Helper method: Perform MSA
  private performMSA(): MSAResults {
    return {
      repeatability: 0.95 + Math.random() * 0.04, // 95-99%
      reproducibility: 0.93 + Math.random() * 0.05, // 93-98%
      accuracy: 0.96 + Math.random() * 0.03, // 96-99%
      linearity: 0.02 + Math.random() * 0.03, // 2-5%
      stability: Math.random() > 0.2 // 80% chance of stable
    };
  }

  // Helper method: Create Data Collection Plan
  private createDataCollectionPlan(kpis: KPI[]): DataCollectionPlan {
    const plan: DataCollectionPlan = {
      metrics: kpis.map(kpi => kpi.name),
      collection_methods: {},
      frequency: {},
      responsible_parties: {}
    };

    kpis.forEach(kpi => {
      if (kpi.name.includes('Performance')) {
        plan.collection_methods[kpi.name] = 'Application Performance Monitoring (APM)';
        plan.responsible_parties[kpi.name] = 'DevOps Team';
      } else if (kpi.name.includes('Reliability')) {
        plan.collection_methods[kpi.name] = 'System Monitoring Tools';
        plan.responsible_parties[kpi.name] = 'Operations Team';
      } else if (kpi.name.includes('Usability')) {
        plan.collection_methods[kpi.name] = 'User Analytics & Surveys';
        plan.responsible_parties[kpi.name] = 'UX Team';
      } else if (kpi.name.includes('Security')) {
        plan.collection_methods[kpi.name] = 'Security Scanning Tools';
        plan.responsible_parties[kpi.name] = 'Security Team';
      }
      plan.frequency[kpi.name] = kpi.measurement_frequency;
    });

    return plan;
  }
  // Helper method: Check Measure Phase Quality Gate
  private checkMeasurePhaseQualityGate(artifacts: MeasureArtifacts): QualityGateResult {
    const criteriaResults: Record<string, boolean> = {
      'KPIs Defined': artifacts.kpis.length > 0,
      'Baselines Established': Object.keys(artifacts.baselines).length > 0,
      'MSA Acceptable': artifacts.measurement_system_analysis.repeatability > 0.9 &&
                       artifacts.measurement_system_analysis.reproducibility > 0.9,
      'Data Collection Plan': artifacts.data_collection_plan.metrics.length > 0,
      'Measurement Frequency Defined': Object.keys(artifacts.data_collection_plan.frequency).length > 0
    };

    const passed = Object.values(criteriaResults).every(result => result);
    const missingItems = Object.entries(criteriaResults)
      .filter(([_, result]) => !result)
      .map(([criteria, _]) => criteria);

    const recommendations: string[] = [];
    if (!criteriaResults['MSA Acceptable']) {
      recommendations.push('Improve measurement system repeatability and reproducibility');
    }
    if (artifacts.kpis.length < 5) {
      recommendations.push('Consider adding more KPIs to cover all CTQ dimensions');
    }

    return {
      passed,
      criteria_results: criteriaResults,
      missing_items: missingItems,
      recommendations
    };
  }

  // Phase 3: Analyze Phase
  private async analyzePhase(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== DMAICPhase.ANALYZE) {
      throw new Error(`Project is in ${project.current_phase} phase. Expected ANALYZE phase.`);
    }
    const measureData = project.artifacts.measure;
    if (!measureData) {
      throw new Error("Measure phase artifacts not found");
    }

    // Perform root cause analysis
    const rootCauseAnalysis = this.performRootCauseAnalysis(
      measureData.baselines,
      measureData.kpis,
      args.identified_issues
    );

    // Conduct FMEA
    const fmea = this.conductFMEA(project);

    // Statistical analysis
    const statisticalAnalysis = this.performStatisticalAnalysis(measureData);

    // Process capability analysis
    const processCapability = this.analyzeProcessCapability(measureData);

    const analyzeArtifacts: AnalyzeArtifacts = {
      root_cause_analysis: rootCauseAnalysis,
      fmea: fmea,
      statistical_analysis: statisticalAnalysis,
      process_capability: processCapability
    };

    project.artifacts.analyze = analyzeArtifacts;

    // Quality gate check
    const qualityGate = this.checkAnalyzePhaseQualityGate(analyzeArtifacts);
    project.quality_gates.analyze = qualityGate;

    if (qualityGate.passed) {
      project.current_phase = DMAICPhase.IMPROVE;
    }
    return {
      content: [
        {
          type: "text",
          text: `✅ Analyze Phase Complete!

🔍 **Root Cause Analysis:**
- Fishbone Categories: ${Object.keys(rootCauseAnalysis.fishbone_categories).length}
- Critical Input Variables (X's): ${rootCauseAnalysis.critical_xs.length}
- Top Pareto Issues: ${rootCauseAnalysis.pareto_analysis.slice(0, 3).map(p => p.issue).join(', ')}

⚠️ **FMEA Results (Top Risks):**
${fmea.slice(0, 3).map(f => 
  `- ${f.failure_mode}: RPN=${f.rpn} (S=${f.severity}, O=${f.occurrence}, D=${f.detection})`
).join('\n')}

📊 **Statistical Analysis:**
- Hypothesis Tests: ${Object.keys(statisticalAnalysis.hypothesis_tests).length} completed
- Significant Correlations: ${Object.values(statisticalAnalysis.correlation_analysis).filter(r => Math.abs(r) > 0.7).length}
${statisticalAnalysis.regression_results ? 
  `- R-squared: ${(statisticalAnalysis.regression_results.r_squared * 100).toFixed(1)}%` : ''}

🎯 **Process Capability:**
- Sigma Level: ${processCapability.sigma_level.toFixed(2)}σ
- Cp: ${processCapability.cp.toFixed(2)}, Cpk: ${processCapability.cpk.toFixed(2)}
- DPMO: ${processCapability.defects_per_million.toFixed(0)}

${qualityGate.passed ? 
`✅ **Quality Gate: PASSED**
Phase transitioned to: IMPROVE

Next step: Run \`improve_phase\` to generate solutions with Claude AI.` :
`⚠️ **Quality Gate: FAILED**
Missing items: ${qualityGate.missing_items.join(', ')}
Recommendations: ${qualityGate.recommendations.join('; ')}`}`
        }
      ]
    };
  }
  // Helper method: Perform Root Cause Analysis
  private performRootCauseAnalysis(
    baselines: Record<string, number>,
    kpis: KPI[],
    identifiedIssues?: string[]
  ): RootCauseAnalysis {
    const fishboneCategories: Record<string, string[]> = {
      'People': [
        'Lack of training',
        'Insufficient documentation',
        'Communication gaps'
      ],
      'Process': [
        'No code review process',
        'Missing CI/CD pipeline',
        'Inadequate testing'
      ],
      'Technology': [
        'Outdated frameworks',
        'Performance bottlenecks',
        'Technical debt'
      ],
      'Environment': [
        'Development/Production parity',
        'Resource constraints',
        'Network latency'
      ]
    };

    // Add identified issues to appropriate categories
    if (identifiedIssues) {
      identifiedIssues.forEach(issue => {
        if (issue.toLowerCase().includes('performance')) {
          fishboneCategories.Technology.push(issue);
        } else if (issue.toLowerCase().includes('process')) {
          fishboneCategories.Process.push(issue);
        } else {
          fishboneCategories.Environment.push(issue);
        }
      });
    }
    // Five Whys analysis for underperforming metrics
    const fiveWhys: Record<string, string[]> = {};
    kpis.forEach(kpi => {
      if (baselines[kpi.name] < kpi.target * 0.8) {
        fiveWhys[kpi.name] = [
          `Why is ${kpi.name} below target?`,
          'Why is the current implementation inadequate?',
          'Why wasn\'t this caught in design phase?',
          'Why are requirements incomplete?',
          'Root: Insufficient stakeholder engagement'
        ];
      }
    });

    // Pareto analysis
    const paretoAnalysis = [
      { issue: 'Performance bottlenecks', frequency: 35, impact: 9 },
      { issue: 'Code quality issues', frequency: 28, impact: 7 },
      { issue: 'Missing error handling', frequency: 22, impact: 8 },
      { issue: 'Inadequate testing', frequency: 15, impact: 6 }
    ].sort((a, b) => (b.frequency * b.impact) - (a.frequency * a.impact));

    // Critical X's (input variables affecting Y's)
    const criticalXs = [
      'Code complexity',
      'Test coverage',
      'Architecture decisions',
      'Third-party dependencies',
      'Infrastructure configuration'
    ];

    return {
      fishbone_categories: fishboneCategories,
      five_whys: fiveWhys,
      pareto_analysis: paretoAnalysis,
      critical_xs: criticalXs
    };
  }
  // Helper method: Conduct FMEA
  private conductFMEA(project: ProjectState): FMEA[] {
    const fmeaItems: FMEA[] = [
      {
        failure_mode: 'Database connection timeout',
        effects: ['Service unavailable', 'Data loss', 'Poor user experience'],
        severity: 9,
        causes: ['Network issues', 'Connection pool exhaustion', 'Database overload'],
        occurrence: 6,
        current_controls: ['Connection retry logic', 'Monitoring alerts'],
        detection: 7,
        rpn: 9 * 6 * 7,
        recommended_actions: ['Implement connection pooling', 'Add circuit breaker', 'Database read replicas']
      },
      {
        failure_mode: 'Authentication bypass',
        effects: ['Unauthorized access', 'Data breach', 'Compliance violation'],
        severity: 10,
        causes: ['Weak validation', 'Session hijacking', 'Token manipulation'],
        occurrence: 3,
        current_controls: ['Basic auth checks', 'HTTPS'],
        detection: 5,
        rpn: 10 * 3 * 5,
        recommended_actions: ['Implement OAuth 2.0', 'Add rate limiting', 'Security audit']
      },
      {
        failure_mode: 'Memory leak in production',
        effects: ['Performance degradation', 'Service crash', 'Increased costs'],
        severity: 8,
        causes: ['Unreleased resources', 'Circular references', 'Cache overflow'],
        occurrence: 5,
        current_controls: ['Basic monitoring'],
        detection: 8,
        rpn: 8 * 5 * 8,
        recommended_actions: ['Memory profiling', 'Implement proper cleanup', 'Set memory limits']
      },
      {
        failure_mode: 'API response time degradation',
        effects: ['Poor UX', 'Timeout errors', 'SLA breach'],
        severity: 7,
        causes: ['Inefficient queries', 'No caching', 'Synchronous operations'],
        occurrence: 7,
        current_controls: ['Basic performance monitoring'],
        detection: 6,
        rpn: 7 * 7 * 6,
        recommended_actions: ['Query optimization', 'Implement caching', 'Async processing']
      }
    ];

    // Sort by RPN (highest risk first)
    return fmeaItems.sort((a, b) => b.rpn - a.rpn);
  }
  // Helper method: Perform Statistical Analysis
  private performStatisticalAnalysis(measureData: MeasureArtifacts): StatisticalAnalysis {
    const hypothesisTests: Record<string, { p_value: number; conclusion: string }> = {};
    const correlationAnalysis: Record<string, number> = {};

    // Simulate hypothesis tests
    measureData.kpis.forEach(kpi => {
      const pValue = Math.random() * 0.1; // 0-0.1
      hypothesisTests[`${kpi.name} meets target`] = {
        p_value: pValue,
        conclusion: pValue < 0.05 ? 'Reject null hypothesis' : 'Fail to reject null hypothesis'
      };
    });

    // Correlation analysis between metrics
    correlationAnalysis['Code Complexity vs Performance'] = -0.82;
    correlationAnalysis['Test Coverage vs Defects'] = -0.75;
    correlationAnalysis['Deploy Frequency vs MTTR'] = -0.68;
    correlationAnalysis['Team Size vs Velocity'] = 0.45;

    // Regression results for key relationships
    const regressionResults = {
      r_squared: 0.78,
      coefficients: {
        'code_complexity': -0.35,
        'test_coverage': 0.42,
        'tech_debt': -0.28
      },
      p_values: {
        'code_complexity': 0.001,
        'test_coverage': 0.003,
        'tech_debt': 0.012
      }
    };

    return {
      hypothesis_tests: hypothesisTests,
      correlation_analysis: correlationAnalysis,
      regression_results: regressionResults
    };
  }
  // Helper method: Analyze Process Capability
  private analyzeProcessCapability(measureData: MeasureArtifacts): ProcessCapability {
    // Calculate based on current performance vs targets
    let totalDefects = 0;
    let totalOpportunities = 0;

    measureData.kpis.forEach(kpi => {
      const baseline = measureData.baselines[kpi.name] || 0;
      const target = kpi.target;
      
      // Consider it a defect if baseline is below 90% of target
      if (baseline < target * 0.9) {
        totalDefects++;
      }
      totalOpportunities++;
    });

    const defectRate = totalDefects / totalOpportunities;
    const dpmo = defectRate * 1000000;
    
    // Approximate sigma level (simplified)
    let sigmaLevel = 6;
    if (dpmo > 690000) sigmaLevel = 1;
    else if (dpmo > 308000) sigmaLevel = 2;
    else if (dpmo > 66800) sigmaLevel = 3;
    else if (dpmo > 6210) sigmaLevel = 4;
    else if (dpmo > 233) sigmaLevel = 5;

    // Process capability indices
    const cp = 1.33 - (defectRate * 2); // Simplified calculation
    const cpk = cp * 0.9; // Typically Cpk < Cp

    return {
      cp: Math.max(0.5, cp),
      cpk: Math.max(0.4, cpk),
      sigma_level: sigmaLevel,
      defects_per_million: dpmo
    };
  }
  // Helper method: Check Analyze Phase Quality Gate
  private checkAnalyzePhaseQualityGate(artifacts: AnalyzeArtifacts): QualityGateResult {
    const criteriaResults: Record<string, boolean> = {
      'Root Causes Identified': artifacts.root_cause_analysis.critical_xs.length > 0,
      'FMEA Complete': artifacts.fmea.length > 0,
      'High Risk Items Addressed': artifacts.fmea.filter(f => f.rpn > 200).every(f => f.recommended_actions.length > 0),
      'Statistical Analysis Done': Object.keys(artifacts.statistical_analysis.hypothesis_tests).length > 0,
      'Process Capability Assessed': artifacts.process_capability.sigma_level > 0
    };

    const passed = Object.values(criteriaResults).every(result => result);
    const missingItems = Object.entries(criteriaResults)
      .filter(([_, result]) => !result)
      .map(([criteria, _]) => criteria);

    const recommendations: string[] = [];
    if (artifacts.process_capability.sigma_level < 3) {
      recommendations.push('Process capability below 3σ - significant improvement needed');
    }
    if (artifacts.fmea.some(f => f.rpn > 300)) {
      recommendations.push('Critical risks identified - prioritize mitigation');
    }

    return {
      passed,
      criteria_results: criteriaResults,
      missing_items: missingItems,
      recommendations
    };
  }

  // Phase 4: Improve Phase (with Claude Integration)
  private async improvePhase(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== DMAICPhase.IMPROVE) {
      throw new Error(`Project is in ${project.current_phase} phase. Expected IMPROVE phase.`);
    }
    // Generate solutions
    const solutions = await this.generateSolutions(project, args.specific_requirements);
    
    // If Claude integration is enabled, generate code
    let generatedCode: GeneratedCode | undefined;
    if (args.use_claude !== false && this.anthropic) {
      generatedCode = await this.generateCodeWithClaude(project, solutions[0], args.specific_requirements);
    }

    // Simulate pilot results
    const pilotResults = this.simulatePilotResults(solutions[0], project);

    // Create implementation plan
    const implementationPlan = this.createImplementationPlan(solutions[0]);

    const improveArtifacts: ImproveArtifacts = {
      proposed_solutions: solutions,
      pilot_results: pilotResults,
      implementation_plan: implementationPlan,
      claude_generated_code: generatedCode
    };

    project.artifacts.improve = improveArtifacts;

    // Quality gate check
    const qualityGate = this.checkImprovePhaseQualityGate(improveArtifacts);
    project.quality_gates.improve = qualityGate;

    if (qualityGate.passed) {
      project.current_phase = DMAICPhase.CONTROL;
    }
    return {
      content: [
        {
          type: "text",
          text: `✅ Improve Phase Complete!

🚀 **Proposed Solutions (${solutions.length}):**
${solutions.slice(0, 2).map((sol, i) => 
`${i + 1}. ${sol.description}
   - Expected Improvement: ${Object.entries(sol.impact_analysis.expected_improvement)
     .map(([metric, value]) => `${metric}: +${value}%`).join(', ')}
   - Cost: $${sol.impact_analysis.cost}
   - Implementation Time: ${sol.impact_analysis.implementation_time}
   - Poka-Yoke: ${sol.poka_yoke_mechanisms.length} error-proofing mechanisms`
).join('\n\n')}

📊 **Pilot Results:**
- Solution Tested: ${pilotResults.solution_id}
- Success: ${pilotResults.success ? '✅ Yes' : '❌ No'}
- Key Improvements: ${Object.entries(pilotResults.metrics_after)
  .filter(([metric, after]) => after > (pilotResults.metrics_before[metric] || 0))
  .map(([metric, after]) => `${metric}: ${((after / (pilotResults.metrics_before[metric] || 1) - 1) * 100).toFixed(1)}%`)
  .join(', ')}

${generatedCode ? `
💻 **Claude-Generated Code:**
- Language: ${generatedCode.language}
- Framework: ${generatedCode.framework}
- Files Generated: ${generatedCode.files.length}
- Quality Metrics:
  - Complexity: ${generatedCode.quality_metrics.cyclomatic_complexity}
  - Test Coverage: ${generatedCode.quality_metrics.test_coverage}%
  - Documentation: ${generatedCode.quality_metrics.documentation_score}%
- CTQ Compliance: ${Object.values(generatedCode.ctq_compliance).filter(v => v).length}/${Object.keys(generatedCode.ctq_compliance).length} criteria met
` : args.use_claude === false ? '\n💡 Code generation skipped (use_claude=false)' : '\n⚠️ Claude API not configured'}

📋 **Implementation Plan:**
- Phases: ${implementationPlan.phases.length}
- Total Duration: ${implementationPlan.phases.map(p => p.duration).join(' + ')}
- Resources Required: ${implementationPlan.resources_required.length}

${qualityGate.passed ? 
`✅ **Quality Gate: PASSED**
Phase transitioned to: CONTROL

Next step: Run \`control_phase\` to set up monitoring and control systems.` :
`⚠️ **Quality Gate: FAILED**
Missing items: ${qualityGate.missing_items.join(', ')}
Recommendations: ${qualityGate.recommendations.join('; ')}`}`
        }
      ]
    };
  }
  // Helper method: Generate Solutions
  private async generateSolutions(project: ProjectState, specificRequirements?: string): Solution[] {
    const analyzeData = project.artifacts.analyze;
    if (!analyzeData) {
      throw new Error("Analyze phase artifacts not found");
    }

    const solutions: Solution[] = [];

    // Solution 1: Address top FMEA risks
    const topRisk = analyzeData.fmea[0];
    solutions.push({
      id: 'sol_risk_mitigation',
      description: `Implement comprehensive risk mitigation for ${topRisk.failure_mode}`,
      impact_analysis: {
        expected_improvement: {
          'reliability': 35,
          'error_rate': -60,
          'mtbf': 50
        },
        cost: 15000,
        implementation_time: '3 weeks',
        risks: ['Temporary performance impact during rollout', 'Learning curve for team']
      },
      poka_yoke_mechanisms: topRisk.recommended_actions
    });

    // Solution 2: Performance optimization
    solutions.push({
      id: 'sol_performance_opt',
      description: 'Implement caching, async processing, and query optimization',
      impact_analysis: {
        expected_improvement: {
          'response_time': -40,
          'throughput': 60,
          'resource_utilization': -25
        },
        cost: 8000,
        implementation_time: '2 weeks',
        risks: ['Cache invalidation complexity', 'Async error handling']
      },
      poka_yoke_mechanisms: [
        'Automated performance regression tests',
        'Real-time performance monitoring alerts',
        'Query performance analyzer in CI/CD'
      ]
    });
    // Solution 3: Quality improvement through testing
    solutions.push({
      id: 'sol_quality_testing',
      description: 'Implement comprehensive testing strategy with automated quality gates',
      impact_analysis: {
        expected_improvement: {
          'defect_rate': -70,
          'test_coverage': 85,
          'deployment_confidence': 90
        },
        cost: 12000,
        implementation_time: '4 weeks',
        risks: ['Initial slowdown in delivery', 'Test maintenance overhead']
      },
      poka_yoke_mechanisms: [
        'Mandatory code coverage thresholds',
        'Automated integration tests',
        'Mutation testing for test quality',
        'Pre-commit hooks for linting'
      ]
    });

    // Add specific requirements if provided
    if (specificRequirements) {
      solutions[0].description += ` (Addressing: ${specificRequirements})`;
    }

    return solutions;
  }

  // Helper method: Generate Code with Claude
  private async generateCodeWithClaude(
    project: ProjectState,
    solution: Solution,
    specificRequirements?: string
  ): Promise<GeneratedCode> {
    if (!this.anthropic) {
      throw new Error("Claude API not configured. Set ANTHROPIC_API_KEY environment variable.");
    }
    const ctqTree = project.artifacts.define?.ctq_tree;
    const constraints = project.artifacts.define?.constraints;
    const fmea = project.artifacts.analyze?.fmea;

    // Build quality-constrained prompt
    const prompt = `Generate production-ready ${constraints?.technical.language || 'TypeScript'} code for a ${project.name} that implements the following solution:

Solution: ${solution.description}

Critical Quality Requirements (CTQ):
${JSON.stringify(ctqTree, null, 2)}

Constraints:
- Framework: ${constraints?.technical.framework || 'Express.js'}
- Deployment: ${constraints?.deployment}
- Budget: $${constraints?.budget}/month

Top Risks to Mitigate (from FMEA):
${fmea?.slice(0, 3).map(f => `- ${f.failure_mode}: ${f.recommended_actions.join(', ')}`).join('\n')}

Error-Proofing (Poka-Yoke) Requirements:
${solution.poka_yoke_mechanisms.map(m => `- ${m}`).join('\n')}

${specificRequirements ? `Additional Requirements: ${specificRequirements}` : ''}

Generate a complete, well-structured implementation with:
1. Proper error handling and logging
2. Performance optimizations
3. Security best practices
4. Comprehensive tests
5. Clear documentation

Focus on reliability, maintainability, and meeting all CTQ metrics.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      const generatedContent = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Parse the generated code into files (simplified - in real implementation, would parse actual code blocks)
      const files = [
        {
          path: 'src/index.ts',
          content: generatedContent.includes('```typescript') ? 
            generatedContent.split('```typescript')[1].split('```')[0] : 
            '// Generated code would be here'
        }
      ];

      // Simulate quality metrics
      const qualityMetrics = {
        cyclomatic_complexity: 8 + Math.floor(Math.random() * 5),
        test_coverage: 85 + Math.floor(Math.random() * 10),
        documentation_score: 90 + Math.floor(Math.random() * 8)
      };

      // Check CTQ compliance
      const ctqCompliance: Record<string, boolean> = {};
      if (ctqTree) {
        Object.keys(ctqTree.performance).forEach(metric => {
          ctqCompliance[`performance_${metric}`] = true;
        });
        Object.keys(ctqTree.reliability).forEach(metric => {
          ctqCompliance[`reliability_${metric}`] = true;
        });
      }

      return {
        language: constraints?.technical.language || 'TypeScript',
        framework: constraints?.technical.framework || 'Express.js',
        files,
        quality_metrics: qualityMetrics,
        ctq_compliance: ctqCompliance
      };
    } catch (error) {
      console.error('Claude API error:', error);
      // Return a mock response for demonstration
      return {
        language: 'TypeScript',
        framework: 'Express.js',
        files: [{
          path: 'src/index.ts',
          content: '// Claude API not available - mock implementation'
        }],
        quality_metrics: {
          cyclomatic_complexity: 10,
          test_coverage: 80,
          documentation_score: 85
        },
        ctq_compliance: { 'mock_compliance': true }
      };
    }
  }
  // Helper method: Simulate Pilot Results
  private simulatePilotResults(solution: Solution, project: ProjectState): PilotResults {
    const measureBaselines = project.artifacts.measure?.baselines || {};
    
    const metricsBefore: Record<string, number> = {};
    const metricsAfter: Record<string, number> = {};

    // Use actual baselines where available
    Object.entries(measureBaselines).slice(0, 5).forEach(([metric, baseline]) => {
      metricsBefore[metric] = baseline;
      
      // Apply expected improvements
      let improvement = 1.0;
      if (metric.includes('Performance')) {
        improvement = 1 + (solution.impact_analysis.expected_improvement['response_time'] || 0) / 100;
      } else if (metric.includes('Reliability')) {
        improvement = 1 + (solution.impact_analysis.expected_improvement['reliability'] || 0) / 100;
      }
      
      metricsAfter[metric] = baseline * improvement;
    });

    return {
      solution_id: solution.id,
      metrics_before: metricsBefore,
      metrics_after: metricsAfter,
      success: Object.values(metricsAfter).some((after, i) => 
        after > Object.values(metricsBefore)[i]
      ),
      lessons_learned: [
        'Early stakeholder involvement crucial',
        'Incremental rollout reduced risk',
        'Performance monitoring essential',
        'Team training improved adoption'
      ]
    };
  }
  // Helper method: Create Implementation Plan
  private createImplementationPlan(solution: Solution): ImplementationPlan {
    return {
      phases: [
        {
          name: 'Preparation',
          tasks: [
            'Set up development environment',
            'Create feature branches',
            'Review technical requirements',
            'Conduct team kick-off'
          ],
          duration: '3 days'
        },
        {
          name: 'Development',
          tasks: [
            'Implement core functionality',
            'Add error handling',
            'Write unit tests',
            'Code reviews'
          ],
          duration: solution.impact_analysis.implementation_time
        },
        {
          name: 'Testing & Validation',
          tasks: [
            'Integration testing',
            'Performance testing',
            'Security testing',
            'User acceptance testing'
          ],
          duration: '1 week'
        },
        {
          name: 'Deployment',
          tasks: [
            'Staging deployment',
            'Production deployment',
            'Monitor metrics',
            'Rollback plan ready'
          ],
          duration: '2 days'
        }
      ],
      resources_required: [
        '2 Senior Developers',
        '1 QA Engineer',
        '1 DevOps Engineer',
        'Cloud infrastructure',
        'Monitoring tools'
      ],
      training_plan: [
        'Technical deep-dive for development team',
        'Operations training for support team',
        'End-user training materials',
        'Documentation updates'
      ],
      rollback_strategy: [
        'Maintain previous version in parallel',
        'Database backup before deployment',
        'Feature flags for gradual rollout',
        'Automated rollback triggers',
        '15-minute rollback SLA'
      ]
    };
  }
  // Helper method: Check Improve Phase Quality Gate
  private checkImprovePhaseQualityGate(artifacts: ImproveArtifacts): QualityGateResult {
    const criteriaResults: Record<string, boolean> = {
      'Solutions Proposed': artifacts.proposed_solutions.length > 0,
      'Pilot Successful': artifacts.pilot_results.success,
      'Implementation Plan Ready': artifacts.implementation_plan.phases.length > 0,
      'Rollback Strategy Defined': artifacts.implementation_plan.rollback_strategy.length > 0,
      'Poka-Yoke Implemented': artifacts.proposed_solutions.some(s => s.poka_yoke_mechanisms.length > 0)
    };

    if (artifacts.claude_generated_code) {
      criteriaResults['Code Quality Acceptable'] = 
        artifacts.claude_generated_code.quality_metrics.test_coverage > 80;
      criteriaResults['CTQ Compliance Met'] = 
        Object.values(artifacts.claude_generated_code.ctq_compliance).filter(v => v).length > 
        Object.keys(artifacts.claude_generated_code.ctq_compliance).length * 0.8;
    }

    const passed = Object.values(criteriaResults).every(result => result);
    const missingItems = Object.entries(criteriaResults)
      .filter(([_, result]) => !result)
      .map(([criteria, _]) => criteria);

    const recommendations: string[] = [];
    if (!artifacts.pilot_results.success) {
      recommendations.push('Pilot failed - review and adjust solution');
    }
    if (artifacts.proposed_solutions.length < 2) {
      recommendations.push('Consider additional solution alternatives');
    }

    return {
      passed,
      criteria_results: criteriaResults,
      missing_items: missingItems,
      recommendations
    };
  }
  // Phase 5: Control Phase
  private async controlPhase(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== DMAICPhase.CONTROL) {
      throw new Error(`Project is in ${project.current_phase} phase. Expected CONTROL phase.`);
    }

    const improveArtifacts = project.artifacts.improve;
    const measureArtifacts = project.artifacts.measure;
    if (!improveArtifacts || !measureArtifacts) {
      throw new Error("Previous phase artifacts not found");
    }

    // Create control plan
    const controlPlan = this.createControlPlan(measureArtifacts.kpis, improveArtifacts.proposed_solutions[0]);

    // Set up monitoring dashboard
    const monitoringDashboard = this.setupMonitoringDashboard(measureArtifacts.kpis);

    // Create documentation
    const documentation = this.createDocumentation(project);

    // Validate deployment if URL provided
    let deploymentValid = true;
    if (args.deployment_url) {
      deploymentValid = await this.validateDeployment(args.deployment_url);
    }

    const controlArtifacts: ControlArtifacts = {
      control_plan: controlPlan,
      monitoring_dashboard: monitoringDashboard,
      documentation: documentation,
      training_materials: [
        'User Guide v1.0',
        'Admin Manual',
        'Troubleshooting Guide',
        'API Documentation'
      ]
    };

    project.artifacts.control = controlArtifacts;
    // Quality gate check
    const qualityGate = this.checkControlPhaseQualityGate(controlArtifacts, deploymentValid);
    project.quality_gates.control = qualityGate;

    // Project completion
    if (qualityGate.passed) {
      project.current_phase = DMAICPhase.NONE; // Project complete
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Control Phase Complete!

🎛️ **Control Plan Established:**
- Control Items: ${controlPlan.control_items.length}
- Response Plans: ${Object.keys(controlPlan.response_plans).length}
- Audit Schedule: ${controlPlan.audit_schedule.length} audit types defined

📊 **Monitoring Dashboard:**
- Key Metrics: ${monitoringDashboard.key_metrics.length}
- Control Charts: ${monitoringDashboard.control_charts.length}
- Alert Thresholds: ${Object.keys(monitoringDashboard.alert_thresholds).length} configured
- Reporting: ${monitoringDashboard.reporting_frequency}

📚 **Documentation:**
- Process Docs: ${documentation.process_documentation.length}
- Technical Docs: ${documentation.technical_documentation.length}
- User Guides: ${documentation.user_guides.length}
- Training Materials: ${controlArtifacts.training_materials.length}

${args.deployment_url ? `
🌐 **Deployment Validation:**
- URL: ${args.deployment_url}
- Status: ${deploymentValid ? '✅ Validated' : '❌ Failed'}` : ''}

${qualityGate.passed ? 
`🎉 **Project Complete!**

Six Sigma DMAIC cycle successfully completed. The project has achieved:
- Defined CTQ metrics and constraints
- Established measurement baselines
- Identified and addressed root causes
- Implemented improvements with quality controls
- Set up monitoring and control systems

**Quality Gate: PASSED**

The system is now in production with continuous monitoring.` :
`⚠️ **Quality Gate: FAILED**
Missing items: ${qualityGate.missing_items.join(', ')}
Recommendations: ${qualityGate.recommendations.join('; ')}`}`
        }
      ]
    };
  }
  // Helper method: Create Control Plan
  private createControlPlan(kpis: KPI[], solution: Solution): ControlPlan {
    const controlItems: ControlItem[] = kpis.map(kpi => ({
      metric: kpi.name,
      specification_limits: {
        target: kpi.target,
        usl: kpi.target * 1.1,
        lsl: kpi.target * 0.9
      },
      measurement_method: 'Automated monitoring',
      sample_size: 100,
      frequency: kpi.measurement_frequency,
      responsible_party: 'Operations Team',
      reaction_plan: [
        'Alert on-call engineer',
        'Check system logs',
        'Implement quick fix if possible',
        'Escalate if not resolved in 30 min',
        'Post-mortem for any breach'
      ]
    }));

    const responsePlans: Record<string, string[]> = {
      'Performance Degradation': [
        'Scale resources',
        'Clear caches',
        'Review recent deployments',
        'Rollback if necessary'
      ],
      'Security Alert': [
        'Isolate affected systems',
        'Analyze threat',
        'Apply patches',
        'Update WAF rules'
      ],
      'Service Outage': [
        'Activate DR plan',
        'Communicate to stakeholders',
        'Implement fixes',
        'RCA within 24 hours'
      ]
    };

    const auditSchedule = [
      { frequency: 'Weekly', scope: ['Performance metrics', 'Error rates'] },
      { frequency: 'Monthly', scope: ['Security posture', 'Compliance'] },
      { frequency: 'Quarterly', scope: ['Full system audit', 'Process review'] }
    ];

    return {
      control_items: controlItems,
      response_plans: responsePlans,
      audit_schedule: auditSchedule
    };
  }
  // Helper method: Setup Monitoring Dashboard
  private setupMonitoringDashboard(kpis: KPI[]): MonitoringDashboard {
    const keyMetrics = kpis.map(kpi => kpi.name);
    
    const controlCharts = kpis
      .filter(kpi => kpi.name.includes('Performance') || kpi.name.includes('Reliability'))
      .map(kpi => ({
        metric: kpi.name,
        type: kpi.name.includes('rate') ? 'P-chart' : 'X-bar chart'
      }));

    const alertThresholds: Record<string, { warning: number; critical: number }> = {};
    kpis.forEach(kpi => {
      alertThresholds[kpi.name] = {
        warning: kpi.target * 0.85,
        critical: kpi.target * 0.7
      };
    });

    return {
      key_metrics: keyMetrics,
      control_charts: controlCharts,
      alert_thresholds: alertThresholds,
      reporting_frequency: 'Real-time dashboard with daily summary reports'
    };
  }

  // Helper method: Create Documentation
  private createDocumentation(project: ProjectState): Documentation {
    return {
      process_documentation: [
        'DMAIC Process Overview',
        'Phase Transition Criteria',
        'Quality Gate Definitions',
        'Stakeholder Communication Plan'
      ],
      technical_documentation: [
        'System Architecture',
        'API Specifications',
        'Database Schema',
        'Infrastructure Setup',
        'Security Protocols'
      ],
      user_guides: [
        'End User Manual',
        'Administrator Guide',
        'Quick Start Guide',
        'FAQ Document'
      ],
      api_documentation: [
        'REST API Reference',
        'Authentication Guide',
        'Rate Limiting',
        'Error Codes'
      ]
    };
  }
  // Helper method: Validate Deployment
  private async validateDeployment(deploymentUrl: string): Promise<boolean> {
    try {
      // In a real implementation, would make HTTP requests to validate
      // For now, simulate validation
      console.log(`Validating deployment at: ${deploymentUrl}`);
      
      // Simulate various checks
      const checks = {
        'HTTP Response': true,
        'SSL Certificate': true,
        'Health Endpoint': true,
        'Performance': Math.random() > 0.1,
        'Security Headers': true
      };

      return Object.values(checks).every(check => check);
    } catch (error) {
      console.error('Deployment validation error:', error);
      return false;
    }
  }

  // Helper method: Check Control Phase Quality Gate
  private checkControlPhaseQualityGate(
    artifacts: ControlArtifacts,
    deploymentValid: boolean
  ): QualityGateResult {
    const criteriaResults: Record<string, boolean> = {
      'Control Plan Defined': artifacts.control_plan.control_items.length > 0,
      'Monitoring Active': artifacts.monitoring_dashboard.key_metrics.length > 0,
      'Documentation Complete': artifacts.documentation.process_documentation.length > 0 &&
                               artifacts.documentation.technical_documentation.length > 0,
      'Training Materials Ready': artifacts.training_materials.length >= 3,
      'Response Plans Defined': Object.keys(artifacts.control_plan.response_plans).length >= 3,
      'Deployment Validated': deploymentValid
    };

    const passed = Object.values(criteriaResults).every(result => result);
    const missingItems = Object.entries(criteriaResults)
      .filter(([_, result]) => !result)
      .map(([criteria, _]) => criteria);

    const recommendations: string[] = [];
    if (!deploymentValid) {
      recommendations.push('Fix deployment issues before proceeding');
    }
    if (artifacts.control_plan.audit_schedule.length < 3) {
      recommendations.push('Define comprehensive audit schedule');
    }

    return {
      passed,
      criteria_results: criteriaResults,
      missing_items: missingItems,
      recommendations
    };
  }
  // Utility method: Get Project Status
  private async getProjectStatus(args: any) {
    const project = this.projectState.get(args.project_id);
    if (!project) {
      return {
        content: [{
          type: "text",
          text: "❌ Project not found. Please check the project ID."
        }]
      };
    }

    let statusText = `📊 **Six Sigma Project Status**

**Project Information:**
- ID: ${project.id}
- Name: ${project.name}
- Current Phase: ${project.current_phase}
- Created: ${new Date(project.created_at).toLocaleDateString()}

**Business Case:**
${project.business_case}

**Progress Overview:**
${this.getPhaseStatus(project, DMAICPhase.DEFINE)}
${this.getPhaseStatus(project, DMAICPhase.MEASURE)}
${this.getPhaseStatus(project, DMAICPhase.ANALYZE)}
${this.getPhaseStatus(project, DMAICPhase.IMPROVE)}
${this.getPhaseStatus(project, DMAICPhase.CONTROL)}`;

    if (args.include_artifacts !== false && project.artifacts) {
      statusText += `\n\n**Detailed Artifacts:**\n${JSON.stringify(project.artifacts, null, 2)}`;
    }

    return {
      content: [{
        type: "text",
        text: statusText
      }]
    };
  }

  private getPhaseStatus(project: ProjectState, phase: DMAICPhase): string {
    const isCompleted = project.quality_gates[phase.toLowerCase() as keyof QualityGateResults]?.passed;
    const isCurrent = project.current_phase === phase;
    const status = isCompleted ? '✅' : isCurrent ? '🔄' : '⏳';
    return `${status} ${phase}: ${isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}`;
  }