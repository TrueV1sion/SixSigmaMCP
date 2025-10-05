import { useState } from 'react';
import { type Project, supabase } from '../lib/supabase';
import { Target, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import DefinePhase from './phases/DefinePhase';
import MeasurePhase from './phases/MeasurePhase';
import AnalyzePhase from './phases/AnalyzePhase';
import ImprovePhase from './phases/ImprovePhase';
import ControlPhase from './phases/ControlPhase';

interface ProjectDetailsProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectDetails({ project, onUpdate }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases'>('overview');

  const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];
  const currentPhaseIndex = phases.indexOf(project.current_phase);

  const advancePhase = async () => {
    const nextIndex = currentPhaseIndex + 1;
    if (nextIndex < phases.length) {
      await supabase
        .from('projects')
        .update({
          current_phase: phases[nextIndex],
          phase_completion: ((nextIndex + 1) / phases.length) * 100
        })
        .eq('id', project.id);
      onUpdate();
    }
  };

  const getPhaseStatus = (phaseIndex: number) => {
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'active';
    return 'pending';
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      LOW: 'text-green-600 bg-green-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HIGH: 'text-red-600 bg-red-50'
    };
    return colors[risk as keyof typeof colors] || colors.LOW;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{project.name}</h2>
        <p className="text-slate-600 mb-6">{project.business_case}</p>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">Quality</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {project.quality_score.toFixed(0)}%
            </div>
          </div>

          <div className={`rounded-lg p-4 ${getRiskColor(project.risk_level)}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Risk</span>
            </div>
            <div className="text-2xl font-bold">
              {project.risk_level}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Target size={18} />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {project.phase_completion.toFixed(0)}%
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar size={18} />
              <span className="text-sm font-medium">Timeline</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {project.timeline_days}d
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'phases'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              DMAIC Phases
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-slate-600">Deployment Target</span>
              <p className="font-medium text-slate-900 capitalize">{project.deployment_target}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Budget Limit</span>
              <p className="font-medium text-slate-900">${project.budget_limit.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Current Phase</span>
              <p className="font-medium text-slate-900">{project.current_phase}</p>
            </div>
            <div>
              <span className="text-sm text-slate-600">Created</span>
              <p className="font-medium text-slate-900">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'phases' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">DMAIC Progress</h3>
            <div className="flex items-center justify-between mb-2">
              {phases.map((phase, index) => {
                const status = getPhaseStatus(index);
                return (
                  <div key={phase} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                        status === 'completed'
                          ? 'bg-green-500 text-white'
                          : status === 'active'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < phases.length - 1 && (
                      <div
                        className={`w-16 h-1 mx-2 ${
                          status === 'completed' ? 'bg-green-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              {phases.map(phase => (
                <span key={phase} className="w-10 text-center">{phase}</span>
              ))}
            </div>
          </div>

          {project.current_phase === 'DEFINE' && (
            <DefinePhase projectId={project.id} onComplete={advancePhase} />
          )}
          {project.current_phase === 'MEASURE' && (
            <MeasurePhase projectId={project.id} onComplete={advancePhase} />
          )}
          {project.current_phase === 'ANALYZE' && (
            <AnalyzePhase projectId={project.id} onComplete={advancePhase} />
          )}
          {project.current_phase === 'IMPROVE' && (
            <ImprovePhase projectId={project.id} onComplete={advancePhase} />
          )}
          {project.current_phase === 'CONTROL' && (
            <ControlPhase projectId={project.id} onComplete={() => onUpdate()} />
          )}
        </div>
      )}
    </div>
  );
}
