// Define Agent - Handles DMAIC Define Phase
// Responsible for VOC analysis, CTQ tree generation, and constraint documentation

import { BaseAgent } from './base-agent.js';
import { SharedResourceManager } from '../shared/resource-manager.js';
import { 
  ProjectState,
  DefineArtifacts,
  VOCAnalysis,
  CTQTree,
  ProjectConstraints,
  SIPOCDiagram,
  ProjectCharter,
  CTQMetric
} from '../types/index.js';

export class DefineAgent extends BaseAgent {
  constructor(resourceManager: SharedResourceManager) {
    super('define-agent', resourceManager);
  }

  async execute(projectId: string, args?: any): Promise<DefineArtifacts> {
    const project = await this.getProjectState(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Execute all Define phase activities
    const vocAnalysis = await this.analyzeVOC(project.requirements);
    const ctqTree = await this.generateCTQTree(vocAnalysis);
    const constraints = await this.compileConstraints(project);
    const sipocDiagram = await this.createSIPOC(project);
    const projectCharter = await this.createProjectCharter(project);

    const defineArtifacts: DefineArtifacts = {
      voc_analysis: vocAnalysis,
      ctq_tree: ctqTree,
      constraints: constraints,
      sipoc_diagram: sipocDiagram,
      project_charter: projectCharter
    };
    // Update project artifacts
    project.artifacts.define = defineArtifacts;
    await this.updateProjectState(projectId, project);

    // Store individual artifacts in shared resources
    await this.updateProjectResource(projectId, 'voc_analysis', vocAnalysis);
    await this.updateProjectResource(projectId, 'ctq_tree', ctqTree);
    await this.updateProjectResource(projectId, 'constraints', constraints);

    return defineArtifacts;
  }

  private async analyzeVOC(requirements: string[]): Promise<VOCAnalysis> {
    // Analyze requirements to categorize them
    const functional: string[] = [];
    const nonFunctional: string[] = [];
    
    for (const req of requirements) {
      // Simple heuristic: performance, security, scalability are non-functional
      if (req.toLowerCase().match(/performance|security|scalability|reliability|load|uptime/)) {
        nonFunctional.push(req);
      } else {
        functional.push(req);
      }
    }

    // Create priority matrix based on order and keywords
    const priorityKeywords = {
      must: /must|required|critical|essential/i,
      should: /should|important|preferred/i,
      nice: /nice|optional|future|consider/i
    };

    const priorityMatrix = {
      must_have: [] as string[],
      should_have: [] as string[],
      nice_to_have: [] as string[]
    };
    // Categorize requirements by priority
    requirements.forEach((req, index) => {
      if (priorityKeywords.must.test(req) || index < 3) {
        priorityMatrix.must_have.push(req);
      } else if (priorityKeywords.should.test(req) || index < 6) {
        priorityMatrix.should_have.push(req);
      } else {
        priorityMatrix.nice_to_have.push(req);
      }
    });

    return {
      customer_needs: requirements,
      functional_requirements: functional,
      non_functional_requirements: nonFunctional,
      priority_matrix: priorityMatrix
    };
  }

  private async generateCTQTree(vocAnalysis: VOCAnalysis): Promise<CTQTree> {
    const ctqTree: CTQTree = {
      customer_needs: {}
    };

    // Map common requirement patterns to CTQ metrics
    const metricPatterns = {
      performance: {
        drivers: ['Response Time', 'Throughput', 'Resource Usage'],
        metrics: [
          { name: 'page_load_time', description: 'Page load time', target_value: 2.0, upper_spec_limit: 3.0, unit: 'seconds' },
          { name: 'api_response_time', description: 'API response time', target_value: 200, upper_spec_limit: 500, unit: 'ms' }
        ]
      },
      reliability: {
        drivers: ['Availability', 'Error Rate', 'Recovery Time'],
        metrics: [
          { name: 'uptime', description: 'System uptime', target_value: 99.9, upper_spec_limit: 100, lower_spec_limit: 99.0, unit: '%' },
          { name: 'error_rate', description: 'Error rate', target_value: 0.1, upper_spec_limit: 1.0, unit: '%' }
        ]
      },      usability: {
        drivers: ['User Experience', 'Accessibility', 'Documentation'],
        metrics: [
          { name: 'task_completion', description: 'Task completion rate', target_value: 95, upper_spec_limit: 100, lower_spec_limit: 80, unit: '%' },
          { name: 'user_satisfaction', description: 'User satisfaction score', target_value: 4.5, upper_spec_limit: 5.0, lower_spec_limit: 3.5, unit: 'rating' }
        ]
      }
    };

    // Analyze requirements and map to CTQ categories
    vocAnalysis.customer_needs.forEach(need => {
      const needLower = need.toLowerCase();
      
      if (needLower.includes('performance') || needLower.includes('fast') || needLower.includes('speed')) {
        ctqTree.customer_needs['Performance'] = metricPatterns.performance;
      }
      if (needLower.includes('reliable') || needLower.includes('availability') || needLower.includes('uptime')) {
        ctqTree.customer_needs['Reliability'] = metricPatterns.reliability;
      }
      if (needLower.includes('user') || needLower.includes('easy') || needLower.includes('intuitive')) {
        ctqTree.customer_needs['Usability'] = metricPatterns.usability;
      }
    });

    // Ensure at least one CTQ category
    if (Object.keys(ctqTree.customer_needs).length === 0) {
      ctqTree.customer_needs['General Quality'] = {
        drivers: ['Functionality', 'Performance', 'Reliability'],
        metrics: [
          { name: 'feature_completion', description: 'Feature completion rate', target_value: 100, upper_spec_limit: 100, lower_spec_limit: 90, unit: '%' },
          { name: 'defect_rate', description: 'Defect rate', target_value: 1, upper_spec_limit: 5, unit: 'per KLOC' }
        ]
      };
    }

    return ctqTree;
  }
  private async compileConstraints(project: ProjectState): Promise<ProjectConstraints> {
    return {
      technical: {
        framework: 'Next.js 14',
        language: 'TypeScript',
        dependencies: ['React', 'Tailwind CSS', 'Node.js'],
        compatibility: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+']
      },
      deployment: {
        platform: project.deployment_target || 'cloud',
        infrastructure: 'containerized',
        regions: ['us-east-1', 'eu-west-1']
      },
      budget: {
        monthly_limit: project.budget_limit || 1000,
        total_limit: (project.budget_limit || 1000) * 12,
        cost_breakdown: {
          infrastructure: 0.4,
          development: 0.4,
          maintenance: 0.2
        }
      },
      timeline: {
        total_days: project.timeline_days || 90,
        phase_deadlines: {
          DEFINE: '10 days',
          MEASURE: '15 days',
          ANALYZE: '20 days',
          IMPROVE: '30 days',
          CONTROL: '15 days',
          COMPLETE: 'N/A'
        }
      }
    };
  }
  private async createSIPOC(project: ProjectState): Promise<SIPOCDiagram> {
    return {
      suppliers: [
        'Product Owner',
        'End Users',
        'Technical Team',
        'Cloud Provider',
        'Third-party Services'
      ],
      inputs: [
        'Business Requirements',
        'User Feedback',
        'Technical Specifications',
        'Design Assets',
        'API Documentation'
      ],
      process: [
        'Requirements Analysis',
        'Design & Architecture',
        'Development',
        'Testing & QA',
        'Deployment',
        'Monitoring'
      ],
      outputs: [
        'Working Software',
        'Documentation',
        'Deployment Artifacts',
        'Performance Reports',
        'User Training Materials'
      ],
      customers: [
        'End Users',
        'Business Stakeholders',
        'Operations Team',
        'Support Team'
      ]
    };
  }
  private async createProjectCharter(project: ProjectState): Promise<ProjectCharter> {
    return {
      problem_statement: `Current state lacks a structured approach to ${project.name}, 
        resulting in quality issues and inefficiencies. ${project.business_case}`,
      goal_statement: `Implement a high-quality ${project.name} solution using Six Sigma 
        methodology to ensure reliability, performance, and user satisfaction while 
        meeting all defined constraints.`,
      scope: `This project covers the complete development lifecycle of ${project.name}, 
        from requirements analysis through deployment and control phase. It includes 
        all technical implementation, testing, documentation, and training.`,
      deliverables: [
        'Fully functional software meeting all requirements',
        'Comprehensive documentation',
        'Test suite with >80% coverage',
        'Deployment automation',
        'Monitoring and alerting system',
        'Training materials and SOPs'
      ],
      stakeholders: [
        { name: 'Project Sponsor', role: 'Decision Maker', interest: 'high', influence: 'high' },
        { name: 'End Users', role: 'Primary Users', interest: 'high', influence: 'medium' },
        { name: 'Development Team', role: 'Implementation', interest: 'high', influence: 'medium' },
        { name: 'Operations Team', role: 'Deployment & Support', interest: 'medium', influence: 'high' },
        { name: 'Quality Team', role: 'Testing & Validation', interest: 'high', influence: 'medium' }
      ]
    };
  }
}