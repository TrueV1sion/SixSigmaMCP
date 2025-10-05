# Six Sigma DMAIC Web Application

A comprehensive web-based project management system implementing the Six Sigma DMAIC (Define, Measure, Analyze, Improve, Control) methodology for quality-driven project execution.

## Features

### Complete DMAIC Implementation
- **Define Phase**: Voice of Customer analysis, CTQ tree generation, and constraint documentation
- **Measure Phase**: KPI definition, baseline establishment, and performance tracking
- **Analyze Phase**: Failure Mode Effects Analysis (FMEA) with Risk Priority Number calculations
- **Improve Phase**: Solution generation, evaluation, and approval workflow
- **Control Phase**: Monitoring setup, documentation, validation, and deployment readiness

### Project Management
- Create and manage multiple Six Sigma projects
- Real-time quality scoring and risk assessment
- Visual progress tracking through DMAIC phases
- Comprehensive project dashboards with metrics

### Quality Metrics
- Quality score calculation (0-100%)
- Risk level assessment (LOW/MEDIUM/HIGH)
- Phase completion tracking
- KPI performance monitoring

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Installation

1. Navigate to the app directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage Guide

### Creating a Project

1. Click the "New Project" button in the header
2. Fill in project details:
   - Project name
   - Business case
   - Deployment target
   - Budget limit
   - Timeline
   - Initial requirements
3. Click "Create Project"

### Working Through DMAIC Phases

#### Define Phase
- Add requirements categorized by type and priority
- Create CTQ (Critical to Quality) items with targets and specifications
- Document constraints (technical, business, regulatory, resource)
- Complete all sections to proceed to Measure phase

#### Measure Phase
- Define Key Performance Indicators (KPIs)
- Set target values and units
- Track current baseline measurements
- Update KPI values as measurements are taken
- Add at least 3 KPIs to proceed to Analyze phase

#### Analyze Phase
- Conduct Failure Mode Effects Analysis (FMEA)
- Rate failure modes on Severity, Occurrence, and Detection (1-10 scale)
- System automatically calculates Risk Priority Numbers (RPN)
- Risk items are color-coded: Critical (>300), High (>150), Medium (>80), Low (<80)
- Add at least 2 FMEA items to proceed to Improve phase

#### Improve Phase
- Generate improvement solutions
- Choose approach: Incremental, Redesign, or Innovative
- Score solutions on Impact, Effort, Risk, and Cost
- System calculates total score for prioritization
- Approve solutions for implementation
- At least one approved solution required to proceed to Control phase

#### Control Phase
- Set up monitoring systems
- Complete documentation (SOPs, knowledge base)
- Execute validation testing
- Conduct team training
- Complete all control items to close the project

### Project Dashboard

The dashboard shows:
- Overall quality score
- Current risk level
- Phase completion percentage
- Project timeline
- Deployment target and budget

## Database Schema

The application uses the following tables:
- `projects` - Core project information
- `requirements` - Project requirements from VOC
- `ctq_items` - Critical to Quality characteristics
- `constraints` - Project constraints
- `kpis` - Key Performance Indicators
- `fmea_items` - Failure Mode Effects Analysis
- `solutions` - Improvement solutions
- `phase_artifacts` - Phase-specific artifacts (JSON)

All tables include Row Level Security (RLS) for data protection.
