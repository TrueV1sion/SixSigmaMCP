import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ParetoItem {
  category: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

interface Props {
  projectId: string;
}

export default function ParetoChart({ projectId }: Props) {
  const [data, setData] = useState<ParetoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFMEAData();
  }, [projectId]);

  const loadFMEAData = async () => {
    const { data: fmeaData, error } = await supabase
      .from('fmea_items')
      .select('failure_mode, rpn')
      .eq('project_id', projectId)
      .order('rpn', { ascending: false });

    if (error) {
      console.error('Error loading FMEA data:', error);
      setLoading(false);
      return;
    }

    if (!fmeaData || fmeaData.length === 0) {
      setLoading(false);
      return;
    }

    const categoryCounts: Record<string, number> = {};
    fmeaData.forEach(item => {
      const category = item.failure_mode || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const totalCount = sortedCategories.reduce((sum, [, count]) => sum + count, 0);

    let cumulative = 0;
    const paretoData: ParetoItem[] = sortedCategories.map(([category, count]) => {
      const percentage = (count / totalCount) * 100;
      cumulative += percentage;
      return {
        category: category.length > 25 ? category.substring(0, 25) + '...' : category,
        count,
        percentage,
        cumulativePercentage: cumulative,
      };
    });

    setData(paretoData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-600">Loading Pareto analysis...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No failure mode data available for Pareto analysis.</p>
        <p className="text-sm mt-2">Complete the Analyze phase to see defect patterns.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const chartHeight = 300;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Pareto Chart - Failure Modes</h3>
        <p className="text-sm text-slate-600">80/20 Rule: Focus on the vital few defects</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {data.map((item, index) => {
              const barHeight = (item.count / maxCount) * (chartHeight - 60);
              const isVitalFew = item.cumulativePercentage <= 80;

              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                  <div className="text-xs font-medium text-slate-900 mb-1">
                    {item.cumulativePercentage.toFixed(0)}%
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isVitalFew ? 'bg-red-500' : 'bg-slate-400'
                    }`}
                    style={{ height: `${barHeight}px` }}
                    title={`${item.category}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                  />
                  <div className="text-xs text-slate-600 mt-2 text-center w-full truncate px-1">
                    {item.count}
                  </div>
                </div>
              );
            })}
          </div>

          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox={`0 0 ${data.length * 100} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <polyline
              points={data
                .map((item, index) => {
                  const x = (index + 0.5) * (100 / data.length) * data.length;
                  const y = chartHeight - 50 - ((item.cumulativePercentage / 100) * (chartHeight - 80));
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((item, index) => {
              const x = (index + 0.5) * (100 / data.length) * data.length;
              const y = chartHeight - 50 - ((item.cumulativePercentage / 100) * (chartHeight - 80));
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="rgb(59, 130, 246)"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {data.map((item, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-white rounded border border-slate-200"
              title={item.category}
            >
              {index + 1}. {item.category}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-red-900 mb-2">Vital Few (80%)</div>
          <div className="text-xs text-red-800">
            Focus improvement efforts on these top defects for maximum impact
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-900 mb-2">Trivial Many (20%)</div>
          <div className="text-xs text-slate-600">
            Remaining defects with lower frequency or impact
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Pareto Principle</h4>
        <p className="text-sm text-blue-800">
          The Pareto principle (80/20 rule) suggests that roughly 80% of effects come from 20% of causes.
          Red bars represent the vital few defects that should be prioritized for improvement initiatives.
          The blue cumulative line shows the running total percentage.
        </p>
      </div>
    </div>
  );
}
