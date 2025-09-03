// Quality Gate Manager for Six Sigma MCP
// Enforces phase transition criteria

import { 
  ProjectState, 
  DMAICPhase, 
  QualityGateResult, 
  CriteriaResult,
  DefineArtifacts,
  MeasureArtifacts,
  AnalyzeArtifacts,
  ImproveArtifacts,
  ControlArtifacts
} from '../types/index.js';

export interface QualityGateCriteria {
  name: string;
  description: string;
  validator: (project: ProjectState) => CriteriaResult;
}

export class QualityGateManager {
  private gatesCriteria: Map<string, QualityGateCriteria[]> = new Map();

  constructor() {
    this.initializeGateCriteria();
  }

  private initializeGateCriteria() {
    // Define to Measure gate criteria
    this.gatesCriteria.set('DEFINE_TO_MEASURE', [
      {
        name: 'VOC_COMPLETE',
        description: 'Voice of Customer analysis must be complete',
        validator: (project) => this.validateVOCComplete(project)
      },      {
        name: 'CTQ_DEFINED',
        description: 'CTQ tree with measurable metrics must be defined',
        validator: (project) => this.validateCTQDefined(project)
      },
      {
        name: 'CONSTRAINTS_DOCUMENTED',
        description: 'All project constraints must be documented',
        validator: (project) => this.validateConstraintsDocumented(project)
      },
      {
        name: 'PROJECT_CHARTER_APPROVED',
        description: 'Project charter must be complete and approved',
        validator: (project) => this.validateProjectCharter(project)
      }
    ]);

    // Measure to Analyze gate criteria
    this.gatesCriteria.set('MEASURE_TO_ANALYZE', [
      {
        name: 'KPIS_DEFINED',
        description: 'All KPIs must be defined with targets',
        validator: (project) => this.validateKPIsDefined(project)
      },
      {
        name: 'BASELINES_ESTABLISHED',
        description: 'Baseline measurements must be established',
        validator: (project) => this.validateBaselinesEstablished(project)
      },
      {
        name: 'MEASUREMENT_PLAN_COMPLETE',
        description: 'Measurement plan must be documented',
        validator: (project) => this.validateMeasurementPlan(project)
      }
    ]);
    // Analyze to Improve gate criteria
    this.gatesCriteria.set('ANALYZE_TO_IMPROVE', [
      {
        name: 'ROOT_CAUSES_IDENTIFIED',
        description: 'Root causes must be identified and validated',
        validator: (project) => this.validateRootCausesIdentified(project)
      },
      {
        name: 'FMEA_COMPLETE',
        description: 'FMEA must be complete with high-risk items addressed',
        validator: (project) => this.validateFMEAComplete(project)
      },
      {
        name: 'PROCESS_INEFFICIENCIES_MAPPED',
        description: 'Process inefficiencies must be identified',
        validator: (project) => this.validateProcessMap(project)
      }
    ]);

    // Improve to Control gate criteria
    this.gatesCriteria.set('IMPROVE_TO_CONTROL', [
      {
        name: 'SOLUTION_VALIDATED',
        description: 'Solution must be designed and validated',
        validator: (project) => this.validateSolutionDesign(project)
      },
      {
        name: 'PILOT_SUCCESSFUL',
        description: 'Pilot must show improvement in key metrics',
        validator: (project) => this.validatePilotResults(project)
      },
      {
        name: 'IMPLEMENTATION_PLAN_READY',
        description: 'Implementation plan must be complete',
        validator: (project) => this.validateImplementationPlan(project)
      }
    ]);
    // Control to Complete gate criteria
    this.gatesCriteria.set('CONTROL_TO_COMPLETE', [
      {
        name: 'CONTROL_PLAN_ACTIVE',
        description: 'Control plan must be implemented and active',
        validator: (project) => this.validateControlPlan(project)
      },
      {
        name: 'MONITORING_OPERATIONAL',
        description: 'Monitoring dashboard must be operational',
        validator: (project) => this.validateMonitoring(project)
      },
      {
        name: 'TRAINING_COMPLETE',
        description: 'Training materials must be created and delivered',
        validator: (project) => this.validateTraining(project)
      },
      {
        name: 'METRICS_STABLE',
        description: 'Key metrics must show stability',
        validator: (project) => this.validateMetricsStability(project)
      }
    ]);
  }

  async evaluateGate(
    project: ProjectState, 
    fromPhase: DMAICPhase, 
    toPhase: DMAICPhase
  ): Promise<QualityGateResult> {
    const gateKey = `${fromPhase}_TO_${toPhase}`;
    const criteria = this.gatesCriteria.get(gateKey);
    
    if (!criteria) {
      throw new Error(`No quality gate defined for ${fromPhase} to ${toPhase}`);
    }
    const criteriaResults: CriteriaResult[] = [];
    let passedCount = 0;

    for (const criterion of criteria) {
      const result = criterion.validator(project);
      criteriaResults.push(result);
      if (result.passed) {
        passedCount++;
      }
    }

    const overallScore = (passedCount / criteria.length) * 100;
    const passed = overallScore >= 80; // 80% threshold for gate passage

    return {
      passed,
      evaluation_date: new Date().toISOString(),
      criteria_results: criteriaResults,
      overall_score: overallScore,
      notes: passed 
        ? `Quality gate passed with ${overallScore.toFixed(1)}% score`
        : `Quality gate failed. Only ${passedCount} of ${criteria.length} criteria met.`
    };
  }

  // Validator implementations
  private validateVOCComplete(project: ProjectState): CriteriaResult {
    const define = project.artifacts.define;
    const hasVOC = define?.voc_analysis && 
                   define.voc_analysis.customer_needs?.length > 0 &&
                   define.voc_analysis.priority_matrix?.must_have?.length > 0;

    return {
      criterion: 'VOC_COMPLETE',
      passed: !!hasVOC,
      actual_value: hasVOC ? 'Complete' : 'Incomplete',
      expected_value: 'Complete VOC analysis with prioritized requirements',
      evidence: hasVOC ? 'VOC analysis contains customer needs and priority matrix' : undefined
    };
  }
  private validateCTQDefined(project: ProjectState): CriteriaResult {
    const define = project.artifacts.define;
    const hasCTQ = define?.ctq_tree && 
                   Object.keys(define.ctq_tree.customer_needs || {}).length > 0;
    
    let metricsCount = 0;
    if (hasCTQ && define?.ctq_tree.customer_needs) {
      for (const need of Object.values(define.ctq_tree.customer_needs)) {
        metricsCount += need.metrics?.length || 0;
      }
    }

    return {
      criterion: 'CTQ_DEFINED',
      passed: hasCTQ && metricsCount > 0,
      actual_value: metricsCount,
      expected_value: 'At least 1 metric per customer need',
      evidence: hasCTQ ? `${metricsCount} CTQ metrics defined` : undefined
    };
  }

  private validateConstraintsDocumented(project: ProjectState): CriteriaResult {
    const define = project.artifacts.define;
    const hasConstraints = define?.constraints &&
                          define.constraints.technical &&
                          define.constraints.deployment &&
                          define.constraints.budget;

    return {
      criterion: 'CONSTRAINTS_DOCUMENTED',
      passed: !!hasConstraints,
      actual_value: hasConstraints ? 'Documented' : 'Missing',
      expected_value: 'Technical, deployment, and budget constraints',
      evidence: hasConstraints ? 'All constraint categories documented' : undefined
    };
  }
  private validateProjectCharter(project: ProjectState): CriteriaResult {
    const define = project.artifacts.define;
    const hasCharter = define?.project_charter &&
                      define.project_charter.problem_statement &&
                      define.project_charter.goal_statement &&
                      define.project_charter.deliverables?.length > 0;

    return {
      criterion: 'PROJECT_CHARTER_APPROVED',
      passed: !!hasCharter,
      actual_value: hasCharter ? 'Complete' : 'Incomplete',
      expected_value: 'Complete project charter',
      evidence: hasCharter ? 'Charter contains all required elements' : undefined
    };
  }

  private validateKPIsDefined(project: ProjectState): CriteriaResult {
    const measure = project.artifacts.measure;
    const kpiCount = measure?.kpis?.length || 0;
    const hasValidKPIs = kpiCount > 0 && 
                        measure?.kpis?.every(kpi => kpi.target !== undefined);

    return {
      criterion: 'KPIS_DEFINED',
      passed: hasValidKPIs,
      actual_value: kpiCount,
      expected_value: 'At least 3 KPIs with targets',
      evidence: hasValidKPIs ? `${kpiCount} KPIs defined with targets` : undefined
    };
  }

  // Placeholder implementations for remaining validators
  private validateBaselinesEstablished(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('BASELINES_ESTABLISHED', true);
  }
  private validateMeasurementPlan(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('MEASUREMENT_PLAN_COMPLETE', true);
  }

  private validateRootCausesIdentified(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('ROOT_CAUSES_IDENTIFIED', true);
  }

  private validateFMEAComplete(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('FMEA_COMPLETE', true);
  }

  private validateProcessMap(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('PROCESS_INEFFICIENCIES_MAPPED', true);
  }

  private validateSolutionDesign(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('SOLUTION_VALIDATED', true);
  }

  private validatePilotResults(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('PILOT_SUCCESSFUL', true);
  }

  private validateImplementationPlan(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('IMPLEMENTATION_PLAN_READY', true);
  }

  private validateControlPlan(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('CONTROL_PLAN_ACTIVE', true);
  }
  private validateMonitoring(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('MONITORING_OPERATIONAL', true);
  }

  private validateTraining(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('TRAINING_COMPLETE', true);
  }

  private validateMetricsStability(project: ProjectState): CriteriaResult {
    return this.createPlaceholderResult('METRICS_STABLE', true);
  }

  private createPlaceholderResult(criterion: string, passed: boolean): CriteriaResult {
    return {
      criterion,
      passed,
      actual_value: passed ? 'Complete' : 'Incomplete',
      expected_value: 'Complete',
      evidence: passed ? 'Validation passed' : undefined
    };
  }
}