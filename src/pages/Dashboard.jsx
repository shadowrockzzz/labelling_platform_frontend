import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { 
  LayoutGrid, 
  Users, 
  FolderOpen, 
  FileText, 
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { ROLE_LABELS } from '../utils/constants';
import api from '../services/api.jsx';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/projects');
      const projects = response.data.data;
      
      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name || user?.email}!
        </h1>
        <p className="text-gray-600">
          You're logged in as <span className="font-medium text-primary-600">{ROLE_LABELS[user?.role]}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-success-500">{stats?.activeProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-success-500" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-secondary-600">{stats?.completedProjects || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Quick Actions</p>
              <p className="text-lg font-medium text-gray-900">View Projects</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-warning-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.role === 'admin' && (
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">Add, edit, and remove users</p>
              </div>
            </a>
          )}

          <a
            href="/projects"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <FolderOpen className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Projects</p>
              <p className="text-sm text-gray-600">Browse and manage projects</p>
            </div>
          </a>

          <a
            href="/profile"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
              <UserIcon className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">My Profile</p>
              <p className="text-sm text-gray-600">Update your profile settings</p>
            </div>
          </a>

          <button
            onClick={logout}
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-error-500 hover:bg-error-50 transition-all duration-200 group w-full"
          >
            <div className="w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center group-hover:bg-error-200 transition-colors">
              <LogOut className="w-5 h-5 text-error-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Logout</p>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};