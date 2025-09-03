# Six Sigma MCP Usage Examples

## Example 1: E-commerce Platform

```
User: Create a Six Sigma project for building an e-commerce platform

Claude: [Uses create_project tool]

User: Run the define phase for proj_123456

Claude: [Uses define_phase tool - generates VOC, CTQ tree, constraints]

User: Continue with the measure phase

Claude: [Uses measure_phase tool - establishes KPIs and baselines]

... continues through all phases
```

## Example 2: Payment Processing System

```
User: I need to build a payment system with 99.99% reliability using Six Sigma methodology

Claude: I'll help you create a Six Sigma project for your payment system. Let me start by initializing the project with your reliability requirement.

[Uses create_project with:
- project_name: "High-Reliability Payment System"
- business_case: "Build payment processing with 99.99% uptime"
- requirements: ["99.99% reliability", "PCI compliance", "< 2s transaction time"]
- deployment_target: "AWS"
- budget_limit: 500]

User: Great! Now analyze what could go wrong

Claude: [Uses analyze_phase to run FMEA and identify failure modes]
```

## Example 3: Mobile App Development

```
User: Help me use Six Sigma to ensure quality in my mobile app development

Claude: [Guides through each DMAIC phase with mobile-specific considerations]
```