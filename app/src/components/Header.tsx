import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './collaboration/NotificationCenter';
import { Plus, LogOut, Building2 } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onCreateProject: () => void;
}

export default function Header({ onCreateProject }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Six Sigma DMAIC</h1>
              <p className="text-slate-600 mt-1">Quality-driven project management system</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              New Project
            </button>

            <NotificationCenter />

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials(profile?.full_name || user?.email || null)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">
                    {profile?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-slate-600 capitalize">
                    {profile?.role?.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <div className="text-sm font-medium text-slate-900">
                        {profile?.full_name}
                      </div>
                      <div className="text-xs text-slate-600">{user?.email}</div>
                    </div>

                    {profile?.organization_id && (
                      <div className="px-4 py-2 flex items-center gap-2 text-sm text-slate-700">
                        <Building2 size={16} />
                        <span>Organization Member</span>
                      </div>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
