import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Users,
  Trash2,
  Archive,
  Plus,
  X,
  Search,
  User as UserIcon,
  CheckCircle,
  Edit,
  Database,
  Upload,
  Lock,
  Unlock,
  SkipForward,
  FileText,
  Image
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { StatusBadge, PROJECT_STATUS_OPTIONS, RoleBadge } from '../utils/roleHelpers.jsx';
import { projectService } from '../services/projectService.js';
import { assignmentService } from '../services/assignmentService.js';
import { userService } from '../services/userService.js';
import { textResourceService } from '../services/textResourceService.js';
import imageResourceService from '../services/imageResourceService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import TextAnnotationWorkspace from '../components/text-annotation/TextAnnotationWorkspace.jsx';
import { ImageAnnotationWorkspace } from '../features/image-annotation';
import { ProjectForm } from '../components/projects/ProjectForm.jsx';
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
  const [showChangeManagerModal, setShowChangeManagerModal] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [selectedReviewLevel, setSelectedReviewLevel] = useState(1);
  
  // Settings states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Resource Pool states
  const [poolStatus, setPoolStatus] = useState(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'project_manager';
  const isPMProvided = project?.config?.resource_provider === 'project_manager';
  const isAnnotator = currentUser.role === 'annotator';

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjectById(id);
      setProject(data);
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

  // Get the appropriate resource service based on project type
  const getResourceService = () => {
    return project?.annotation_type === 'image' ? imageResourceService : textResourceService;
  };

  // Refresh team data when switching to team tab
  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeam();
    }
    // Fetch pool status when pool tab is active
    if (activeTab === 'pool' && isPMProvided && project) {
      const fetchPoolStatus = async () => {
        setPoolLoading(true);
        try {
          const service = project.annotation_type === 'image' ? imageResourceService : textResourceService;
          const status = await service.getPoolStatus(id);
          setPoolStatus(status);
        } catch (error) {
          console.error('Failed to fetch pool status:', error);
        } finally {
          setPoolLoading(false);
        }
      };
      fetchPoolStatus();
    }
  }, [activeTab, id, isPMProvided, project]);

  const handleStatusChange = async (newStatus) => {
    try {
      await projectService.updateProject(id, { status: newStatus });
      toast.success('Status updated');
      fetchProject();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleEditProject = async (formData) => {
    try {
      setIsSubmitting(true);
      await projectService.updateProject(id, formData);
      toast.success('Project updated successfully');
      fetchProject();
      fetchTeam(); // Refresh team to get updated manager
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReviewers = async () => {
    try {
      await assignmentService.addReviewers(id, selectedUsers);
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
      await assignmentService.addAnnotators(id, selectedUsers);
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
          {/* Annotations tab - hidden for annotators (they use task-based workflow) */}
          {!isAnnotator && (
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
          )}
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
          {canEdit && isPMProvided && (
            <button
              onClick={() => setActiveTab('pool')}
              className={`pb-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pool'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4" />
              Resource Pool
            </button>
          )}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Task Queue Quick Access - Show for all modes */}
          <div className={`card bg-gradient-to-r ${isPMProvided ? 'from-primary-50 to-indigo-50 border border-primary-200' : 'from-emerald-50 to-teal-50 border border-emerald-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isPMProvided ? 'Task-Based Workflow' : 'Ready to Annotate?'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isPMProvided 
                    ? 'Resources are provided by the project manager. Click below to start annotating tasks from the queue.'
                    : 'Upload your own resources and annotate them. Click below to get started.'}
                </p>
              </div>
              {isAnnotator && (
                <button
                  onClick={() => navigate(`/projects/${id}/tasks`)}
                  className={`flex items-center gap-2 px-6 py-3 ${isPMProvided ? 'bg-primary-600 hover:bg-primary-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg font-medium`}
                >
                  {isPMProvided ? (
                    <>
                      <FileText className="w-5 h-5" />
                      Start Annotating
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Annotate
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

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
        <>
          {/* DEBUG BANNER */}
          <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 mb-4">
            <p className="font-bold text-yellow-800">DEBUG: Annotations Tab Active</p>
            <p className="text-sm text-yellow-700">
              annotation_type: {project.annotation_type} | 
              userRole: {currentUser?.role} | 
              projectId: {id}
            </p>
          </div>
          
          {project.annotation_type === 'image' ? (
            <ImageAnnotationWorkspace 
              project={project}
              userRole={currentUser?.role}
            />
          ) : (
            <TextAnnotationWorkspace 
              projectId={id} 
              userRole={currentUser?.role}
              project={project}
            />
          )}
        </>
      )}

      {/* Helper function to group reviewers by level */}
      {(() => {
        const getReviewersByLevel = (reviewers) => {
          if (!reviewers || reviewers.length === 0) return {};
          const grouped = {};
          reviewers.forEach(reviewer => {
            const level = reviewer.review_level || 1;
            if (!grouped[level]) grouped[level] = [];
            grouped[level].push(reviewer);
          });
          return grouped;
        };
        const maxLevel = Math.max(
          1,
          ...(team.reviewers?.map(r => r.review_level || 1) || [1])
        );
        const reviewersByLevel = getReviewersByLevel(team.reviewers);
        
        return null;
      })()}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Manager */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Project Manager</h3>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    fetchAvailableUsers();
                    setShowChangeManagerModal(true);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Change Manager
                </button>
              )}
            </div>
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

          {/* Reviewers by Level - Dynamic Sections */}
          {(() => {
            const getReviewersByLevel = (reviewers) => {
              if (!reviewers || reviewers.length === 0) return {};
              const grouped = {};
              reviewers.forEach(reviewer => {
                const level = reviewer.review_level || 1;
                if (!grouped[level]) grouped[level] = [];
                grouped[level].push(reviewer);
              });
              return grouped;
            };
            
            const reviewersByLevel = getReviewersByLevel(team.reviewers);
            const allLevels = Object.keys(reviewersByLevel).map(Number).sort((a, b) => a - b);
            const maxLevel = allLevels.length > 0 ? Math.max(...allLevels) : 0;
            
            return (
              <>
                {/* Review Level Sections */}
                {allLevels.map(level => {
                  const levelReviewers = reviewersByLevel[level] || [];
                  const levelColors = {
                    1: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', avatar: 'bg-blue-500' },
                    2: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', avatar: 'bg-purple-500' },
                    3: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', avatar: 'bg-amber-500' },
                    4: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', avatar: 'bg-emerald-500' },
                    5: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800', avatar: 'bg-rose-500' },
                  };
                  const colors = levelColors[level] || levelColors[5];
                  
                  return (
                    <div key={level} className={`card ${colors.bg} border ${colors.border}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            Level {level} Reviewers
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.badge}`}>
                            {levelReviewers.length} {levelReviewers.length === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setSelectedReviewLevel(level);
                              setShowAddReviewerModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Level {level}
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {levelReviewers.map(reviewer => (
                          <div key={reviewer.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${colors.avatar} rounded-full flex items-center justify-center text-white font-semibold`}>
                                {getAvatarInitials(reviewer.full_name, reviewer.email)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{reviewer.full_name}</div>
                                <div className="text-sm text-gray-600">{reviewer.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={reviewer.role} />
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
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty State - No Reviewers */}
                {allLevels.length === 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Reviewers</h3>
                    </div>
                    <p className="text-gray-500 mb-4">No reviewers assigned yet.</p>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setSelectedReviewLevel(1);
                          setShowAddReviewerModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Reviewers
                      </button>
                    )}
                  </div>
                )}
                
                {/* Add New Level Button */}
                {canEdit && allLevels.length > 0 && (
                  <div className="card border-2 border-dashed border-gray-300">
                    <div className="flex items-center justify-center py-4">
                      <button
                        onClick={() => {
                          setSelectedReviewLevel(maxLevel + 1);
                          setShowAddReviewerModal(true);
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Level {maxLevel + 1} Reviewers</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

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

      {/* Resource Pool Tab */}
      {activeTab === 'pool' && canEdit && isPMProvided && (
        <div className="space-y-6">
          {/* Pool Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Available</p>
                  <p className="text-2xl font-bold text-green-800">{poolStatus?.data?.counts?.available || 0}</p>
                </div>
              </div>
            </div>
            <div className="card bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700">Locked</p>
                  <p className="text-2xl font-bold text-amber-800">{poolStatus?.data?.counts?.locked || 0}</p>
                </div>
              </div>
            </div>
            <div className="card bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Completed</p>
                  <p className="text-2xl font-bold text-blue-800">{poolStatus?.data?.counts?.completed || 0}</p>
                </div>
              </div>
            </div>
            <div className="card bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <SkipForward className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">Skipped</p>
                  <p className="text-2xl font-bold text-gray-800">{poolStatus?.data?.counts?.skipped || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Upload Section */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Bulk Upload Resources</h3>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('bulk-upload-input').click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Drag and drop files here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                {project.annotation_type === 'image' 
                  ? 'Upload images (PNG, JPG, JPEG, GIF, WebP)'
                  : 'Upload text files (TXT, CSV, JSON)'}
              </p>
              <input
                id="bulk-upload-input"
                type="file"
                multiple
                accept={project.annotation_type === 'image' ? 'image/*' : '.txt,.csv,.json'}
                className="hidden"
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Selected files:</span>
                  <button 
                    onClick={() => setSelectedFiles([])}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm py-1">
                      {project.annotation_type === 'image' ? (
                        <Image className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    setBulkUploading(true);
                    try {
                      const service = project.annotation_type === 'image' ? imageResourceService : textResourceService;
                      await service.bulkUploadResources(id, selectedFiles);
                      toast.success(`Uploaded ${selectedFiles.length} files successfully`);
                      setSelectedFiles([]);
                      // Refresh pool status
                      const status = await service.getPoolStatus(id);
                      setPoolStatus(status);
                    } catch (error) {
                      toast.error('Failed to upload files');
                    } finally {
                      setBulkUploading(false);
                    }
                  }}
                  disabled={bulkUploading}
                  className="mt-4 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {bulkUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
                </button>
              </div>
            )}
          </div>

          {/* Locked Resources Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Locked Resources</h3>
              <button
                onClick={async () => {
                  try {
                    const service = project.annotation_type === 'image' ? imageResourceService : textResourceService;
                    const status = await service.getPoolStatus(id);
                    setPoolStatus(status);
                    toast.success('Pool status refreshed');
                  } catch (error) {
                    toast.error('Failed to refresh pool status');
                  }
                }}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Refresh
              </button>
            </div>
            {poolStatus?.data?.locked_resources && poolStatus.data.locked_resources.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Resource</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Locked By</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Locked At</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {poolStatus.data.locked_resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {project.annotation_type === 'image' ? (
                              <Image className="w-4 h-4 text-gray-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm">{resource.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                            {resource.pool_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {resource.locked_by?.full_name || resource.locked_by?.email || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {resource.locked_at ? new Date(resource.locked_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={async () => {
                              try {
                                const service = project.annotation_type === 'image' ? imageResourceService : textResourceService;
                                await service.releaseLock(id, resource.id);
                                toast.success('Lock released');
                                const status = await service.getPoolStatus(id);
                                setPoolStatus(status);
                              } catch (error) {
                                toast.error('Failed to release lock');
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Unlock className="w-4 h-4" />
                            Release
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No locked resources</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && canEdit && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Project Settings</h3>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Edit className="w-4 h-4" />
                Edit Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Project Name</p>
                <p className="text-lg font-semibold text-gray-900">{project.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <StatusBadge status={project.status} />
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{project.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Annotation Type</p>
                <p className="text-gray-900 capitalize">{project.annotation_type || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-gray-900">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
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
            <div className="p-4 border-b border-gray-200 space-y-3">
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
              {/* Review Level Selection */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">Assign Review Level:</label>
                <select
                  value={selectedReviewLevel}
                  onChange={(e) => setSelectedReviewLevel(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  {[1, 2, 3, 4, 5].map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">
                  {selectedReviewLevel === 1 ? '(First reviewer - closest to annotator)' : 
                   selectedReviewLevel === 2 ? '(Second reviewer)' :
                   `(Level ${selectedReviewLevel} reviewer)`}
                </span>
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
                  setSelectedReviewLevel(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Use addReviewersWithLevels to assign specific level
                    const reviewersWithLevels = selectedUsers.map(userId => ({
                      user_id: userId,
                      review_level: selectedReviewLevel
                    }));
                    await assignmentService.addReviewersWithLevels(id, reviewersWithLevels);
                    toast.success(`Added ${selectedUsers.length} reviewer(s) at Level ${selectedReviewLevel}`);
                    setShowAddReviewerModal(false);
                    setSelectedUsers([]);
                    setSelectedReviewLevel(1);
                    fetchTeam();
                  } catch (error) {
                    toast.error('Failed to add reviewers');
                  }
                }}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedUsers.length > 0 ? `${selectedUsers.length} at Level ${selectedReviewLevel}` : 'Selected'}
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

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Edit Project</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ProjectForm
                project={project}
                onSubmit={handleEditProject}
                onCancel={() => setShowEditModal(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Manager Modal */}
      {showChangeManagerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Change Project Manager</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Select a new project manager. Only users with Project Manager or Admin role can be assigned.
              </p>
              <select
                value={selectedManagerId || ''}
                onChange={(e) => setSelectedManagerId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a manager...</option>
                {availableUsers
                  .filter(u => u.role === 'project_manager' || u.role === 'admin')
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </option>
                  ))}
              </select>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowChangeManagerModal(false);
                  setSelectedManagerId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedManagerId) {
                    toast.error('Please select a manager');
                    return;
                  }
                  try {
                    await assignmentService.updateManager(id, selectedManagerId);
                    toast.success('Manager updated successfully');
                    setShowChangeManagerModal(false);
                    setSelectedManagerId(null);
                    fetchTeam();
                    fetchProject();
                  } catch (error) {
                    toast.error('Failed to update manager');
                  }
                }}
                disabled={!selectedManagerId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Manager
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
                This will permanently delete project and all associated assignments. 
                Type project name to confirm.
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