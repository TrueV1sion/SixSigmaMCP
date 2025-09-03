// Type definitions for Six Sigma MCP

export enum DMAICPhase {
  DEFINE = "DEFINE",
  MEASURE = "MEASURE",
  ANALYZE = "ANALYZE",
  IMPROVE = "IMPROVE",
  CONTROL = "CONTROL",
  COMPLETE = "COMPLETE"
}

export interface ProjectState {
  id: string;
  name: string;
  business_case: string;
  requirements: string[];
  deployment_target: string;
  budget_limit: number;
  timeline_days: number;
  created_at: string;
  current_phase: DMAICPhase;
  artifacts: PhaseArtifacts;
  metrics: ProjectMetrics;
  quality_gates: QualityGateResults;
}

export interface PhaseArtifacts {
  define?: DefineArtifacts;
  measure?: MeasureArtifacts;
  analyze?: AnalyzeArtifacts;
  improve?: ImproveArtifacts;
  control?: ControlArtifacts;
}
export interface DefineArtifacts {
  voc_analysis: VOCAnalysis;
  ctq_tree: CTQTree;
  constraints: ProjectConstraints;
  sipoc_diagram: SIPOCDiagram;
  project_charter: ProjectCharter;
}

export interface VOCAnalysis {
  customer_needs: string[];
  functional_requirements: string[];
  non_functional_requirements: string[];
  priority_matrix: {
    must_have: string[];
    should_have: string[];
    nice_to_have: string[];
  };
}

export interface CTQTree {
  customer_needs: {
    [need: string]: {
      drivers: string[];
      metrics: CTQMetric[];
    };
  };
}

export interface CTQMetric {
  name: string;
  description: string;
  target_value: number;
  upper_spec_limit: number;
  lower_spec_limit?: number;
  unit: string;
}
export interface ProjectConstraints {
  technical: {
    framework?: string;
    language?: string;
    dependencies?: string[];
    compatibility?: string[];
  };
  deployment: {
    platform: string;
    infrastructure?: string;
    regions?: string[];
  };
  budget: {
    monthly_limit: number;
    total_limit?: number;
    cost_breakdown?: Record<string, number>;
  };
  timeline: {
    total_days: number;
    phase_deadlines?: Record<DMAICPhase, string>;
  };
}

export interface SIPOCDiagram {
  suppliers: string[];
  inputs: string[];
  process: string[];
  outputs: string[];
  customers: string[];
}

export interface ProjectCharter {
  problem_statement: string;
  goal_statement: string;
  scope: string;
  deliverables: string[];
  stakeholders: Stakeholder[];
}
export interface Stakeholder {
  name: string;
  role: string;
  interest: "high" | "medium" | "low";
  influence: "high" | "medium" | "low";
}

export interface MeasureArtifacts {
  kpis: KPI[];
  baselines: Baseline[];
  measurement_plan: MeasurementPlan;
  data_collection_plan: DataCollectionPlan;
}

export interface KPI {
  name: string;
  description: string;
  formula: string;
  target: number;
  current: number;
  unit: string;
  frequency: "daily" | "weekly" | "monthly" | "continuous";
}

export interface Baseline {
  metric_name: string;
  baseline_value: number;
  measurement_date: string;
  sample_size: number;
  confidence_interval?: [number, number];
}

export interface MeasurementPlan {
  metrics: string[];
  methods: Record<string, string>;
  tools: string[];
  responsible_parties: Record<string, string>;
}
export interface DataCollectionPlan {
  data_sources: string[];
  collection_methods: string[];
  sampling_strategy: string;
  schedule: string;
}

export interface AnalyzeArtifacts {
  root_cause_analysis: RootCauseAnalysis;
  fmea: FMEA;
  statistical_analysis: StatisticalAnalysis;
  process_map: ProcessMap;
}

export interface RootCauseAnalysis {
  problem_description: string;
  fishbone_categories: Record<string, string[]>;
  five_whys: FiveWhys[];
  root_causes: RootCause[];
}

export interface FiveWhys {
  issue: string;
  why_chain: string[];
  root_cause: string;
}

export interface RootCause {
  cause: string;
  impact: "high" | "medium" | "low";
  likelihood: "high" | "medium" | "low";
  evidence: string[];
}
export interface FMEA {
  failure_modes: FailureMode[];
  total_rpn: number;
  high_risk_count: number;
}

export interface FailureMode {
  process_step: string;
  failure_mode: string;
  failure_effects: string[];
  severity: number; // 1-10
  causes: string[];
  occurrence: number; // 1-10
  current_controls: string[];
  detection: number; // 1-10
  rpn: number; // Risk Priority Number = S * O * D
  recommended_actions: string[];
}

export interface StatisticalAnalysis {
  descriptive_stats: Record<string, DescriptiveStats>;
  correlation_matrix?: Record<string, Record<string, number>>;
  hypothesis_tests?: HypothesisTest[];
}

export interface DescriptiveStats {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  sample_size: number;
}
export interface HypothesisTest {
  test_name: string;
  null_hypothesis: string;
  alternative_hypothesis: string;
  test_statistic: number;
  p_value: number;
  significance_level: number;
  result: "reject_null" | "fail_to_reject";
}

export interface ProcessMap {
  steps: ProcessStep[];
  cycle_time: number;
  value_add_time: number;
  efficiency: number;
}

export interface ProcessStep {
  id: string;
  name: string;
  type: "value_add" | "non_value_add" | "necessary_non_value_add";
  duration: number;
  inputs: string[];
  outputs: string[];
  issues?: string[];
}

export interface ImproveArtifacts {
  solution_design: SolutionDesign;
  pilot_results?: PilotResults;
  implementation_plan: ImplementationPlan;
  code_artifacts?: CodeArtifacts;
}
export interface SolutionDesign {
  approach: string;
  architecture: string;
  components: Component[];
  poka_yoke_measures: PokayokeMeasure[];
  quality_constraints: QualityConstraint[];
}

export interface Component {
  name: string;
  description: string;
  technology: string;
  interfaces: string[];
}

export interface PokayokeMeasure {
  name: string;
  type: "prevention" | "detection";
  description: string;
  implementation: string;
}

export interface QualityConstraint {
  constraint: string;
  validation_method: string;
  threshold: number;
  unit: string;
}

export interface PilotResults {
  pilot_scope: string;
  duration_days: number;
  metrics_improvement: Record<string, number>;
  issues_found: string[];
  lessons_learned: string[];
}
export interface ImplementationPlan {
  phases: ImplementationPhase[];
  rollback_plan: string;
  risk_mitigation: Record<string, string>;
}

export interface ImplementationPhase {
  name: string;
  duration_days: number;
  activities: string[];
  success_criteria: string[];
}

export interface CodeArtifacts {
  repository_url?: string;
  main_files: string[];
  test_coverage: number;
  quality_metrics: CodeQualityMetrics;
}

export interface CodeQualityMetrics {
  complexity: number;
  maintainability_index: number;
  technical_debt_ratio: number;
  security_issues: number;
}

export interface ControlArtifacts {
  control_plan: ControlPlan;
  monitoring_dashboard: MonitoringDashboard;
  sop_documents: SOPDocument[];
  training_materials: TrainingMaterial[];
}
export interface ControlPlan {
  control_points: ControlPoint[];
  response_plans: Record<string, string>;
  review_frequency: string;
}

export interface ControlPoint {
  metric: string;
  control_method: string;
  control_limits: {
    upper: number;
    lower: number;
  };
  measurement_frequency: string;
  responsible_party: string;
}

export interface MonitoringDashboard {
  url?: string;
  metrics_displayed: string[];
  refresh_rate: string;
  alerts_configured: Alert[];
}

export interface Alert {
  name: string;
  condition: string;
  threshold: number;
  notification_channel: string;
}

export interface SOPDocument {
  title: string;
  version: string;
  content: string;
  approval_date: string;
}
export interface TrainingMaterial {
  title: string;
  type: "video" | "document" | "workshop" | "online_course";
  duration_hours: number;
  target_audience: string[];
}

export interface ProjectMetrics {
  quality: QualityMetrics;
  performance: PerformanceMetrics;
  cost: CostMetrics;
  timeline: TimelineMetrics;
}

export interface QualityMetrics {
  defect_rate: number;
  first_pass_yield: number;
  customer_satisfaction: number;
  compliance_score: number;
}

export interface PerformanceMetrics {
  response_time_ms: number;
  throughput: number;
  availability_percent: number;
  error_rate: number;
}

export interface CostMetrics {
  monthly_cost: number;
  cost_per_transaction?: number;
  roi?: number;
  payback_period_months?: number;
}
export interface TimelineMetrics {
  phase_durations: Record<DMAICPhase, number>;
  total_elapsed_days: number;
  schedule_variance_days: number;
  milestone_completion_rate: number;
}

export interface QualityGateResults {
  define_to_measure?: QualityGateResult;
  measure_to_analyze?: QualityGateResult;
  analyze_to_improve?: QualityGateResult;
  improve_to_control?: QualityGateResult;
  control_to_complete?: QualityGateResult;
}

export interface QualityGateResult {
  passed: boolean;
  evaluation_date: string;
  criteria_results: CriteriaResult[];
  overall_score: number;
  notes?: string;
}

export interface CriteriaResult {
  criterion: string;
  passed: boolean;
  actual_value?: any;
  expected_value?: any;
  evidence?: string;
}