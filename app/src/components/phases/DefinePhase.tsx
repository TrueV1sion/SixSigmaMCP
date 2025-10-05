import { useState, useEffect } from 'react';
import { supabase, type Requirement, type CTQItem, type Constraint } from '../../lib/supabase';
import { CircleCheck as CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface DefinePhaseProps {
  projectId: string;
  onComplete: () => void;
}

export default function DefinePhase({ projectId, onComplete }: DefinePhaseProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [ctqItems, setCtqItems] = useState<CTQItem[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);

  const [newReq, setNewReq] = useState('');
  const [newCtq, setNewCtq] = useState({ need: '', driver: '', ctq: '', target: 0, usl: 0 });
  const [newConstraint, setNewConstraint] = useState({ type: 'technical' as const, description: '', impact: 'MEDIUM' as const });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const [reqResult, ctqResult, constResult] = await Promise.all([
      supabase.from('requirements').select('*').eq('project_id', projectId),
      supabase.from('ctq_items').select('*').eq('project_id', projectId),
      supabase.from('constraints').select('*').eq('project_id', projectId)
    ]);

    if (reqResult.data) setRequirements(reqResult.data);
    if (ctqResult.data) setCtqItems(ctqResult.data);
    if (constResult.data) setConstraints(constResult.data);
    setLoading(false);
  };

  const addRequirement = async () => {
    if (!newReq.trim()) return;
    const { data } = await supabase
      .from('requirements')
      .insert({ project_id: projectId, requirement: newReq, category: 'functional', priority: 'MEDIUM' })
      .select()
      .single();
    if (data) {
      setRequirements([...requirements, data]);
      setNewReq('');
    }
  };

  const addCTQ = async () => {
    if (!newCtq.need || !newCtq.ctq) return;
    const { data } = await supabase
      .from('ctq_items')
      .insert({ project_id: projectId, ...newCtq })
      .select()
      .single();
    if (data) {
      setCtqItems([...ctqItems, data]);
      setNewCtq({ need: '', driver: '', ctq: '', target: 0, usl: 0 });
    }
  };

  const addConstraint = async () => {
    if (!newConstraint.description) return;
    const { data } = await supabase
      .from('constraints')
      .insert({ project_id: projectId, ...newConstraint })
      .select()
      .single();
    if (data) {
      setConstraints([...constraints, data]);
      setNewConstraint({ type: 'technical', description: '', impact: 'MEDIUM' });
    }
  };

  const deleteRequirement = async (id: string) => {
    await supabase.from('requirements').delete().eq('id', id);
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const deleteCtq = async (id: string) => {
    await supabase.from('ctq_items').delete().eq('id', id);
    setCtqItems(ctqItems.filter(c => c.id !== id));
  };

  const deleteConstraint = async (id: string) => {
    await supabase.from('constraints').delete().eq('id', id);
    setConstraints(constraints.filter(c => c.id !== id));
  };

  const canComplete = requirements.length > 0 && ctqItems.length > 0 && constraints.length > 0;

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Define Phase: Voice of Customer</h3>
        <p className="text-slate-600 mb-6">
          Establish project requirements, critical-to-quality characteristics, and constraints.
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Requirements ({requirements.length})</h4>
            <div className="space-y-2 mb-3">
              {requirements.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-slate-900">{req.requirement}</p>
                    <span className="text-xs text-slate-500">{req.category} • {req.priority}</span>
                  </div>
                  <button
                    onClick={() => deleteRequirement(req.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                placeholder="Add a requirement..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addRequirement}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">CTQ Tree ({ctqItems.length})</h4>
            <div className="space-y-2 mb-3">
              {ctqItems.map(ctq => (
                <div key={ctq.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{ctq.ctq}</p>
                    <p className="text-sm text-slate-600">Need: {ctq.need} • Driver: {ctq.driver}</p>
                    <p className="text-xs text-slate-500">Target: {ctq.target} • USL: {ctq.usl}</p>
                  </div>
                  <button
                    onClick={() => deleteCtq(ctq.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              <input
                type="text"
                value={newCtq.need}
                onChange={(e) => setNewCtq({ ...newCtq, need: e.target.value })}
                placeholder="Need"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={newCtq.driver}
                onChange={(e) => setNewCtq({ ...newCtq, driver: e.target.value })}
                placeholder="Driver"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={newCtq.ctq}
                onChange={(e) => setNewCtq({ ...newCtq, ctq: e.target.value })}
                placeholder="CTQ"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newCtq.target}
                onChange={(e) => setNewCtq({ ...newCtq, target: Number(e.target.value) })}
                placeholder="Target"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button
                onClick={addCTQ}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Constraints ({constraints.length})</h4>
            <div className="space-y-2 mb-3">
              {constraints.map(con => (
                <div key={con.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-slate-900">{con.description}</p>
                    <span className="text-xs text-slate-500 capitalize">{con.type} • {con.impact}</span>
                  </div>
                  <button
                    onClick={() => deleteConstraint(con.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <select
                value={newConstraint.type}
                onChange={(e) => setNewConstraint({ ...newConstraint, type: e.target.value as any })}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="technical">Technical</option>
                <option value="business">Business</option>
                <option value="regulatory">Regulatory</option>
                <option value="resource">Resource</option>
              </select>
              <input
                type="text"
                value={newConstraint.description}
                onChange={(e) => setNewConstraint({ ...newConstraint, description: e.target.value })}
                placeholder="Description"
                className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button
                onClick={addConstraint}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            Complete Define Phase & Proceed to Measure
          </button>
          {!canComplete && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              Add at least one requirement, CTQ item, and constraint to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
