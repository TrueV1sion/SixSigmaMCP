import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricData {
  recorded_at: string;
  quality_score: number;
  risk_level: string;
  phase: string;
}

interface Props {
  projectId: string;
}

export default function QualityTrendChart({ projectId }: Props) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [projectId]);

  const loadMetrics = async () => {
    const { data, error } = await supabase
      .from('quality_metrics_history')
      .select('recorded_at, quality_score, risk_level, phase')
      .eq('project_id', projectId)
      .order('recorded_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error loading metrics:', error);
    } else {
      setMetrics(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-600">Loading quality trends...</div>
      </div>
    );
  }

  if (metrics.length < 2) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Not enough data to display quality trends.</p>
        <p className="text-sm mt-2">Quality metrics will be tracked as the project progresses.</p>
      </div>
    );
  }

  const maxScore = Math.max(...metrics.map(m => m.quality_score));
  const minScore = Math.min(...metrics.map(m => m.quality_score));
  const latestScore = metrics[metrics.length - 1].quality_score;
  const previousScore = metrics[metrics.length - 2]?.quality_score || latestScore;
  const scoreDelta = latestScore - previousScore;
  const trend = scoreDelta > 0 ? 'up' : scoreDelta < 0 ? 'down' : 'stable';

  const chartHeight = 200;
  const chartPadding = 20;
  const availableHeight = chartHeight - (chartPadding * 2);
  const scoreRange = maxScore - minScore || 10;

  const points = metrics.map((metric, index) => {
    const x = (index / (metrics.length - 1)) * 100;
    const normalizedScore = ((metric.quality_score - minScore) / scoreRange);
    const y = chartHeight - (normalizedScore * availableHeight + chartPadding);
    return { x, y, ...metric };
  });

  const pathD = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    })
    .join(' ');

  const areaD = `${pathD} L 100 ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Quality Score Trend</h3>
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">+{scoreDelta.toFixed(1)}%</span>
            </div>
          )}
          {trend === 'down' && (
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown size={18} />
              <span className="text-sm font-medium">{scoreDelta.toFixed(1)}%</span>
            </div>
          )}
          {trend === 'stable' && (
            <div className="text-sm text-slate-600">Stable</div>
          )}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: `${chartHeight}px` }}
        >
          <defs>
            <linearGradient id="qualityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={areaD}
            fill="url(#qualityGradient)"
            stroke="none"
          />

          <path
            d={pathD}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Start</span>
          <span>{metrics.length} data points</span>
          <span>Latest</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div>
          <div className="text-xs text-slate-600 mb-1">Current</div>
          <div className="text-2xl font-bold text-slate-900">
            {latestScore.toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">High</div>
          <div className="text-2xl font-bold text-green-600">
            {maxScore.toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Low</div>
          <div className="text-2xl font-bold text-orange-600">
            {minScore.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {metrics.slice(-5).reverse().map((metric, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm"
          >
            <span className="font-medium text-slate-900">{metric.phase}</span>
            <span className="text-slate-600">{metric.quality_score.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
