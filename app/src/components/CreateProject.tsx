import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface CreateProjectProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateProject({ onCancel, onSuccess }: CreateProjectProps) {
  const [formData, setFormData] = useState({
    name: '',
    business_case: '',
    deployment_target: 'cloud',
    budget_limit: 5000,
    timeline_days: 90,
    requirements: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: formData.name,
        business_case: formData.business_case,
        deployment_target: formData.deployment_target,
        budget_limit: formData.budget_limit,
        timeline_days: formData.timeline_days,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      setLoading(false);
      return;
    }

    const requirements = formData.requirements
      .filter(r => r.trim())
      .map(req => ({
        project_id: project.id,
        requirement: req.trim(),
        category: 'functional' as const,
        priority: 'MEDIUM' as const
      }));

    if (requirements.length > 0) {
      await supabase.from('requirements').insert(requirements);
    }

    setLoading(false);
    onSuccess();
  };

  const updateRequirement = (index: number, value: string) => {
    const newReqs = [...formData.requirements];
    newReqs[index] = value;
    setFormData({ ...formData, requirements: newReqs });
  };

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ''] });
  };

  const removeRequirement = (index: number) => {
    const newReqs = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: newReqs });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create New Project</h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="High-Performance API"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Business Case
          </label>
          <textarea
            required
            value={formData.business_case}
            onChange={(e) => setFormData({ ...formData, business_case: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe the business justification for this project..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deployment Target
            </label>
            <select
              value={formData.deployment_target}
              onChange={(e) => setFormData({ ...formData, deployment_target: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cloud">Cloud</option>
              <option value="on-premise">On-Premise</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget Limit ($)
            </label>
            <input
              type="number"
              value={formData.budget_limit}
              onChange={(e) => setFormData({ ...formData, budget_limit: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Timeline (days)
            </label>
            <input
              type="number"
              value={formData.timeline_days}
              onChange={(e) => setFormData({ ...formData, timeline_days: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Requirements
          </label>
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={req}
                onChange={(e) => updateRequirement(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a requirement..."
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRequirement}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Requirement
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
