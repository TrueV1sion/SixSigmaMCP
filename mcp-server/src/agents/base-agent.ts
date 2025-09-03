// Base Agent class for Six Sigma MCP agents

import { SharedResourceManager } from '../shared/resource-manager.js';
import { ProjectState } from '../types/index.js';

export abstract class BaseAgent {
  protected resourceManager: SharedResourceManager;
  protected agentId: string;

  constructor(agentId: string, resourceManager: SharedResourceManager) {
    this.agentId = agentId;
    this.resourceManager = resourceManager;
  }

  protected async getProjectState(projectId: string): Promise<ProjectState | undefined> {
    return await this.resourceManager.getResource(this.agentId, `${projectId}_state`);
  }

  protected async updateProjectState(projectId: string, state: ProjectState): Promise<void> {
    await this.resourceManager.updateResource(this.agentId, `${projectId}_state`, state);
  }

  protected async getProjectResource(projectId: string, resourceKey: string): Promise<any> {
    return await this.resourceManager.getResource(this.agentId, `${projectId}_${resourceKey}`);
  }

  protected async updateProjectResource(
    projectId: string, 
    resourceKey: string, 
    value: any
  ): Promise<void> {
    await this.resourceManager.updateResource(
      this.agentId, 
      `${projectId}_${resourceKey}`, 
      value
    );
  }

  abstract async execute(projectId: string, args?: any): Promise<any>;
}