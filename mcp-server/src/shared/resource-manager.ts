// Shared Resource Manager for Six Sigma MCP
// Manages shared state between agents with access control

import { ProjectState, PhaseArtifacts } from '../types/index.js';

export interface ResourcePermissions {
  read: string[];
  write: string[];
}

export interface ResourceUpdate {
  resource_key: string;
  value: any;
  updated_by: string;
  timestamp: string;
  version: number;
}

export class SharedResourceManager {
  private resources: Map<string, any> = new Map();
  private permissions: Map<string, ResourcePermissions> = new Map();
  private updateHistory: ResourceUpdate[] = [];
  private resourceVersions: Map<string, number> = new Map();

  constructor() {
    this.initializePermissions();
  }

  private initializePermissions() {
    // Define agent permissions
    this.permissions.set('orchestrator', {
      read: ['*'],
      write: ['project_state', 'phase_transitions', 'quality_decisions']
    });
    this.permissions.set('define-agent', {
      read: ['project_state'],
      write: ['requirements', 'ctq_tree', 'constraints', 'sipoc_diagram', 'project_charter']
    });

    this.permissions.set('measure-agent', {
      read: ['project_state', 'requirements', 'ctq_tree'],
      write: ['kpis', 'baselines', 'measurement_plan', 'data_collection_plan']
    });

    this.permissions.set('analyze-agent', {
      read: ['project_state', 'requirements', 'ctq_tree', 'kpis', 'baselines'],
      write: ['root_cause_analysis', 'fmea', 'statistical_analysis', 'process_map']
    });

    this.permissions.set('improve-agent', {
      read: ['project_state', 'requirements', 'constraints', 'root_cause_analysis', 'fmea'],
      write: ['solution_design', 'pilot_results', 'implementation_plan', 'code_artifacts']
    });

    this.permissions.set('control-agent', {
      read: ['project_state', 'solution_design', 'implementation_plan', 'kpis'],
      write: ['control_plan', 'monitoring_dashboard', 'sop_documents', 'training_materials']
    });
  }

  async getResource(agentId: string, resourceKey: string): Promise<any> {
    const perms = this.permissions.get(agentId);
    if (!perms) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    // Check read permissions
    if (!perms.read.includes('*') && !perms.read.includes(resourceKey)) {
      throw new Error(`Agent ${agentId} does not have read access to ${resourceKey}`);
    }

    return this.resources.get(resourceKey);
  }

  async updateResource(agentId: string, resourceKey: string, value: any): Promise<void> {
    const perms = this.permissions.get(agentId);
    if (!perms) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Check write permissions
    if (!perms.write.includes('*') && !perms.write.includes(resourceKey)) {
      throw new Error(`Agent ${agentId} does not have write access to ${resourceKey}`);
    }

    // Update version
    const currentVersion = this.resourceVersions.get(resourceKey) || 0;
    const newVersion = currentVersion + 1;
    this.resourceVersions.set(resourceKey, newVersion);

    // Store update history
    this.updateHistory.push({
      resource_key: resourceKey,
      value: value,
      updated_by: agentId,
      timestamp: new Date().toISOString(),
      version: newVersion
    });
    // Update resource
    this.resources.set(resourceKey, value);
  }

  async getProjectResources(projectId: string): Promise<Record<string, any>> {
    const projectResources: Record<string, any> = {};
    
    for (const [key, value] of this.resources.entries()) {
      if (key.startsWith(projectId)) {
        projectResources[key] = value;
      }
    }
    
    return projectResources;
  }

  getUpdateHistory(resourceKey?: string): ResourceUpdate[] {
    if (resourceKey) {
      return this.updateHistory.filter(update => update.resource_key === resourceKey);
    }
    return this.updateHistory;
  }

  clearProjectResources(projectId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.resources.keys()) {
      if (key.startsWith(projectId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.resources.delete(key));
  }
}