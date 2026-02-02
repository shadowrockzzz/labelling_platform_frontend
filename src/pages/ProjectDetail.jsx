import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ChevronLeft,
  Users,
  Trash2,
  Archive,
  Edit,
  Plus,
  X,
  Search,
  User as UserIcon,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { StatusBadge, PROJECT_STATUS_OPTIONS, RoleBadge } from '../utils/roleHelpers.jsx';
import { projectService } from '../services/projectService.js';
import { assignmentService } from '../services/assignmentService.js';
import { userService } from '../services/userService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import TextAnnotationWorkspace from '../components/text-annotation/TextAnnotationWorkspace.jsx';
import toast from 'react-hot-toast';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Team management states
  const [team, setTeam] = useState({ manager: null, reviewers: [], annotators: [] });
  const [showAddReviewerModal, setShowAddReviewerModal] = useState(false);
  const [showAddAnnotatorModal, setShowAddAnnotatorModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Settings states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const settingsForm = useForm();
  
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'project_manager';

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectById(id);
      setProject(data);
      settingsForm.reset({
        name: data.name,
        description: data.description,
        status: data.status
      });
    } catch (error) {
      toast.error('Failed to fetch project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await assignmentService.getProjectTeam(id);
      // The backend returns {success: true, data: {manager, reviewers, annotators}}
      // Extract the nested data from the response
      setTeam(response.data || { manager: null, reviewers: [], annotators: [] });
    } catch (error) {
      toast.error('Failed to fetch team');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      const nonAdminUsers = response.data.filter(u => u.role !== 'admin');
      setAvailableUsers(nonAdminUsers);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTeam();
  }, [id]);

  useEffect(() => {
    if (showAddReviewerModal || showAddAnnotatorModal) {
      fetchAvailableUsers();
      setSelectedUsers([]);
      setUserSearchTerm('');
    }
  }, [showAddReviewerModal, showAddAnnotatorModal]);

  // Refresh team data when switching to team tab
  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeam();
    }
  }, [activeTab]);

  const handleStatusChange = async (newStatus) => {
    try {
      await projectService.updateProject(id, { status: newStatus });
      toast.success('Status updated');
      fetchProject();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveSettings = async (data) => {
    try {
      await projectService.updateProject(id, {
        name: data.name,
        description: data.description,
        status: data.status
      });
      toast.success('Project updated successfully');
      fetchProject();
      fetchTeam(); // Refresh team to get updated manager
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleAddReviewers = async () => {
    try {
      for (const userId of selectedUsers) {
        await assignmentService.addReviewer(id, userId);
      }
      toast.success(`Added ${selectedUsers.length} reviewer(s)`);
      setShowAddReviewerModal(false);
      setSelectedUsers([]);
      fetchTeam();
    } catch (error) {
      toast.error('Failed to add reviewers');
    }
  };

  const handleAddAnnotators = async () => {
    try {
      for (const userId of selectedUsers) {
        await assignmentService.addAnnotator(id, userId);
      }
      toast.success(`Added ${selectedUsers.length} annotator(s)`);
      setShowAddAnnotatorModal(false);
      setSelectedUsers([]);
      fetchTeam();
    } catch (error) {
      toast.error('Failed to add annotators');
    }
  };

  const handleRemoveReviewer = async (userId) => {
    try {
      await assignmentService.removeReviewer(id, userId);
      toast.success('Reviewer removed');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to remove reviewer');
    }
  };

  const handleRemoveAnnotator = async (userId) => {
    try {
      await assignmentService.removeAnnotator(id, userId);
      toast.success('Annotator removed');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to remove annotator');
    }
  };

  const handleArchiveProject = async () => {
    try {
      await projectService.updateProject(id, { status: 'archived' });
      toast.success('Project archived');
      fetchProject();
    } catch (error) {
      toast.error('Failed to archive project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getAvatarInitials = (name, email) => {
    const displayName = name || email;
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFilteredUsers = () => {
    return availableUsers.filter(user => {
      const search = userSearchTerm.toLowerCase();
      return (
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    });
  };

  const isUserAssigned = (userId, role) => {
    if (role === 'reviewer') {
      return team.reviewers.some(r => r.id === userId);
    }
    return team.annotators.some(a => a.id === userId);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="p-6 md:p-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Created by: {project.owner?.full_name || 'Unknown'}</span>
              <span>•</span>
              <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 border-b-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('annotations')}
            className={`pb-4 border-b-2 font-medium transition-colors ${
              activeTab === 'annotations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Annotations
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-4 border-b-2 font-medium transition-colors ${
              activeTab === 'team'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Team
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          )}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Reviewers</p>
                  <p className="text-3xl font-bold text-gray-900">{project.reviewer_count || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Annotators</p>
                  <p className="text-3xl font-bold text-gray-900">{project.annotator_count || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Project Status</p>
                  <p className="text-xl font-semibold text-gray-900 capitalize">{project.status}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created Date</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="text-center py-12 text-gray-500">
              Activity feed coming soon
            </div>
          </div>
        </div>
      )}

      {/* Annotations Tab */}
      {activeTab === 'annotations' && (
        <TextAnnotationWorkspace 
          projectId={id} 
          userRole={currentUser?.role} 
        />
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Manager */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Project Manager</h3>
            {team.manager ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getAvatarInitials(team.manager.full_name, team.manager.email)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{team.manager.full_name}</div>
                  <div className="text-sm text-gray-600">{team.manager.email}</div>
                </div>
                <RoleBadge role={team.manager.role} />
              </div>
            ) : (
              <p className="text-gray-500">Not assigned</p>
            )}
          </div>

          {/* Reviewers */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reviewers</h3>
              <span className="text-sm text-gray-600">
                {team.reviewers?.length || 0} Reviewer(s)
              </span>
            </div>
            <div className="space-y-3">
              {team.reviewers && team.reviewers.length > 0 ? (
                team.reviewers.map(reviewer => (
                  <div key={reviewer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getAvatarInitials(reviewer.full_name, reviewer.email)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{reviewer.full_name}</div>
                        <div className="text-sm text-gray-600">{reviewer.email}</div>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveReviewer(reviewer.id)}
                        className="p-2 text-error-600 hover:bg-error-50 rounded"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reviewers assigned yet.</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddReviewerModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Reviewers
              </button>
            )}
          </div>

          {/* Annotators */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Annotators</h3>
              <span className="text-sm text-gray-600">
                {team.annotators?.length || 0} Annotator(s)
              </span>
            </div>
            <div className="space-y-3">
              {team.annotators && team.annotators.length > 0 ? (
                team.annotators.map(annotator => (
                  <div key={annotator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getAvatarInitials(annotator.full_name, annotator.email)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{annotator.full_name}</div>
                        <div className="text-sm text-gray-600">{annotator.email}</div>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveAnnotator(annotator.id)}
                        className="p-2 text-error-600 hover:bg-error-50 rounded"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No annotators assigned yet.</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddAnnotatorModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Annotators
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && canEdit && (
        <div className="space-y-6">
          <div className="card">
            <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  {...settingsForm.register('name', { required: 'Project name is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...settingsForm.register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  {...settingsForm.register('status', { required: 'Status is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {PROJECT_STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="card border-2 border-error-200">
            <h3 className="text-lg font-semibold text-error-600 mb-4">Danger Zone</h3>
            <div className="space-y-4">
              <button
                onClick={handleArchiveProject}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Archive className="w-4 h-4" />
                Archive Project
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error-600 text-white rounded-lg hover:bg-error-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reviewers Modal */}
      {showAddReviewerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Add Reviewers to {project.name}</h2>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {getFilteredUsers().length === 0 ? (
                <p className="text-center text-gray-500">No users found</p>
              ) : (
                <div className="space-y-2">
                  {getFilteredUsers().map(user => {
                    const isAssigned = isUserAssigned(user.id, 'reviewer');
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isAssigned ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !isAssigned && toggleUserSelection(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          disabled={isAssigned}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getAvatarInitials(user.full_name, user.email)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                        <RoleBadge role={user.role} />
                        {isAssigned && (
                          <span className="text-sm text-gray-500">Already added</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddReviewerModal(false);
                  setSelectedUsers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReviewers}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Annotators Modal */}
      {showAddAnnotatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Add Annotators to {project.name}</h2>
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {getFilteredUsers().length === 0 ? (
                <p className="text-center text-gray-500">No users found</p>
              ) : (
                <div className="space-y-2">
                  {getFilteredUsers().map(user => {
                    const isAssigned = isUserAssigned(user.id, 'annotator');
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isAssigned ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => !isAssigned && toggleUserSelection(user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          disabled={isAssigned}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getAvatarInitials(user.full_name, user.email)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                        <RoleBadge role={user.role} />
                        {isAssigned && (
                          <span className="text-sm text-gray-500">Already added</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddAnnotatorModal(false);
                  setSelectedUsers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAnnotators}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Selected ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-error-600">Delete Project</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                This will permanently delete the project and all associated assignments. 
                Type the project name to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${project.name}"`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-error-500"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={confirmText !== project.name}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};