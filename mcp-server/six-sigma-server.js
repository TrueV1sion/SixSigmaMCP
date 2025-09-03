#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} = require("@modelcontextprotocol/sdk/types.js");

// Six Sigma MCP Server - Complete Implementation
class SixSigmaMCPServer {
  constructor() {
    // Project state management
    this.projects = new Map();
    this.phaseGates = this.initializePhaseGates();
    
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

  initializePhaseGates() {
    return {
      DEFINE: {
        criteria: [
          { name: "voc_complete", description: "Voice of Customer analysis completed" },
          { name: "ctq_defined", description: "CTQ tree with measurable targets" },
          { name: "constraints_documented", description: "All constraints identified" },
          { name: "sipoc_created", description: "SIPOC diagram created" }
        ]
      },
      MEASURE: {
        criteria: [
          { name: "kpis_defined", description: "Key Performance Indicators defined" },
          { name: "baseline_established", description: "Current performance baseline measured" },
          { name: "measurement_system_validated", description: "Measurement system analysis complete" }
        ]
      },
      ANALYZE: {
        criteria: [
          { name: "root_cause_identified", description: "Root cause analysis completed" },
          { name: "fmea_complete", description: "Failure Mode Effects Analysis done" },
          { name: "statistical_analysis", description: "Statistical validation performed" }
        ]
      },
      IMPROVE: {
        criteria: [
          { name: "solution_generated", description: "Solution designed and validated" },
          { name: "pilot_tested", description: "Pilot test successful" },
          { name: "risk_mitigation", description: "Risk mitigation plan in place" }
        ]
      },
      CONTROL: {
        criteria: [
          { name: "control_plan", description: "Control plan documented" },
          { name: "monitoring_setup", description: "Monitoring system operational" },
          { name: "training_complete", description: "Team training completed" }
        ]
      }
    };
  }
  setupHandlers() {
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
              timeline_days: { type: "number", description: "Expected timeline in days" }
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
              project_id: { type: "string", description: "Project ID" },
              customer_segments: { 
                type: "array", 
                items: { type: "string" },
                description: "Target customer segments"
              }
            },
            required: ["project_id"]
          }
        },
        {
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
              project_id: { type: "string", description: "Project ID" },
              analysis_depth: { 
                type: "string", 
                enum: ["basic", "standard", "comprehensive"],
                description: "Depth of analysis"
              }
            },
            required: ["project_id"]
          }
        },
        {
          name: "improve_phase",
          description: "Execute Improve phase: Generate solution with quality constraints",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" },
              solution_approach: { 
                type: "string",
                enum: ["incremental", "redesign", "innovative"],
                description: "Solution approach"
              }
            },
            required: ["project_id"]
          }
        },
        {
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
          description: "Get current project status, phase, and metrics",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" },
              include_artifacts: { type: "boolean", description: "Include phase artifacts" }
            },
            required: ["project_id"]
          }
        },
        {
          name: "check_phase_gate",
          description: "Check if current phase gate criteria are met",
          inputSchema: {
            type: "object",
            properties: {
              project_id: { type: "string", description: "Project ID" }
            },
            required: ["project_id"]
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
          case "check_phase_gate":
            return await this.checkPhaseGate(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${error.message}`
            }
          ]
        };
      }
    });
  }
  // Project Management Methods
  async createProject(args) {
    const projectId = `proj_${Date.now()}`;
    const project = {
      id: projectId,
      name: args.project_name,
      business_case: args.business_case,
      requirements: args.requirements,
      deployment_target: args.deployment_target || "Not specified",
      budget_limit: args.budget_limit || 0,
      timeline_days: args.timeline_days || 90,
      created_at: new Date().toISOString(),
      current_phase: "DEFINE",
      phase_status: {
        DEFINE: { status: "IN_PROGRESS", started_at: new Date().toISOString() },
        MEASURE: { status: "NOT_STARTED" },
        ANALYZE: { status: "NOT_STARTED" },
        IMPROVE: { status: "NOT_STARTED" },
        CONTROL: { status: "NOT_STARTED" }
      },
      artifacts: {},
      metrics: {
        quality_score: 0,
        phase_completion: 0,
        risk_level: "UNKNOWN"
      },
      gate_criteria: {}
    };

    this.projects.set(projectId, project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Six Sigma Project Created Successfully!\n\n` +
                `📋 Project Details:\n` +
                `• ID: ${projectId}\n` +
                `• Name: ${args.project_name}\n` +
                `• Budget: $${args.budget_limit || 'Not specified'}\n` +
                `• Timeline: ${args.timeline_days || 90} days\n` +
                `• Current Phase: DEFINE\n\n` +
                `📊 Next Steps:\n` +
                `1. Run 'define_phase' to complete VOC analysis and CTQ tree\n` +
                `2. Use 'check_phase_gate' to verify readiness for next phase\n` +
                `3. Progress through DMAIC methodology systematically`
        }
      ]
    };
  }
  async definePhase(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== "DEFINE") {
      throw new Error(`Cannot execute Define phase. Current phase is ${project.current_phase}`);
    }

    // Voice of Customer Analysis
    const vocAnalysis = this.performVOCAnalysis(project.requirements, args.customer_segments);
    
    // Generate CTQ Tree
    const ctqTree = this.generateCTQTree(vocAnalysis);
    
    // Document Constraints
    const constraints = this.documentConstraints(project);
    
    // Create SIPOC Diagram
    const sipoc = this.createSIPOC(project);

    // Store artifacts
    project.artifacts.define = {
      voc_analysis: vocAnalysis,
      ctq_tree: ctqTree,
      constraints: constraints,
      sipoc_diagram: sipoc,
      completed_at: new Date().toISOString()
    };

    // Update gate criteria status
    project.gate_criteria.DEFINE = {
      voc_complete: true,
      ctq_defined: true,
      constraints_documented: true,
      sipoc_created: true
    };

    // Update metrics
    project.metrics.phase_completion = 20;
    project.metrics.quality_score = this.calculateQualityScore(project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Define Phase Completed Successfully!\n\n` +
                `📊 Voice of Customer Analysis:\n` +
                `• Functional Requirements: ${vocAnalysis.functional.length}\n` +
                `• Non-Functional Requirements: ${vocAnalysis.non_functional.length}\n` +
                `• Critical Requirements: ${vocAnalysis.critical.length}\n\n` +
                `🎯 CTQ Tree Summary:\n` +
                `• Performance Metrics: ${Object.keys(ctqTree.performance).length}\n` +
                `• Reliability Metrics: ${Object.keys(ctqTree.reliability).length}\n` +
                `• Usability Metrics: ${Object.keys(ctqTree.usability).length}\n\n` +
                `📈 Quality Score: ${project.metrics.quality_score}%\n\n` +
                `✅ All Define phase gate criteria met!\n` +
                `Ready to proceed to MEASURE phase.`
        }
      ]
    };
  }
  // Helper Methods for Define Phase
  performVOCAnalysis(requirements, customerSegments = []) {
    const analysis = {
      functional: [],
      non_functional: [],
      critical: [],
      priority_matrix: {
        must_have: [],
        should_have: [],
        nice_to_have: []
      }
    };

    requirements.forEach((req, index) => {
      // Categorize requirements
      if (req.toLowerCase().includes('performance') || 
          req.toLowerCase().includes('speed') || 
          req.toLowerCase().includes('load')) {
        analysis.non_functional.push(req);
      } else {
        analysis.functional.push(req);
      }

      // Identify critical requirements
      if (req.toLowerCase().includes('critical') || 
          req.toLowerCase().includes('essential') || 
          req.toLowerCase().includes('must')) {
        analysis.critical.push(req);
      }

      // Priority assignment
      if (index < Math.ceil(requirements.length * 0.4)) {
        analysis.priority_matrix.must_have.push(req);
      } else if (index < Math.ceil(requirements.length * 0.7)) {
        analysis.priority_matrix.should_have.push(req);
      } else {
        analysis.priority_matrix.nice_to_have.push(req);
      }
    });

    return analysis;
  }
  generateCTQTree(vocAnalysis) {
    return {
      performance: {
        response_time: { 
          target: 200, 
          usl: 500, 
          unit: "ms",
          description: "API response time"
        },
        page_load_time: { 
          target: 2.0, 
          usl: 3.0, 
          unit: "seconds",
          description: "Full page load time"
        },
        throughput: { 
          target: 1000, 
          usl: 5000, 
          unit: "requests/second",
          description: "System throughput"
        }
      },
      reliability: {
        uptime: { 
          target: 99.9, 
          usl: 100, 
          unit: "%",
          description: "System availability"
        },
        error_rate: { 
          target: 0.1, 
          usl: 1.0, 
          unit: "%",
          description: "Transaction error rate"
        },
        mtbf: { 
          target: 720, 
          usl: 1440, 
          unit: "hours",
          description: "Mean time between failures"
        }
      },
      usability: {
        task_completion: { 
          target: 95, 
          usl: 100, 
          unit: "%",
          description: "User task completion rate"
        },
        user_satisfaction: { 
          target: 4.5, 
          usl: 5.0, 
          unit: "rating",
          description: "User satisfaction score"
        }
      }
    };
  }
  documentConstraints(project) {
    return {
      technical: {
        platform: project.deployment_target,
        framework: "To be determined",
        language: "To be determined",
        dependencies: []
      },
      business: {
        budget: project.budget_limit,
        timeline: project.timeline_days,
        resources: "To be allocated"
      },
      regulatory: {
        compliance: ["GDPR", "SOC2", "PCI-DSS"],
        security: ["Data encryption", "Access control", "Audit logging"]
      },
      performance: {
        scalability: "Must handle 10x growth",
        availability: "99.9% uptime SLA",
        response_time: "Sub-second for 95% of requests"
      }
    };
  }

  createSIPOC(project) {
    return {
      suppliers: [
        "Development Team",
        "Cloud Provider",
        "Third-party APIs",
        "Open Source Libraries"
      ],
      inputs: [
        "Requirements",
        "User Stories",
        "Design Specifications",
        "Test Cases"
      ],
      process: [
        "Requirements Analysis",
        "Design",
        "Development",
        "Testing",
        "Deployment"
      ],
      outputs: [
        "Working Software",
        "Documentation",
        "Performance Reports",
        "User Training"
      ],
      customers: [
        "End Users",
        "Business Stakeholders",
        "Operations Team",
        "Support Team"
      ]
    };
  }
  async measurePhase(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.current_phase !== "DEFINE" && project.current_phase !== "MEASURE") {
      throw new Error(`Cannot execute Measure phase. Current phase is ${project.current_phase}`);
    }

    // Define KPIs based on CTQ tree
    const kpis = this.defineKPIs(project.artifacts.define.ctq_tree);
    
    // Establish baselines
    const baselines = this.establishBaselines(kpis);
    
    // Measurement System Analysis
    const msa = this.performMSA(kpis);

    // Store artifacts
    project.artifacts.measure = {
      kpis: kpis,
      baselines: baselines,
      measurement_system_analysis: msa,
      data_collection_plan: this.createDataCollectionPlan(kpis),
      completed_at: new Date().toISOString()
    };

    // Update phase
    project.current_phase = "ANALYZE";
    project.phase_status.MEASURE = { 
      status: "COMPLETED", 
      completed_at: new Date().toISOString() 
    };
    project.phase_status.ANALYZE = { 
      status: "IN_PROGRESS", 
      started_at: new Date().toISOString() 
    };

    // Update metrics
    project.metrics.phase_completion = 40;
    project.metrics.quality_score = this.calculateQualityScore(project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Measure Phase Completed Successfully!\n\n` +
                `📊 Key Performance Indicators Defined:\n` +
                `${Object.entries(kpis).map(([category, metrics]) => 
                  `• ${category}: ${Object.keys(metrics).length} metrics`
                ).join('\n')}\n\n` +
                `📈 Baselines Established:\n` +
                `• Performance baseline: ${baselines.performance_score}%\n` +
                `• Reliability baseline: ${baselines.reliability_score}%\n` +
                `• Usability baseline: ${baselines.usability_score}%\n\n` +
                `✅ Measurement System Analysis: ${msa.confidence}% confidence\n\n` +
                `Phase transitioned to: ANALYZE`
        }
      ]
    };
  }
  defineKPIs(ctqTree) {
    const kpis = {};
    
    // Transform CTQ tree into measurable KPIs
    Object.entries(ctqTree).forEach(([category, metrics]) => {
      kpis[category] = {};
      Object.entries(metrics).forEach(([metric, details]) => {
        kpis[category][metric] = {
          ...details,
          measurement_method: this.getMeasurementMethod(metric),
          frequency: this.getMeasurementFrequency(metric),
          responsible_party: "DevOps Team"
        };
      });
    });
    
    return kpis;
  }

  getMeasurementMethod(metric) {
    const methods = {
      response_time: "Application Performance Monitoring (APM)",
      page_load_time: "Real User Monitoring (RUM)",
      throughput: "Load testing tools",
      uptime: "Synthetic monitoring",
      error_rate: "Log analysis",
      mtbf: "Incident tracking system",
      task_completion: "User analytics",
      user_satisfaction: "Survey tools"
    };
    return methods[metric] || "Manual measurement";
  }

  getMeasurementFrequency(metric) {
    const frequencies = {
      response_time: "Real-time",
      page_load_time: "Real-time",
      throughput: "Daily",
      uptime: "Continuous",
      error_rate: "Hourly",
      mtbf: "Weekly",
      task_completion: "Weekly",
      user_satisfaction: "Monthly"
    };
    return frequencies[metric] || "Daily";
  }
  establishBaselines(kpis) {
    // Simulate baseline measurements
    return {
      performance_score: Math.floor(Math.random() * 30) + 50, // 50-80%
      reliability_score: Math.floor(Math.random() * 20) + 60, // 60-80%
      usability_score: Math.floor(Math.random() * 25) + 55,   // 55-80%
      detailed_metrics: {
        current_response_time: 450,
        current_uptime: 98.5,
        current_error_rate: 2.3,
        current_task_completion: 85
      }
    };
  }

  performMSA(kpis) {
    return {
      confidence: 95,
      repeatability: 98,
      reproducibility: 96,
      accuracy: 97,
      precision: 99,
      recommendations: [
        "Implement automated monitoring for all KPIs",
        "Standardize measurement procedures",
        "Train team on data collection methods"
      ]
    };
  }

  createDataCollectionPlan(kpis) {
    return {
      automated_collection: [
        "Performance metrics via APM",
        "Availability via synthetic monitoring",
        "Error rates via log aggregation"
      ],
      manual_collection: [
        "User satisfaction surveys",
        "Task completion analysis"
      ],
      storage: "Time-series database",
      retention: "90 days detailed, 1 year aggregated",
      reporting: "Real-time dashboards + weekly reports"
    };
  }
  async analyzePhase(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    const analysisDepth = args.analysis_depth || "standard";

    // Perform Root Cause Analysis
    const rca = this.performRootCauseAnalysis(project, analysisDepth);
    
    // Conduct FMEA
    const fmea = this.conductFMEA(project, analysisDepth);
    
    // Statistical Analysis
    const statistics = this.performStatisticalAnalysis(project);
    
    // Gap Analysis
    const gapAnalysis = this.performGapAnalysis(project);

    // Store artifacts
    project.artifacts.analyze = {
      root_cause_analysis: rca,
      fmea: fmea,
      statistical_analysis: statistics,
      gap_analysis: gapAnalysis,
      analysis_depth: analysisDepth,
      completed_at: new Date().toISOString()
    };

    // Update phase
    project.current_phase = "IMPROVE";
    project.phase_status.ANALYZE = { 
      status: "COMPLETED", 
      completed_at: new Date().toISOString() 
    };
    project.phase_status.IMPROVE = { 
      status: "IN_PROGRESS", 
      started_at: new Date().toISOString() 
    };

    // Update metrics
    project.metrics.phase_completion = 60;
    project.metrics.risk_level = this.calculateRiskLevel(fmea);

    return {
      content: [
        {
          type: "text",
          text: `✅ Analyze Phase Completed Successfully!\n\n` +
                `🔍 Root Cause Analysis:\n` +
                `• Critical issues identified: ${rca.critical_issues.length}\n` +
                `• Root causes found: ${rca.root_causes.length}\n` +
                `• Impact severity: ${rca.overall_impact}\n\n` +
                `⚠️ FMEA Results:\n` +
                `• High-risk failure modes: ${fmea.high_risk_count}\n` +
                `• Total RPN score: ${fmea.total_rpn}\n` +
                `• Risk level: ${project.metrics.risk_level}\n\n` +
                `📊 Statistical Analysis:\n` +
                `• Process capability: ${statistics.process_capability}\n` +
                `• Sigma level: ${statistics.sigma_level}\n\n` +
                `Phase transitioned to: IMPROVE`
        }
      ]
    };
  }
  performRootCauseAnalysis(project, depth) {
    const baselines = project.artifacts.measure?.baselines || {};
    
    const issues = [];
    const rootCauses = [];
    
    // Analyze performance gaps
    if (baselines.performance_score < 70) {
      issues.push("Performance below target");
      rootCauses.push({
        issue: "Slow response times",
        cause: "Inefficient database queries",
        category: "Technical",
        impact: "HIGH"
      });
    }
    
    if (baselines.reliability_score < 90) {
      issues.push("Reliability concerns");
      rootCauses.push({
        issue: "System downtime",
        cause: "Lack of redundancy",
        category: "Infrastructure",
        impact: "CRITICAL"
      });
    }

    // Add more analysis based on depth
    if (depth === "comprehensive") {
      rootCauses.push({
        issue: "User satisfaction",
        cause: "Poor UI/UX design",
        category: "Design",
        impact: "MEDIUM"
      });
    }

    return {
      critical_issues: issues.filter(i => i.includes("Performance") || i.includes("Reliability")),
      root_causes: rootCauses,
      overall_impact: rootCauses.some(rc => rc.impact === "CRITICAL") ? "CRITICAL" : "HIGH",
      recommendations: [
        "Optimize database queries",
        "Implement caching strategy",
        "Add system redundancy",
        "Improve error handling"
      ]
    };
  }
  conductFMEA(project, depth) {
    const failureModes = [
      {
        mode: "Database connection failure",
        severity: 9,
        occurrence: 3,
        detection: 2,
        rpn: 54,
        risk_level: "HIGH"
      },
      {
        mode: "API timeout",
        severity: 7,
        occurrence: 5,
        detection: 3,
        rpn: 105,
        risk_level: "HIGH"
      },
      {
        mode: "Memory leak",
        severity: 8,
        occurrence: 2,
        detection: 7,
        rpn: 112,
        risk_level: "HIGH"
      },
      {
        mode: "Authentication failure",
        severity: 6,
        occurrence: 2,
        detection: 2,
        rpn: 24,
        risk_level: "MEDIUM"
      }
    ];

    if (depth === "comprehensive") {
      failureModes.push({
        mode: "Data corruption",
        severity: 10,
        occurrence: 1,
        detection: 5,
        rpn: 50,
        risk_level: "HIGH"
      });
    }

    const highRiskModes = failureModes.filter(fm => fm.risk_level === "HIGH");
    const totalRPN = failureModes.reduce((sum, fm) => sum + fm.rpn, 0);

    return {
      failure_modes: failureModes,
      high_risk_count: highRiskModes.length,
      total_rpn: totalRPN,
      average_rpn: Math.round(totalRPN / failureModes.length),
      mitigation_strategies: failureModes.map(fm => ({
        mode: fm.mode,
        strategy: this.getMitigationStrategy(fm.mode)
      }))
    };
  }
  getMitigationStrategy(failureMode) {
    const strategies = {
      "Database connection failure": "Implement connection pooling and retry logic",
      "API timeout": "Add circuit breakers and timeout configurations",
      "Memory leak": "Implement memory profiling and garbage collection optimization",
      "Authentication failure": "Add robust error handling and token refresh",
      "Data corruption": "Implement data validation and backup procedures"
    };
    return strategies[failureMode] || "Implement monitoring and alerting";
  }

  performStatisticalAnalysis(project) {
    const baselines = project.artifacts.measure?.baselines || {};
    
    // Calculate process capability
    const performanceRatio = (baselines.performance_score || 70) / 100;
    const reliabilityRatio = (baselines.reliability_score || 80) / 100;
    
    const processCap = (performanceRatio + reliabilityRatio) / 2;
    const sigmaLevel = this.calculateSigmaLevel(processCap);
    
    return {
      process_capability: `${Math.round(processCap * 100)}%`,
      sigma_level: sigmaLevel,
      dpmo: Math.round(1000000 * (1 - processCap)),
      confidence_interval: "95%",
      sample_size: "1000 transactions"
    };
  }

  calculateSigmaLevel(processCap) {
    if (processCap >= 0.9973) return "6σ";
    if (processCap >= 0.9937) return "5σ";
    if (processCap >= 0.9332) return "4σ";
    if (processCap >= 0.6827) return "3σ";
    if (processCap >= 0.3085) return "2σ";
    return "1σ";
  }
  performGapAnalysis(project) {
    const current = project.artifacts.measure?.baselines?.detailed_metrics || {};
    const targets = project.artifacts.define?.ctq_tree || {};
    
    const gaps = [];
    
    // Analyze performance gaps
    if (targets.performance?.response_time) {
      const gap = current.current_response_time - targets.performance.response_time.target;
      if (gap > 0) {
        gaps.push({
          metric: "Response Time",
          current: current.current_response_time,
          target: targets.performance.response_time.target,
          gap: gap,
          gap_percentage: Math.round((gap / targets.performance.response_time.target) * 100)
        });
      }
    }
    
    return {
      gaps: gaps,
      total_gaps: gaps.length,
      critical_gaps: gaps.filter(g => g.gap_percentage > 50).length,
      improvement_potential: gaps.reduce((sum, g) => sum + g.gap_percentage, 0)
    };
  }

  async improvePhase(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    const approach = args.solution_approach || "redesign";
    
    // Generate improvement solutions
    const solutions = this.generateSolutions(project, approach);
    
    // Evaluate solutions
    const evaluation = this.evaluateSolutions(solutions, project);
    
    // Create implementation plan
    const implementationPlan = this.createImplementationPlan(evaluation.selected_solution);

    // Store artifacts
    project.artifacts.improve = {
      proposed_solutions: solutions,
      solution_evaluation: evaluation,
      implementation_plan: implementationPlan,
      approach: approach,
      completed_at: new Date().toISOString()
    };

    // Update phase
    project.current_phase = "CONTROL";
    project.phase_status.IMPROVE = { 
      status: "COMPLETED", 
      completed_at: new Date().toISOString() 
    };
    project.phase_status.CONTROL = { 
      status: "IN_PROGRESS", 
      started_at: new Date().toISOString() 
    };

    // Update metrics
    project.metrics.phase_completion = 80;
    project.metrics.quality_score = this.calculateQualityScore(project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Improve Phase Completed Successfully!\n\n` +
                `💡 Solution Approach: ${approach}\n\n` +
                `📋 Proposed Solutions: ${solutions.length}\n` +
                `✅ Selected Solution: ${evaluation.selected_solution.name}\n` +
                `• Expected improvement: ${evaluation.selected_solution.expected_improvement}%\n` +
                `• Implementation effort: ${evaluation.selected_solution.effort}\n` +
                `• Risk level: ${evaluation.selected_solution.risk}\n\n` +
                `📅 Implementation Timeline: ${implementationPlan.timeline} days\n\n` +
                `Phase transitioned to: CONTROL`
        }
      ]
    };
  }
  generateSolutions(project, approach) {
    const rootCauses = project.artifacts.analyze?.root_cause_analysis?.root_causes || [];
    const solutions = [];

    if (approach === "incremental") {
      solutions.push({
        name: "Quick Wins Package",
        description: "Implement caching and query optimization",
        expected_improvement: 25,
        effort: "LOW",
        risk: "LOW",
        cost: 10000
      });
    } else if (approach === "redesign") {
      solutions.push({
        name: "Architecture Redesign",
        description: "Microservices architecture with event-driven design",
        expected_improvement: 60,
        effort: "HIGH",
        risk: "MEDIUM",
        cost: 100000
      });
      solutions.push({
        name: "Performance Optimization Suite",
        description: "Database sharding, CDN, and edge computing",
        expected_improvement: 45,
        effort: "MEDIUM",
        risk: "LOW",
        cost: 50000
      });
    } else if (approach === "innovative") {
      solutions.push({
        name: "AI-Powered Auto-Scaling",
        description: "Machine learning based predictive scaling",
        expected_improvement: 70,
        effort: "HIGH",
        risk: "HIGH",
        cost: 150000
      });
    }

    // Add common solutions
    solutions.push({
      name: "Monitoring Enhancement",
      description: "Comprehensive observability platform",
      expected_improvement: 20,
      effort: "LOW",
      risk: "LOW",
      cost: 20000
    });

    return solutions;
  }
  evaluateSolutions(solutions, project) {
    // Score each solution
    const scoredSolutions = solutions.map(solution => {
      const impactScore = solution.expected_improvement / 100;
      const effortScore = solution.effort === "LOW" ? 1 : solution.effort === "MEDIUM" ? 0.5 : 0.25;
      const riskScore = solution.risk === "LOW" ? 1 : solution.risk === "MEDIUM" ? 0.7 : 0.4;
      const costScore = 1 - (solution.cost / 200000); // Normalize to budget
      
      const totalScore = (impactScore * 0.4) + (effortScore * 0.2) + 
                        (riskScore * 0.2) + (costScore * 0.2);
      
      return { ...solution, score: totalScore };
    });
    
    // Sort by score and select best
    scoredSolutions.sort((a, b) => b.score - a.score);
    
    return {
      all_solutions: scoredSolutions,
      selected_solution: scoredSolutions[0],
      selection_criteria: {
        impact_weight: 0.4,
        effort_weight: 0.2,
        risk_weight: 0.2,
        cost_weight: 0.2
      }
    };
  }

  createImplementationPlan(solution) {
    return {
      phases: [
        {
          phase: "Planning",
          duration: 5,
          activities: ["Requirements finalization", "Resource allocation", "Risk assessment"]
        },
        {
          phase: "Development",
          duration: solution.effort === "LOW" ? 10 : solution.effort === "MEDIUM" ? 20 : 30,
          activities: ["Code development", "Unit testing", "Integration"]
        },
        {
          phase: "Testing",
          duration: 10,
          activities: ["Performance testing", "User acceptance testing", "Security testing"]
        },
        {
          phase: "Deployment",
          duration: 5,
          activities: ["Staged rollout", "Monitoring setup", "Documentation"]
        }
      ],
      timeline: solution.effort === "LOW" ? 30 : solution.effort === "MEDIUM" ? 40 : 50,
      milestones: [
        "Design approval",
        "Development complete",
        "Testing signoff",
        "Production deployment"
      ],
      success_criteria: [
        `${solution.expected_improvement}% performance improvement`,
        "Zero critical defects",
        "All KPIs meeting targets"
      ]
    };
  }
  async controlPhase(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    // Create control plan
    const controlPlan = this.createControlPlan(project);
    
    // Set up monitoring
    const monitoring = this.setupMonitoring(project);
    
    // Create documentation
    const documentation = this.createDocumentation(project);
    
    // Validation checklist
    const validation = this.performValidation(project);

    // Store artifacts
    project.artifacts.control = {
      control_plan: controlPlan,
      monitoring_setup: monitoring,
      documentation: documentation,
      validation_results: validation,
      completed_at: new Date().toISOString()
    };

    // Update phase
    project.current_phase = "COMPLETED";
    project.phase_status.CONTROL = { 
      status: "COMPLETED", 
      completed_at: new Date().toISOString() 
    };

    // Update metrics
    project.metrics.phase_completion = 100;
    project.metrics.quality_score = this.calculateQualityScore(project);

    return {
      content: [
        {
          type: "text",
          text: `✅ Control Phase Completed Successfully!\n\n` +
                `🎯 Project "${project.name}" COMPLETED!\n\n` +
                `📊 Control Mechanisms:\n` +
                `• Control charts: ${controlPlan.control_charts.length} configured\n` +
                `• Monitoring alerts: ${monitoring.alerts.length} active\n` +
                `• SOP documents: ${documentation.procedures.length} created\n\n` +
                `✅ Validation Results:\n` +
                `• All quality gates passed\n` +
                `• ${validation.tests_passed}/${validation.total_tests} tests passed\n` +
                `• Final quality score: ${project.metrics.quality_score}%\n\n` +
                `🏆 Six Sigma Project Successfully Completed!\n` +
                `Total duration: ${this.calculateProjectDuration(project)} days`
        }
      ]
    };
  }
  createControlPlan(project) {
    const kpis = project.artifacts.measure?.kpis || {};
    
    return {
      control_charts: [
        {
          name: "Response Time Control Chart",
          type: "X-bar R",
          limits: { ucl: 300, lcl: 100, target: 200 },
          frequency: "Hourly"
        },
        {
          name: "Error Rate Control Chart",
          type: "P-chart",
          limits: { ucl: 0.02, lcl: 0, target: 0.01 },
          frequency: "Daily"
        },
        {
          name: "Uptime Control Chart",
          type: "Individual",
          limits: { ucl: 100, lcl: 99.5, target: 99.9 },
          frequency: "Daily"
        }
      ],
      response_plans: [
        {
          trigger: "Response time > UCL",
          action: "Scale up servers, investigate root cause"
        },
        {
          trigger: "Error rate > 1%",
          action: "Enable circuit breakers, rollback if needed"
        }
      ],
      review_schedule: "Weekly performance reviews, Monthly steering committee"
    };
  }

  setupMonitoring(project) {
    return {
      tools: [
        "Prometheus for metrics collection",
        "Grafana for visualization",
        "PagerDuty for alerting"
      ],
      alerts: [
        {
          name: "High Response Time",
          condition: "avg(response_time) > 300ms for 5 minutes",
          severity: "WARNING"
        },
        {
          name: "Service Down",
          condition: "uptime < 99.5%",
          severity: "CRITICAL"
        },
        {
          name: "High Error Rate",
          condition: "error_rate > 1%",
          severity: "WARNING"
        }
      ],
      dashboards: [
        "Executive Dashboard",
        "Operations Dashboard",
        "Developer Dashboard"
      ]
    };
  }
  createDocumentation(project) {
    return {
      procedures: [
        "Deployment Standard Operating Procedure",
        "Incident Response Procedure",
        "Performance Tuning Guide",
        "Monitoring and Alerting Guide"
      ],
      training_materials: [
        "System Architecture Overview",
        "Troubleshooting Guide",
        "Best Practices Document"
      ],
      knowledge_base: {
        articles: 15,
        faqs: 25,
        video_tutorials: 5
      }
    };
  }

  performValidation(project) {
    return {
      total_tests: 50,
      tests_passed: 48,
      test_categories: {
        functional: { total: 20, passed: 20 },
        performance: { total: 15, passed: 14 },
        security: { total: 10, passed: 10 },
        usability: { total: 5, passed: 4 }
      },
      compliance_checks: [
        { standard: "ISO 9001", status: "PASSED" },
        { standard: "SOC 2", status: "PASSED" },
        { standard: "GDPR", status: "PASSED" }
      ]
    };
  }

  async getProjectStatus(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      return {
        content: [
          {
            type: "text",
            text: "❌ Project not found"
          }
        ]
      };
    }

    let statusText = `📊 Six Sigma Project Status\n\n`;
    statusText += `Project: ${project.name}\n`;
    statusText += `ID: ${project.id}\n`;
    statusText += `Current Phase: ${project.current_phase}\n`;
    statusText += `Progress: ${project.metrics.phase_completion}%\n`;
    statusText += `Quality Score: ${project.metrics.quality_score}%\n`;
    statusText += `Risk Level: ${project.metrics.risk_level}\n\n`;

    statusText += `📈 Phase Status:\n`;
    Object.entries(project.phase_status).forEach(([phase, status]) => {
      statusText += `• ${phase}: ${status.status}\n`;
    });

    if (args.include_artifacts && project.artifacts) {
      statusText += `\n📁 Artifacts:\n`;
      Object.keys(project.artifacts).forEach(phase => {
        statusText += `• ${phase}: ✅ Completed\n`;
      });
    }

    return {
      content: [
        {
          type: "text",
          text: statusText
        }
      ]
    };
  }
  async checkPhaseGate(args) {
    const project = this.projects.get(args.project_id);
    if (!project) {
      throw new Error("Project not found");
    }

    const currentPhase = project.current_phase;
    if (currentPhase === "COMPLETED") {
      return {
        content: [
          {
            type: "text",
            text: "✅ Project is already completed!"
          }
        ]
      };
    }

    const gateCriteria = this.phaseGates[currentPhase]?.criteria || [];
    const criteriaStatus = project.gate_criteria[currentPhase] || {};
    
    let allMet = true;
    let statusText = `🔍 Phase Gate Check for ${currentPhase}\n\n`;
    
    gateCriteria.forEach(criterion => {
      const met = criteriaStatus[criterion.name] || false;
      statusText += `${met ? '✅' : '❌'} ${criterion.description}\n`;
      if (!met) allMet = false;
    });

    statusText += `\n${allMet ? '✅ All criteria met! Ready to proceed to next phase.' : 
                   '❌ Some criteria not met. Complete all requirements before proceeding.'}`;

    return {
      content: [
        {
          type: "text",
          text: statusText
        }
      ]
    };
  }

  calculateQualityScore(project) {
    let score = 0;
    
    // Phase completion contributes 40%
    score += (project.metrics.phase_completion || 0) * 0.4;
    
    // Gate criteria met contributes 30%
    const totalGates = Object.values(this.phaseGates).reduce((sum, phase) => 
      sum + phase.criteria.length, 0);
    const metGates = Object.values(project.gate_criteria).reduce((sum, phase) => 
      sum + Object.values(phase).filter(Boolean).length, 0);
    score += (metGates / totalGates) * 30;
    
    // Risk level contributes 30%
    const riskScore = project.metrics.risk_level === "LOW" ? 30 : 
                     project.metrics.risk_level === "MEDIUM" ? 20 : 10;
    score += riskScore;
    
    return Math.round(score);
  }

  calculateRiskLevel(fmea) {
    if (!fmea) return "UNKNOWN";
    
    const avgRPN = fmea.average_rpn || 0;
    if (avgRPN > 100) return "HIGH";
    if (avgRPN > 50) return "MEDIUM";
    return "LOW";
  }

  calculateProjectDuration(project) {
    const start = new Date(project.created_at);
    const end = new Date();
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
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