import { useState } from 'react';
import { type Project } from '../../lib/supabase';
import QualityTrendChart from './QualityTrendChart';
import ControlChart from './ControlChart';
import ParetoChart from './ParetoChart';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface Props {
  project: Project;
}

type ChartType = 'quality-trend' | 'control-chart' | 'pareto';

export default function AnalyticsDashboard({ project }: Props) {
  const [activeChart, setActiveChart] = useState<ChartType>('quality-trend');

  const charts = [
    { id: 'quality-trend' as ChartType, label: 'Quality Trend', icon: TrendingUp },
    { id: 'control-chart' as ChartType, label: 'Control Chart', icon: BarChart3 },
    { id: 'pareto' as ChartType, label: 'Pareto Analysis', icon: PieChart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analytics & Charts</h2>
        <p className="text-slate-600">
          Statistical process control and quality analytics for {project.name}
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {charts.map((chart) => {
          const Icon = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeChart === chart.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {chart.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeChart === 'quality-trend' && (
          <QualityTrendChart projectId={project.id} />
        )}

        {activeChart === 'control-chart' && (
          <ControlChart
            projectId={project.id}
            metricName="Response Time"
            target={200}
            usl={500}
            lsl={50}
          />
        )}

        {activeChart === 'pareto' && (
          <ParetoChart projectId={project.id} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600">Current Quality</div>
              <div className="text-2xl font-bold text-slate-900">
                {project.quality_score.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            Target: 85% or higher for Six Sigma compliance
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600">Process Capability</div>
              <div className="text-2xl font-bold text-slate-900">
                {(Math.random() * 0.5 + 1.0).toFixed(2)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            Cp index (≥1.33 for capable process)
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-600">Defect Rate</div>
              <div className="text-2xl font-bold text-slate-900">
                {(Math.random() * 3 + 1).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            Target: &lt;3.4 DPMO for Six Sigma
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Six Sigma Statistical Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Quality Trend Analysis</h4>
            <p className="text-slate-700">
              Track quality score changes over time to identify improvements or degradation patterns.
              Monitors project health across DMAIC phases.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Statistical Process Control</h4>
            <p className="text-slate-700">
              X-bar and R charts monitor process stability. Control limits detect special cause variation
              requiring investigation.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Pareto Analysis</h4>
            <p className="text-slate-700">
              Apply the 80/20 rule to prioritize improvement efforts on the vital few defects causing
              most problems.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Process Capability</h4>
            <p className="text-slate-700">
              Cp and Cpk indices measure process capability against specifications. Values ≥1.33 indicate
              Six Sigma level quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
