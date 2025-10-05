import { useState, useEffect } from 'react';
import { supabase, type FMEAItem } from '../../lib/supabase';
import { CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

interface AnalyzePhaseProps {
  projectId: string;
  onComplete: () => void;
}

export default function AnalyzePhase({ projectId, onComplete }: AnalyzePhaseProps) {
  const [fmeaItems, setFmeaItems] = useState<FMEAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFmea, setNewFmea] = useState({
    failure_mode: '',
    effects: '',
    causes: '',
    severity: 5,
    occurrence: 5,
    detection: 5
  });

  useEffect(() => {
    loadFmea();
  }, [projectId]);

  const loadFmea = async () => {
    const { data } = await supabase
      .from('fmea_items')
      .select('*')
      .eq('project_id', projectId)
      .order('rpn', { ascending: false });
    if (data) setFmeaItems(data);
    setLoading(false);
  };

  const addFmea = async () => {
    if (!newFmea.failure_mode) return;
    const { data } = await supabase
      .from('fmea_items')
      .insert({ project_id: projectId, ...newFmea })
      .select()
      .single();
    if (data) {
      setFmeaItems([...fmeaItems, data].sort((a, b) => b.rpn - a.rpn));
      setNewFmea({ failure_mode: '', effects: '', causes: '', severity: 5, occurrence: 5, detection: 5 });
    }

    await updateProjectRisk();
  };

  const deleteFmea = async (id: string) => {
    await supabase.from('fmea_items').delete().eq('id', id);
    setFmeaItems(fmeaItems.filter(f => f.id !== id));
    await updateProjectRisk();
  };

  const updateProjectRisk = async () => {
    const avgRpn = fmeaItems.reduce((sum, item) => sum + item.rpn, 0) / (fmeaItems.length || 1);
    const riskLevel = avgRpn > 300 ? 'HIGH' : avgRpn > 150 ? 'MEDIUM' : 'LOW';
    await supabase
      .from('projects')
      .update({ risk_level: riskLevel })
      .eq('id', projectId);
  };

  const getRpnColor = (rpn: number) => {
    if (rpn > 300) return 'bg-red-100 text-red-700 border-red-300';
    if (rpn > 150) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getRpnLabel = (rpn: number) => {
    if (rpn > 300) return 'CRITICAL';
    if (rpn > 150) return 'HIGH';
    if (rpn > 80) return 'MEDIUM';
    return 'LOW';
  };

  const canComplete = fmeaItems.length >= 2;
  const avgRpn = fmeaItems.reduce((sum, item) => sum + item.rpn, 0) / (fmeaItems.length || 1);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Analyze Phase: FMEA</h3>
        <p className="text-slate-600 mb-6">
          Identify failure modes, effects, and causes. Calculate Risk Priority Numbers (RPN).
        </p>

        {fmeaItems.length > 0 && (
          <div className="mb-6 p-4 bg-slate-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-600">Average RPN</span>
                <p className="text-2xl font-bold text-slate-900">{avgRpn.toFixed(0)}</p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Total Items</span>
                <p className="text-2xl font-bold text-slate-900">{fmeaItems.length}</p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Critical Items</span>
                <p className="text-2xl font-bold text-red-600">
                  {fmeaItems.filter(f => f.rpn > 300).length}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {fmeaItems.map(fmea => (
            <div key={fmea.id} className={`p-4 rounded-lg border-2 ${getRpnColor(fmea.rpn)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900">{fmea.failure_mode}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${getRpnColor(fmea.rpn)}`}>
                      RPN: {fmea.rpn} ({getRpnLabel(fmea.rpn)})
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1"><strong>Effects:</strong> {fmea.effects}</p>
                  <p className="text-sm text-slate-700"><strong>Causes:</strong> {fmea.causes}</p>
                </div>
                <button
                  onClick={() => deleteFmea(fmea.id)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-current/20">
                <div>
                  <span className="text-xs opacity-75">Severity</span>
                  <p className="font-bold">{fmea.severity}/10</p>
                </div>
                <div>
                  <span className="text-xs opacity-75">Occurrence</span>
                  <p className="font-bold">{fmea.occurrence}/10</p>
                </div>
                <div>
                  <span className="text-xs opacity-75">Detection</span>
                  <p className="font-bold">{fmea.detection}/10</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} />
            Add FMEA Item
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newFmea.failure_mode}
              onChange={(e) => setNewFmea({ ...newFmea, failure_mode: e.target.value })}
              placeholder="Failure Mode"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newFmea.effects}
              onChange={(e) => setNewFmea({ ...newFmea, effects: e.target.value })}
              placeholder="Effects"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newFmea.causes}
              onChange={(e) => setNewFmea({ ...newFmea, causes: e.target.value })}
              placeholder="Causes"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Severity (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newFmea.severity}
                  onChange={(e) => setNewFmea({ ...newFmea, severity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Occurrence (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newFmea.occurrence}
                  onChange={(e) => setNewFmea({ ...newFmea, occurrence: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Detection (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newFmea.detection}
                  onChange={(e) => setNewFmea({ ...newFmea, detection: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          <button
            onClick={addFmea}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Add FMEA Item
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            Complete Analyze Phase & Proceed to Improve
          </button>
          {!canComplete && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Add at least 2 FMEA items to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
