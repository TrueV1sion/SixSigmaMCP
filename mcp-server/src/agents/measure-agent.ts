// Measure Agent - Handles DMAIC Measure Phase
// Responsible for KPI definition, baseline establishment, and measurement planning

import { BaseAgent } from './base-agent.js';
import { SharedResourceManager } from '../shared/resource-manager.js';
import { 
  ProjectState,
  MeasureArtifacts,
  KPI,
  Baseline,
  MeasurementPlan,
  DataCollectionPlan,
  CTQTree,
  CTQMetric
} from '../types/index.js';

export class MeasureAgent extends BaseAgent {
  constructor(resourceManager: SharedResourceManager) {
    super('measure-agent', resourceManager);
  }

  async execute(projectId: string, args?: any): Promise<MeasureArtifacts> {
    const project = await this.getProjectState(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get CTQ tree from Define phase
    const ctqTree = await this.getProjectResource(projectId, 'ctq_tree') as CTQTree;
    if (!ctqTree) {
      throw new Error('CTQ tree not found. Define phase must be completed first.');
    }

    // Execute Measure phase activities
    const kpis = await this.defineKPIs(ctqTree);
    const baselines = await this.establishBaselines(kpis);
    const measurementPlan = await this.createMeasurementPlan(kpis);
    const dataCollectionPlan = await this.createDataCollectionPlan(kpis);

    const measureArtifacts: MeasureArtifacts = {
      kpis,
      baselines,
      measurement_plan: measurementPlan,
      data_collection_plan: dataCollectionPlan
    };
    // Update project artifacts
    project.artifacts.measure = measureArtifacts;
    await this.updateProjectState(projectId, project);

    // Store in shared resources
    await this.updateProjectResource(projectId, 'kpis', kpis);
    await this.updateProjectResource(projectId, 'baselines', baselines);

    return measureArtifacts;
  }

  private async defineKPIs(ctqTree: CTQTree): Promise<KPI[]> {
    const kpis: KPI[] = [];

    // Convert CTQ metrics to KPIs
    for (const [need, data] of Object.entries(ctqTree.customer_needs)) {
      for (const metric of data.metrics) {
        const kpi: KPI = {
          name: metric.name,
          description: metric.description,
          formula: this.getKPIFormula(metric.name),
          target: metric.target_value,
          current: 0, // Will be updated with baseline
          unit: metric.unit,
          frequency: this.getFrequency(metric.name)
        };
        kpis.push(kpi);
      }
    }

    // Add standard project KPIs
    kpis.push({
      name: 'deployment_frequency',
      description: 'Number of deployments per week',
      formula: 'count(deployments) / weeks',
      target: 3,
      current: 0,
      unit: 'per week',
      frequency: 'weekly'
    });
    kpis.push({
      name: 'lead_time',
      description: 'Time from commit to production',
      formula: 'production_timestamp - commit_timestamp',
      target: 24,
      current: 0,
      unit: 'hours',
      frequency: 'continuous'
    });

    return kpis;
  }

  private getKPIFormula(metricName: string): string {
    const formulas: Record<string, string> = {
      'page_load_time': 'DOMContentLoaded - navigationStart',
      'api_response_time': 'response_end - request_start',
      'uptime': '(total_time - downtime) / total_time * 100',
      'error_rate': 'error_count / total_requests * 100',
      'task_completion': 'completed_tasks / total_tasks * 100',
      'user_satisfaction': 'sum(ratings) / count(ratings)'
    };
    return formulas[metricName] || 'custom_measurement';
  }

  private getFrequency(metricName: string): "daily" | "weekly" | "monthly" | "continuous" {
    if (metricName.includes('time') || metricName.includes('rate')) {
      return 'continuous';
    } else if (metricName.includes('satisfaction')) {
      return 'monthly';
    } else {
      return 'daily';
    }
  }