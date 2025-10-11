import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateTemplate({ onCancel, onSuccess }: Props) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'api',
    requirements: [''],
    tags: [''],
    is_public: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.organization_id) return;

    setLoading(true);

    const filteredRequirements = formData.requirements.filter((r) => r.trim());
    const filteredTags = formData.tags.filter((t) => t.trim());

    const { error } = await supabase.from('project_templates').insert({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      requirements_template: filteredRequirements,
      tags: filteredTags,
      is_public: formData.is_public,
      created_by: user.id,
      organization_id: profile.organization_id,
      usage_count: 0,
    });

    if (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } else {
      onSuccess();
    }

    setLoading(false);
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

  const updateTag = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData({ ...formData, tags: newTags });
  };

  const addTag = () => {
    setFormData({ ...formData, tags: [...formData.tags, ''] });
  };

  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create Template</h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Template Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="High-Performance API Template"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe what this template is for and when to use it..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="api">API Development</option>
            <option value="ui">UI/UX</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="data">Data Pipeline</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="quality">Quality Assurance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Requirements
          </label>
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={req}
                onChange={(e) => updateRequirement(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a default requirement..."
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRequirement}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Plus size={16} />
            Add Requirement
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tags
          </label>
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={tag}
                onChange={(e) => updateTag(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a tag..."
              />
              {formData.tags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTag}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Plus size={16} />
            Add Tag
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) =>
              setFormData({ ...formData, is_public: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="is_public" className="text-sm text-slate-700">
            <span className="font-medium">Make this template public</span>
            <p className="text-xs text-slate-600 mt-1">
              Public templates can be used by all organizations
            </p>
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {loading ? 'Creating...' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
