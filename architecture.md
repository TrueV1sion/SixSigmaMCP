# Six Sigma MCP Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SIX SIGMA ORCHESTRATOR                        │
│                     (Master Black Belt Agent)                        │
└─────────────────┬───────────────────────────────┬───────────────────┘
                  │                               │
                  │    DMAIC Phase Management     │
                  │                               │
┌─────────────────▼─────────────────┐ ┌──────────▼──────────────────┐
│         DEFINE AGENT              │ │       MEASURE AGENT         │
│   • Voice of Customer Analysis    │ │   • KPI Definition          │
│   • CTQ Tree Generation          │ │   • Baseline Establishment  │
│   • Constraint Documentation     │ │   • Measurement System      │
└───────────────────────────────────┘ └─────────────────────────────┘
                  │                               │
┌─────────────────▼─────────────────┐ ┌──────────▼──────────────────┐
│        ANALYZE AGENT              │ │       IMPROVE AGENT         │
│   • Root Cause Analysis          │ │   • Claude Code Generation  │
│   • FMEA                         │ │   • Poka-Yoke Implementation│
│   • Statistical Analysis         │ │   • Solution Validation     │
└───────────────────────────────────┘ └─────────────────────────────┘
                  │                               │
                  └──────────────┬────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                         CONTROL AGENT                               │
│     • Quality Gate Enforcement    • Production Monitoring           │
│     • Deployment Validation       • Control Charts                  │
└─────────────────────────────────────────────────────────────────────┘

## Communication Flow

1. **Orchestrator** initiates project and manages phase transitions
2. **Define Agent** establishes requirements and constraints
3. **Measure Agent** sets baselines and metrics
4. **Analyze Agent** identifies root causes and risks
5. **Improve Agent** generates solutions using Claude
6. **Control Agent** validates and monitors deployment

## Shared Resources

All agents share access to:
- Project State
- CTQ Tree
- Constraints
- Metrics
- Quality Gate Results
```