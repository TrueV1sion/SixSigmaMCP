import { useState, useEffect } from 'react';
import { supabase, type Project } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OrganizationSetup from './components/auth/OrganizationSetup';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import CreateProject from './components/CreateProject';
import Header from './components/Header';

function App() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsOrgSetup, setNeedsOrgSetup] = useState(false);

  useEffect(() => {
    if (profile) {
      if (!profile.organization_id) {
        setNeedsOrgSetup(true);
        setLoading(false);
      } else {
        setNeedsOrgSetup(false);
        loadProjects();
      }
    }
  }, [profile]);

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

  if (needsOrgSetup) {
    return (
      <ProtectedRoute>
        <OrganizationSetup onComplete={() => setNeedsOrgSetup(false)} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header onCreateProject={() => setShowCreateForm(true)} />

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
    </ProtectedRoute>
  );
}

export default App;
