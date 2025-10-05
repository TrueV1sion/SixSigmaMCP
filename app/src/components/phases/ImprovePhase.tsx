import { useState, useEffect } from 'react';
import { supabase, type Solution } from '../../lib/supabase';
import { CheckCircle2, Trash2, Lightbulb, Star } from 'lucide-react';

interface ImprovePhaseProps {
  projectId: string;
  onComplete: () => void;
}

export default function ImprovePhase({ projectId, onComplete }: ImprovePhaseProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSolution, setNewSolution] = useState({
    title: '',
    description: '',
    approach: 'incremental' as const,
    impact_score: 5,
    effort_score: 5,
    risk_score: 5,
    cost_score: 5
  });

  useEffect(() => {
    loadSolutions();
  }, [projectId]);

  const loadSolutions = async () => {
    const { data } = await supabase
      .from('solutions')
      .select('*')
      .eq('project_id', projectId)
      .order('total_score', { ascending: false });
    if (data) setSolutions(data);
    setLoading(false);
  };

  const calculateTotalScore = () => {
    const { impact_score, effort_score, risk_score, cost_score } = newSolution;
    return ((impact_score * 2) - effort_score - risk_score - cost_score);
  };

  const addSolution = async () => {
    if (!newSolution.title) return;
    const total_score = calculateTotalScore();
    const { data } = await supabase
      .from('solutions')
      .insert({ project_id: projectId, ...newSolution, total_score })
      .select()
      .single();
    if (data) {
      setSolutions([...solutions, data].sort((a, b) => b.total_score - a.total_score));
      setNewSolution({
        title: '',
        description: '',
        approach: 'incremental',
        impact_score: 5,
        effort_score: 5,
        risk_score: 5,
        cost_score: 5
      });
    }
  };

  const deleteSolution = async (id: string) => {
    await supabase.from('solutions').delete().eq('id', id);
    setSolutions(solutions.filter(s => s.id !== id));
  };

  const updateStatus = async (id: string, status: 'proposed' | 'approved' | 'implemented') => {
    await supabase.from('solutions').update({ status }).eq('id', id);
    setSolutions(solutions.map(s => s.id === id ? { ...s, status } : s));
  };

  const getApproachColor = (approach: string) => {
    const colors = {
      incremental: 'bg-blue-100 text-blue-700',
      redesign: 'bg-orange-100 text-orange-700',
      innovative: 'bg-purple-100 text-purple-700'
    };
    return colors[approach as keyof typeof colors] || colors.incremental;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      proposed: 'bg-gray-100 text-gray-700',
      approved: 'bg-green-100 text-green-700',
      implemented: 'bg-blue-100 text-blue-700'
    };
    return colors[status as keyof typeof colors] || colors.proposed;
  };

  const canComplete = solutions.some(s => s.status === 'approved' || s.status === 'implemented');

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Improve Phase: Solutions</h3>
        <p className="text-slate-600 mb-6">
          Generate and evaluate improvement solutions. Approve solutions for implementation.
        </p>

        <div className="space-y-4 mb-6">
          {solutions.map(solution => (
            <div key={solution.id} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900 text-lg">{solution.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getApproachColor(solution.approach)}`}>
                      {solution.approach}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(solution.status)}`}>
                      {solution.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{solution.description}</p>
                </div>
                <button
                  onClick={() => deleteSolution(solution.id)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-3">
                <div className="text-center">
                  <span className="text-xs text-slate-500">Impact</span>
                  <p className="text-lg font-bold text-green-600">{solution.impact_score}/10</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Effort</span>
                  <p className="text-lg font-bold text-orange-600">{solution.effort_score}/10</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Risk</span>
                  <p className="text-lg font-bold text-red-600">{solution.risk_score}/10</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Cost</span>
                  <p className="text-lg font-bold text-purple-600">{solution.cost_score}/10</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-500">Total Score</span>
                  <p className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
                    <Star size={16} fill="currentColor" />
                    {solution.total_score.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(solution.id, 'proposed')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    solution.status === 'proposed'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Proposed
                </button>
                <button
                  onClick={() => updateStatus(solution.id, 'approved')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    solution.status === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => updateStatus(solution.id, 'implemented')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    solution.status === 'implemented'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  Implemented
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Lightbulb size={20} />
            Add Solution
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newSolution.title}
              onChange={(e) => setNewSolution({ ...newSolution, title: e.target.value })}
              placeholder="Solution Title"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <textarea
              value={newSolution.description}
              onChange={(e) => setNewSolution({ ...newSolution, description: e.target.value })}
              placeholder="Solution Description"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
            <select
              value={newSolution.approach}
              onChange={(e) => setNewSolution({ ...newSolution, approach: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="incremental">Incremental (Low Risk, Quick Wins)</option>
              <option value="redesign">Redesign (Medium Risk, Significant Change)</option>
              <option value="innovative">Innovative (High Risk, Revolutionary)</option>
            </select>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Impact (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSolution.impact_score}
                  onChange={(e) => setNewSolution({ ...newSolution, impact_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Effort (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSolution.effort_score}
                  onChange={(e) => setNewSolution({ ...newSolution, effort_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Risk (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSolution.risk_score}
                  onChange={(e) => setNewSolution({ ...newSolution, risk_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Cost (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSolution.cost_score}
                  onChange={(e) => setNewSolution({ ...newSolution, cost_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Projected Score: <span className="font-bold text-blue-600">{calculateTotalScore().toFixed(1)}</span>
            </div>
          </div>
          <button
            onClick={addSolution}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add Solution
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            Complete Improve Phase & Proceed to Control
          </button>
          {!canComplete && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Approve at least one solution to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
