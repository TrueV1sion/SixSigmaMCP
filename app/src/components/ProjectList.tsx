import { type Project } from '../lib/supabase';
import { Clock, TrendingUp, CircleAlert as AlertCircle } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  loading: boolean;
}

export default function ProjectList({
  projects,
  selectedProject,
  onSelectProject,
  loading
}: ProjectListProps) {
  const getPhaseColor = (phase: string) => {
    const colors = {
      DEFINE: 'bg-blue-100 text-blue-700',
      MEASURE: 'bg-green-100 text-green-700',
      ANALYZE: 'bg-yellow-100 text-yellow-700',
      IMPROVE: 'bg-orange-100 text-orange-700',
      CONTROL: 'bg-purple-100 text-purple-700',
      COMPLETED: 'bg-gray-100 text-gray-700'
    };
    return colors[phase as keyof typeof colors] || colors.DEFINE;
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-red-600'
    };
    return colors[risk as keyof typeof colors] || colors.LOW;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Projects</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-slate-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Projects</h2>
        <div className="text-center py-8 text-slate-400">
          No projects yet. Create one to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Projects ({projects.length})
      </h2>
      <div className="space-y-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedProject?.id === project.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900 line-clamp-1">
                {project.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPhaseColor(project.current_phase)}`}>
                {project.current_phase}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <TrendingUp size={14} />
                <span>{project.quality_score.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{project.timeline_days}d</span>
              </div>
              <div className={`flex items-center gap-1 ${getRiskColor(project.risk_level)}`}>
                <AlertCircle size={14} />
                <span>{project.risk_level}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
