import { useState, useEffect } from 'react';
import { supabase, type KPI } from '../../lib/supabase';
import { CircleCheck as CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface MeasurePhaseProps {
  projectId: string;
  onComplete: () => void;
}

export default function MeasurePhase({ projectId, onComplete }: MeasurePhaseProps) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKpi, setNewKpi] = useState({
    name: '',
    description: '',
    target: 0,
    current_value: 0,
    unit: ''
  });

  useEffect(() => {
    loadKpis();
  }, [projectId]);

  const loadKpis = async () => {
    const { data } = await supabase
      .from('kpis')
      .select('*')
      .eq('project_id', projectId);
    if (data) setKpis(data);
    setLoading(false);
  };

  const addKpi = async () => {
    if (!newKpi.name || !newKpi.unit) return;
    const { data } = await supabase
      .from('kpis')
      .insert({ project_id: projectId, ...newKpi })
      .select()
      .single();
    if (data) {
      setKpis([...kpis, data]);
      setNewKpi({ name: '', description: '', target: 0, current_value: 0, unit: '' });
    }
  };

  const deleteKpi = async (id: string) => {
    await supabase.from('kpis').delete().eq('id', id);
    setKpis(kpis.filter(k => k.id !== id));
  };

  const updateKpiValue = async (id: string, value: number) => {
    await supabase.from('kpis').update({ current_value: value }).eq('id', id);
    setKpis(kpis.map(k => k.id === id ? { ...k, current_value: value } : k));
  };

  const calculatePerformance = (kpi: KPI) => {
    if (kpi.target === 0) return 0;
    return ((kpi.current_value / kpi.target) * 100).toFixed(1);
  };

  const canComplete = kpis.length >= 3;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Measure Phase: KPIs & Baselines</h3>
        <p className="text-slate-600 mb-6">
          Define key performance indicators and establish current baseline measurements.
        </p>

        <div className="space-y-4 mb-6">
          {kpis.map(kpi => {
            const performance = Number(calculatePerformance(kpi));
            const isOnTarget = performance >= 100;
            return (
              <div key={kpi.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{kpi.name}</h4>
                    <p className="text-sm text-slate-600">{kpi.description}</p>
                  </div>
                  <button
                    onClick={() => deleteKpi(kpi.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-slate-500">Target</span>
                    <p className="font-bold text-slate-900">{kpi.target} {kpi.unit}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Current</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={kpi.current_value}
                        onChange={(e) => updateKpiValue(kpi.id, Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm font-bold"
                      />
                      <span className="text-sm text-slate-600">{kpi.unit}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Performance</span>
                    <p className={`font-bold ${isOnTarget ? 'text-green-600' : 'text-orange-600'}`}>
                      {performance}%
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isOnTarget ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(performance, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Plus size={20} />
            Add New KPI
          </h4>
          <div className="grid grid-cols-5 gap-2">
            <input
              type="text"
              value={newKpi.name}
              onChange={(e) => setNewKpi({ ...newKpi, name: e.target.value })}
              placeholder="KPI Name"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newKpi.description}
              onChange={(e) => setNewKpi({ ...newKpi, description: e.target.value })}
              placeholder="Description"
              className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="number"
              value={newKpi.target}
              onChange={(e) => setNewKpi({ ...newKpi, target: Number(e.target.value) })}
              placeholder="Target"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newKpi.unit}
              onChange={(e) => setNewKpi({ ...newKpi, unit: e.target.value })}
              placeholder="Unit (ms, %)"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={addKpi}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add KPI
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            Complete Measure Phase & Proceed to Analyze
          </button>
          {!canComplete && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Add at least 3 KPIs to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
