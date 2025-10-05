import { useState, useEffect } from 'react';
import { supabase, type Project } from './lib/supabase';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import CreateProject from './components/CreateProject';
import { Plus } from 'lucide-react';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleProjectCreated = () => {
    setShowCreateForm(false);
    loadProjects();
  };

  const handleProjectUpdated = () => {
    loadProjects();
    if (selectedProject) {
      supabase
        .from('projects')
        .select('*')
        .eq('id', selectedProject.id)
        .single()
        .then(({ data }) => {
          if (data) setSelectedProject(data);
        });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Six Sigma DMAIC</h1>
              <p className="text-slate-600 mt-1">Quality-driven project management system</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showCreateForm ? (
          <div className="mb-8">
            <CreateProject
              onCancel={() => setShowCreateForm(false)}
              onSuccess={handleProjectCreated}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProjectList
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={setSelectedProject}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <ProjectDetails
                project={selectedProject}
                onUpdate={handleProjectUpdated}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="text-slate-400 text-lg">
                  Select a project to view details
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
