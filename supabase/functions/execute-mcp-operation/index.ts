import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MCPOperationRequest {
  project_id: string;
  operation_type: string;
  phase?: string;
  input_data?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestBody: MCPOperationRequest = await req.json();
    const { project_id, operation_type, phase, input_data } = requestBody;

    if (!project_id || !operation_type) {
      throw new Error('Missing required fields: project_id and operation_type');
    }

    const operationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('mcp_operations')
      .insert({
        id: operationId,
        project_id,
        operation_type,
        phase: phase || null,
        input_data: input_data || {},
        status: 'pending',
        triggered_by: user.id,
        created_at: now,
      });

    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from('mcp_operations')
      .update({
        status: 'running',
        started_at: now,
      })
      .eq('id', operationId);

    if (updateError) {
      console.error('Error updating operation status:', updateError);
    }

    let result: any = {};
    let success = true;
    let errorMessage = null;

    try {
      result = await simulateMCPOperation(operation_type, phase, input_data);
    } catch (error: any) {
      success = false;
      errorMessage = error.message || 'MCP operation failed';
      console.error('MCP operation error:', error);
    }

    const completedAt = new Date().toISOString();
    const { error: completeError } = await supabase
      .from('mcp_operations')
      .update({
        status: success ? 'completed' : 'failed',
        output_data: result,
        completed_at: completedAt,
        error_message: errorMessage,
      })
      .eq('id', operationId);

    if (completeError) {
      console.error('Error completing operation:', completeError);
    }

    if (result.subagents && Array.isArray(result.subagents)) {
      for (const agent of result.subagents) {
        await supabase.from('subagent_executions').insert({
          mcp_operation_id: operationId,
          project_id,
          agent_type: agent.type,
          agent_role: agent.role,
          phase: phase || 'DEFINE',
          task_description: agent.task,
          capabilities: agent.capabilities || [],
          status: 'queued',
          input_data: agent.input || {},
        });
      }
    }

    if (result.artifacts && Array.isArray(result.artifacts)) {
      for (const artifact of result.artifacts) {
        await supabase.from('mcp_artifacts').insert({
          mcp_operation_id: operationId,
          project_id,
          artifact_type: artifact.type,
          artifact_name: artifact.name,
          artifact_data: artifact.data,
          phase: phase || 'DEFINE',
          created_by_agent: artifact.created_by,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success,
        operation_id: operationId,
        result,
        error: errorMessage,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function simulateMCPOperation(
  operationType: string,
  phase?: string,
  inputData?: any
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const phaseSpecificData: Record<string, any> = {
    DEFINE: {
      voc_analysis: {
        functional: inputData?.requirements?.filter((r: string) => !r.toLowerCase().includes('performance')) || [],
        non_functional: inputData?.requirements?.filter((r: string) => r.toLowerCase().includes('performance')) || [],
        critical: inputData?.requirements?.slice(0, 3) || [],
      },
      ctq_tree: {
        performance: { response_time: { target: 200, usl: 500, unit: 'ms' } },
        reliability: { uptime: { target: 99.9, usl: 100, unit: '%' } },
      },
      subagents: [
        {
          type: 'market-research-analyst',
          role: 'Analyzes market needs and requirements',
          task: 'Analyze competitive landscape and user needs',
          capabilities: ['market analysis', 'competitor research', 'user demographics'],
        },
        {
          type: 'technical-feasibility-analyst',
          role: 'Assesses technical viability',
          task: 'Evaluate technical constraints and risks',
          capabilities: ['technology evaluation', 'architecture assessment', 'risk analysis'],
        },
      ],
      artifacts: [
        { type: 'voc_analysis', name: 'Voice of Customer Analysis', data: {}, created_by: 'define-agent' },
        { type: 'ctq_tree', name: 'Critical to Quality Tree', data: {}, created_by: 'define-agent' },
      ],
    },
    MEASURE: {
      kpis: [
        { name: 'API Response Time', target: 200, unit: 'ms', current_value: 350 },
        { name: 'System Uptime', target: 99.9, unit: '%', current_value: 98.5 },
      ],
      baselines: {
        performance_score: Math.floor(Math.random() * 30) + 50,
        reliability_score: Math.floor(Math.random() * 20) + 60,
      },
      subagents: [
        {
          type: 'performance-test-engineer',
          role: 'Conducts performance testing',
          task: 'Run load tests and benchmarks',
          capabilities: ['load testing', 'stress testing', 'performance metrics'],
        },
      ],
    },
    ANALYZE: {
      root_causes: [
        { issue: 'Slow response times', cause: 'Inefficient database queries', impact: 'HIGH' },
        { issue: 'High error rate', cause: 'Insufficient input validation', impact: 'MEDIUM' },
      ],
      fmea: [
        { mode: 'Database timeout', severity: 8, occurrence: 4, detection: 6, rpn: 192 },
        { mode: 'API endpoint failure', severity: 7, occurrence: 3, detection: 4, rpn: 84 },
      ],
      subagents: [
        {
          type: 'bug-triage-specialist',
          role: 'Identifies and categorizes bugs',
          task: 'Analyze codebase for defects',
          capabilities: ['bug analysis', 'root cause', 'severity assessment'],
        },
        {
          type: 'performance-optimization-specialist',
          role: 'Identifies bottlenecks',
          task: 'Profile application performance',
          capabilities: ['profiling', 'optimization opportunities', 'resource analysis'],
        },
      ],
    },
    IMPROVE: {
      solutions: [
        {
          title: 'Database Query Optimization',
          description: 'Add indexes and optimize N+1 queries',
          impact_score: 8,
          effort_score: 4,
          expected_improvement: '40%',
        },
      ],
      subagents: [
        {
          type: 'backend-api-developer',
          role: 'Implements backend improvements',
          task: 'Optimize API endpoints and database queries',
          capabilities: ['API development', 'business logic', 'middleware'],
        },
      ],
    },
    CONTROL: {
      control_plans: [
        { name: 'Response Time Monitoring', type: 'X-bar R', frequency: 'Hourly' },
        { name: 'Error Rate Tracking', type: 'P-chart', frequency: 'Daily' },
      ],
      monitoring: {
        tools: ['Prometheus', 'Grafana', 'PagerDuty'],
        alerts: ['High response time', 'Service down', 'High error rate'],
      },
      subagents: [
        {
          type: 'devops-pipeline-engineer',
          role: 'Sets up CI/CD pipelines',
          task: 'Configure deployment automation and quality gates',
          capabilities: ['pipeline configuration', 'automated deployment', 'quality gates'],
        },
      ],
    },
  };

  return phaseSpecificData[phase || 'DEFINE'] || { message: 'Operation completed successfully' };
}
