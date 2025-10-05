/*
  # Six Sigma DMAIC Project Management System

  ## Overview
  This migration creates the database schema for a Six Sigma DMAIC methodology
  project management system with complete phase tracking and quality metrics.

  ## New Tables
  
  ### 1. `projects`
  Core project information and metadata
  - `id` (uuid, primary key) - Unique project identifier
  - `name` (text) - Project name
  - `business_case` (text) - Business justification
  - `deployment_target` (text) - Target platform/environment
  - `budget_limit` (numeric) - Monthly budget constraint
  - `timeline_days` (integer) - Expected timeline in days
  - `current_phase` (text) - Current DMAIC phase (DEFINE/MEASURE/ANALYZE/IMPROVE/CONTROL)
  - `quality_score` (numeric) - Overall quality score (0-100)
  - `risk_level` (text) - Risk assessment (LOW/MEDIUM/HIGH)
  - `phase_completion` (numeric) - Overall completion percentage
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `requirements`
  Project requirements from Voice of Customer
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key) - Links to projects table
  - `requirement` (text) - The requirement description
  - `category` (text) - Functional or non-functional
  - `priority` (text) - HIGH/MEDIUM/LOW
  - `created_at` (timestamptz)

  ### 3. `ctq_items`
  Critical to Quality tree items
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `need` (text) - Customer need
  - `driver` (text) - Quality driver
  - `ctq` (text) - Critical to Quality characteristic
  - `target` (numeric) - Target value
  - `usl` (numeric) - Upper specification limit
  - `created_at` (timestamptz)

  ### 4. `constraints`
  Project constraints documentation
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `type` (text) - Technical/business/regulatory/resource
  - `description` (text) - Constraint description
  - `impact` (text) - Impact level
  - `created_at` (timestamptz)

  ### 5. `kpis`
  Key Performance Indicators
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `name` (text) - KPI name
  - `description` (text) - KPI description
  - `target` (numeric) - Target value
  - `current_value` (numeric) - Current measured value
  - `unit` (text) - Unit of measurement
  - `created_at` (timestamptz)

  ### 6. `fmea_items`
  Failure Mode Effects Analysis
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `failure_mode` (text) - Description of failure
  - `effects` (text) - Effects of failure
  - `causes` (text) - Root causes
  - `severity` (integer) - Severity rating (1-10)
  - `occurrence` (integer) - Occurrence rating (1-10)
  - `detection` (integer) - Detection rating (1-10)
  - `rpn` (integer) - Risk Priority Number (severity × occurrence × detection)
  - `created_at` (timestamptz)

  ### 7. `solutions`
  Improvement solutions
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `title` (text) - Solution title
  - `description` (text) - Detailed description
  - `approach` (text) - incremental/redesign/innovative
  - `impact_score` (numeric) - Expected impact (0-10)
  - `effort_score` (numeric) - Required effort (0-10)
  - `risk_score` (numeric) - Risk level (0-10)
  - `cost_score` (numeric) - Cost level (0-10)
  - `total_score` (numeric) - Overall evaluation score
  - `status` (text) - proposed/approved/implemented
  - `created_at` (timestamptz)

  ### 8. `phase_artifacts`
  Store phase-specific artifacts as JSON
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `phase` (text) - DMAIC phase
  - `artifact_type` (text) - Type of artifact (voc_analysis, sipoc, etc.)
  - `data` (jsonb) - Artifact data
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public access policies for demo purposes (can be restricted for production)

  ## Notes
  - All timestamps use `timestamptz` for timezone awareness
  - Foreign keys ensure referential integrity
  - Indexes on foreign keys for query performance
  - RPN (Risk Priority Number) auto-calculated on insert/update
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_case text NOT NULL,
  deployment_target text DEFAULT 'cloud',
  budget_limit numeric DEFAULT 5000,
  timeline_days integer DEFAULT 90,
  current_phase text DEFAULT 'DEFINE' CHECK (current_phase IN ('DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL', 'COMPLETED')),
  quality_score numeric DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  risk_level text DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  phase_completion numeric DEFAULT 0 CHECK (phase_completion >= 0 AND phase_completion <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create requirements table
CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement text NOT NULL,
  category text DEFAULT 'functional' CHECK (category IN ('functional', 'non-functional')),
  priority text DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamptz DEFAULT now()
);

-- Create CTQ items table
CREATE TABLE IF NOT EXISTS ctq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  need text NOT NULL,
  driver text NOT NULL,
  ctq text NOT NULL,
  target numeric NOT NULL,
  usl numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create constraints table
CREATE TABLE IF NOT EXISTS constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('technical', 'business', 'regulatory', 'resource')),
  description text NOT NULL,
  impact text DEFAULT 'MEDIUM' CHECK (impact IN ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamptz DEFAULT now()
);

-- Create KPIs table
CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  target numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create FMEA items table
CREATE TABLE IF NOT EXISTS fmea_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  failure_mode text NOT NULL,
  effects text NOT NULL,
  causes text NOT NULL,
  severity integer NOT NULL CHECK (severity >= 1 AND severity <= 10),
  occurrence integer NOT NULL CHECK (occurrence >= 1 AND occurrence <= 10),
  detection integer NOT NULL CHECK (detection >= 1 AND detection <= 10),
  rpn integer GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
  created_at timestamptz DEFAULT now()
);

-- Create solutions table
CREATE TABLE IF NOT EXISTS solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  approach text DEFAULT 'incremental' CHECK (approach IN ('incremental', 'redesign', 'innovative')),
  impact_score numeric DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 10),
  effort_score numeric DEFAULT 0 CHECK (effort_score >= 0 AND effort_score <= 10),
  risk_score numeric DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 10),
  cost_score numeric DEFAULT 0 CHECK (cost_score >= 0 AND cost_score <= 10),
  total_score numeric DEFAULT 0,
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'implemented')),
  created_at timestamptz DEFAULT now()
);

-- Create phase artifacts table
CREATE TABLE IF NOT EXISTS phase_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL')),
  artifact_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_ctq_items_project_id ON ctq_items(project_id);
CREATE INDEX IF NOT EXISTS idx_constraints_project_id ON constraints(project_id);
CREATE INDEX IF NOT EXISTS idx_kpis_project_id ON kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_fmea_items_project_id ON fmea_items(project_id);
CREATE INDEX IF NOT EXISTS idx_solutions_project_id ON solutions(project_id);
CREATE INDEX IF NOT EXISTS idx_phase_artifacts_project_id ON phase_artifacts(project_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_artifacts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (can be tightened for production)
CREATE POLICY "Enable all access for projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for requirements"
  ON requirements FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for ctq_items"
  ON ctq_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for constraints"
  ON constraints FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for kpis"
  ON kpis FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for fmea_items"
  ON fmea_items FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for solutions"
  ON solutions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for phase_artifacts"
  ON phase_artifacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();