import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Cpu,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MCPOperation {
  id: string;
  project_id: string;
  operation_type: string;
  phase: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  project: {
    name: string;
  };
}

interface SubagentExecution {
  id: string;
  mcp_operation_id: string;
  agent_type: string;
  agent_role: string;
  phase: string;
  task_description: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface Props {
  projectId?: string;
}

export default function SubagentMonitor({ projectId }: Props) {
  const [operations, setOperations] = useState<MCPOperation[]>([]);
  const [subagents, setSubagents] = useState<SubagentExecution[]>([]);
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'operations' | 'subagents'>(
    'operations'
  );

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('mcp-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mcp_operations',
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subagent_executions',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);

    let opsQuery = supabase
      .from('mcp_operations')
      .select('*, project:projects(name)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (projectId) {
      opsQuery = opsQuery.eq('project_id', projectId);
    }

    const { data: opsData, error: opsError } = await opsQuery;

    if (opsError) {
      console.error('Error loading operations:', opsError);
    } else {
      setOperations(opsData || []);
    }

    let subagentsQuery = supabase
      .from('subagent_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (projectId) {
      subagentsQuery = subagentsQuery.eq('project_id', projectId);
    }

    const { data: subagentsData, error: subagentsError } =
      await subagentsQuery;

    if (subagentsError) {
      console.error('Error loading subagents:', subagentsError);
    } else {
      setSubagents(subagentsData || []);
    }

    setLoading(false);
  };

  const toggleExpanded = (opId: string) => {
    const newExpanded = new Set(expandedOps);
    if (newExpanded.has(opId)) {
      newExpanded.delete(opId);
    } else {
      newExpanded.add(opId);
    }
    setExpandedOps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'failed':
        return <XCircle size={20} className="text-red-600" />;
      case 'running':
        return <Loader2 size={20} className="text-blue-600 animate-spin" />;
      case 'pending':
      case 'queued':
        return <Clock size={20} className="text-yellow-600" />;
      default:
        return <Activity size={20} className="text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      queued: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-slate-100 text-slate-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  const getAgentIcon = (agentType: string) => {
    const icon = agentType.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
        {icon}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          MCP Operations Monitor
        </h2>
        <p className="text-slate-600">
          Track Six Sigma MCP server operations and subagent executions
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'operations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={18} />
            MCP Operations ({operations.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subagents')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'subagents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu size={18} />
            Subagent Executions ({subagents.length})
          </div>
        </button>
      </div>

      {activeTab === 'operations' && (
        <div className="space-y-4">
          {operations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Activity size={48} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">No MCP operations yet</p>
            </div>
          ) : (
            operations.map((op) => {
              const isExpanded = expandedOps.has(op.id);
              const relatedSubagents = subagents.filter(
                (s) => s.mcp_operation_id === op.id
              );

              return (
                <div
                  key={op.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getStatusIcon(op.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {op.operation_type.replace(/_/g, ' ').toUpperCase()}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                                op.status
                              )}`}
                            >
                              {op.status}
                            </span>
                            {op.phase && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {op.phase}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            Project: {op.project?.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>
                              Created{' '}
                              {formatDistanceToNow(new Date(op.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {op.completed_at && op.started_at && (
                              <span>
                                Duration:{' '}
                                {(
                                  (new Date(op.completed_at).getTime() -
                                    new Date(op.started_at).getTime()) /
                                  1000
                                ).toFixed(2)}
                                s
                              </span>
                            )}
                            {relatedSubagents.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Cpu size={12} />
                                {relatedSubagents.length} subagents
                              </span>
                            )}
                          </div>
                          {op.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              {op.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      {relatedSubagents.length > 0 && (
                        <button
                          onClick={() => toggleExpanded(op.id)}
                          className="p-2 hover:bg-slate-100 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-slate-600" />
                          ) : (
                            <ChevronRight size={20} className="text-slate-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && relatedSubagents.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">
                        Subagent Executions
                      </h4>
                      <div className="space-y-2">
                        {relatedSubagents.map((subagent) => (
                          <div
                            key={subagent.id}
                            className="bg-white rounded-lg p-3 border border-slate-200"
                          >
                            <div className="flex items-center gap-3">
                              {getAgentIcon(subagent.agent_type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-slate-900">
                                    {subagent.agent_type.replace(/-/g, ' ')}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(
                                      subagent.status
                                    )}`}
                                  >
                                    {subagent.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mb-1">
                                  {subagent.task_description}
                                </p>
                                {subagent.duration_ms && (
                                  <p className="text-xs text-slate-500">
                                    Duration: {(subagent.duration_ms / 1000).toFixed(2)}s
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'subagents' && (
        <div className="space-y-4">
          {subagents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Cpu size={48} className="mx-auto mb-2 text-slate-300" />
              <p className="text-slate-500">No subagent executions yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {subagents.map((subagent) => (
                <div
                  key={subagent.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {getAgentIcon(subagent.agent_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-slate-900">
                          {subagent.agent_type.replace(/-/g, ' ')}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(
                            subagent.status
                          )}`}
                        >
                          {subagent.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        {subagent.agent_role}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">
                    {subagent.task_description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <PlayCircle size={12} />
                      {subagent.phase}
                    </span>
                    {subagent.duration_ms ? (
                      <span>{(subagent.duration_ms / 1000).toFixed(2)}s</span>
                    ) : (
                      <span>
                        {formatDistanceToNow(new Date(subagent.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
