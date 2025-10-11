import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Tag,
  Clock,
  Users,
  Globe,
  Lock,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usage_count: number;
  is_public: boolean;
  created_at: string;
  created_by: string | null;
}

interface Props {
  onSelectTemplate: (template: Template) => void;
  onCreateNew: () => void;
}

export default function TemplateGallery({ onSelectTemplate, onCreateNew }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;

    const { error } = await supabase
      .from('project_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
    } else {
      await loadTemplates();
    }
  };

  const categories = ['all', ...new Set(templates.map((t) => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Project Templates
          </h2>
          <p className="text-slate-600">
            Start your Six Sigma project with pre-configured templates
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Template
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText size={48} className="mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500">No templates found</p>
          <button
            onClick={onCreateNew}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {template.name}
                    </h3>
                    {template.is_public ? (
                      <div title="Public template">
                        <Globe size={16} className="text-green-600" />
                      </div>
                    ) : (
                      <div title="Private template">
                        <Lock size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {template.category}
                  </span>
                </div>
                {template.created_by === user?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-slate-500">
                      +{template.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>Used {template.usage_count} times</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {formatDistanceToNow(new Date(template.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
