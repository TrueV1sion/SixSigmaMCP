import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Project {
  id: string;
  name: string;
  business_case: string;
  deployment_target: string;
  budget_limit: number;
  timeline_days: number;
  current_phase: 'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL' | 'COMPLETED';
  quality_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  phase_completion: number;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: string;
  project_id: string;
  requirement: string;
  category: 'functional' | 'non-functional';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CTQItem {
  id: string;
  project_id: string;
  need: string;
  driver: string;
  ctq: string;
  target: number;
  usl: number;
}

export interface Constraint {
  id: string;
  project_id: string;
  type: 'technical' | 'business' | 'regulatory' | 'resource';
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface KPI {
  id: string;
  project_id: string;
  name: string;
  description: string;
  target: number;
  current_value: number;
  unit: string;
}

export interface FMEAItem {
  id: string;
  project_id: string;
  failure_mode: string;
  effects: string;
  causes: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
}

export interface Solution {
  id: string;
  project_id: string;
  title: string;
  description: string;
  approach: 'incremental' | 'redesign' | 'innovative';
  impact_score: number;
  effort_score: number;
  risk_score: number;
  cost_score: number;
  total_score: number;
  status: 'proposed' | 'approved' | 'implemented';
}
