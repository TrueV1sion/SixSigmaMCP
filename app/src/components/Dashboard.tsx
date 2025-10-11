import { useState, useEffect } from 'react';
import { supabase, type Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  AlertCircle,
  Target,
  CheckCircle,
  Clock,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  average_quality_score: number;
  high_risk_projects: number;
  projects_on_track: number;
  recent_activity_count: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    average_quality_score: 0,
    high_risk_projects: 0,
    projects_on_track: 0,
    recent_activity_count: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      loadDashboardData();

      const subscription = supabase
        .channel('dashboard-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects',
        }, () => {
          loadDashboardData();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadDashboardData = async () => {
    setLoading(true);

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
      return;
    }

    const projectList = projects || [];

    const dashboardMetrics: DashboardMetrics = {
      total_projects: projectList.length,
      active_projects: projectList.filter(
        (p) => p.current_phase !== 'COMPLETED'
      ).length,
      completed_projects: projectList.filter(
        (p) => p.current_phase === 'COMPLETED'
      ).length,
      average_quality_score:
        projectList.length > 0
          ? projectList.reduce((sum, p) => sum + p.quality_score, 0) /
            projectList.length
          : 0,
      high_risk_projects: projectList.filter((p) => p.risk_level === 'HIGH')
        .length,
      projects_on_track: projectList.filter(
        (p) => p.quality_score >= 70 && p.risk_level !== 'HIGH'
      ).length,
      recent_activity_count: projectList.filter((p) => {
        const updatedAt = new Date(p.updated_at);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return updatedAt > dayAgo;
      }).length,
    };

    setMetrics(dashboardMetrics);
    setRecentProjects(projectList.slice(0, 5));
    setLoading(false);
  };

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      DEFINE: 'bg-blue-100 text-blue-700',
      MEASURE: 'bg-purple-100 text-purple-700',
      ANALYZE: 'bg-yellow-100 text-yellow-700',
      IMPROVE: 'bg-orange-100 text-orange-700',
      CONTROL: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-slate-100 text-slate-700',
    };
    return colors[phase] || colors.DEFINE;
  };

  const getRiskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      LOW: 'bg-green-100 text-green-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      HIGH: 'bg-red-100 text-red-700',
    };
    return styles[risk] || styles.LOW;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h2>
        <p className="text-slate-600">
          Overview of your Six Sigma projects and quality metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {metrics.total_projects}
              </div>
              <div className="text-sm text-slate-600">Total Projects</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">
              {metrics.active_projects} active
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {metrics.completed_projects} completed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {metrics.average_quality_score.toFixed(0)}%
              </div>
              <div className="text-sm text-slate-600">Avg Quality Score</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {metrics.average_quality_score >= 70 ? (
              <>
                <ArrowUp size={16} className="text-green-600" />
                <span className="text-green-600 font-medium">On track</span>
              </>
            ) : (
              <>
                <ArrowDown size={16} className="text-orange-600" />
                <span className="text-orange-600 font-medium">
                  Needs attention
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {metrics.high_risk_projects}
              </div>
              <div className="text-sm text-slate-600">High Risk</div>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {metrics.high_risk_projects > 0
              ? 'Requires immediate attention'
              : 'All projects low risk'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {metrics.recent_activity_count}
              </div>
              <div className="text-sm text-slate-600">Active Today</div>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Projects with recent updates
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Projects
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target size={48} className="mx-auto mb-2 text-slate-300" />
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-slate-900">
                      {project.name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(
                        project.current_phase
                      )}`}
                    >
                      {project.current_phase}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadge(
                        project.risk_level
                      )}`}
                    >
                      {project.risk_level} Risk
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                    {project.business_case}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        Updated{' '}
                        {formatDistanceToNow(new Date(project.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target size={14} />
                      <span>{project.phase_completion.toFixed(0)}% complete</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {project.quality_score.toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-600">Quality</div>
                  </div>
                  {project.current_phase !== 'COMPLETED' ? (
                    <div className="w-16 h-16 relative">
                      <svg className="transform -rotate-90 w-16 h-16">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-slate-200"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={`${
                            (project.phase_completion / 100) * 175.93
                          } 175.93`}
                          className="text-blue-600"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-900">
                          {project.phase_completion.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
