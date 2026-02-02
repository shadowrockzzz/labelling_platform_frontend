import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Archive, ArchiveRestore, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { StatusBadge, PROJECT_STATUS_OPTIONS } from '../utils/roleHelpers.jsx';
import { projectService } from '../services/projectService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { ConfirmModal } from '../components/common/ConfirmModal.jsx';
import { ProjectForm } from '../components/projects/ProjectForm.jsx';
import toast from 'react-hot-toast';

export const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await projectService.getAllProjects();
      
      let filtered = allProjects;
      
      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
      }
      
      // Filter by search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) ||
          (p.description && p.description.toLowerCase().includes(search))
        );
      }
      
      setProjects(filtered);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, searchTerm]);

  const getSubtitle = () => {
    switch (user.role) {
      case 'admin':
      case 'project_manager':
        return 'Manage and track all your projects';
      case 'reviewer':
        return 'Projects assigned for review';
      case 'annotator':
        return 'Projects assigned for annotation';
      default:
        return 'Browse your projects';
    }
  };

  const getRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const canEditProject = () => {
    return user.role === 'admin' || user.role === 'project_manager';
  };

  // Create project handler
  const handleCreateProject = async (projectData) => {
    try {
      setIsSubmitting(true);
      await projectService.createProject(projectData);
      toast.success('Project created successfully');
      setShowCreateModal(false);
      fetchProjects();
    } catch (error) {
      console.error('Create project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit project handler
  const handleEditProject = async (projectData) => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      await projectService.updateProject(selectedProject.id, projectData);
      toast.success('Project updated successfully');
      setShowEditModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Update project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  // Archive/Restore project handler
  const handleArchiveProject = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      const newStatus = selectedProject.status === 'archived' ? 'active' : 'archived';
      await projectService.updateProject(selectedProject.id, {
        name: selectedProject.name,
        description: selectedProject.description,
        status: newStatus
      });
      toast.success(`Project ${newStatus === 'archived' ? 'archived' : 'restored'} successfully`);
      setShowArchiveModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Archive project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update project status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open archive modal
  const openArchiveModal = (project) => {
    setSelectedProject(project);
    setShowArchiveModal(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">{getSubtitle()}</p>
          </div>
          {canEditProject() && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2">
            {['all', 'active', 'completed', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Archive className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              {/* Status Badge */}
              <div className="flex justify-end mb-4">
                <StatusBadge status={project.status} />
              </div>

              {/* Project Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description provided'}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{project.reviewer_count || 0}</span> Reviewers
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{project.annotator_count || 0}</span> Annotators
                </span>
              </div>

              {/* Created Date */}
              <div className="text-sm text-gray-500 mb-4">
                Created: {getRelativeDate(project.created_at)}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a
                  href={`/projects/${project.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                {canEditProject() && (
                  <>
                    <button
                      onClick={() => openEditModal(project)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => openArchiveModal(project)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={project.status === 'archived' ? 'Restore' : 'Archive'}
                    >
                      {project.status === 'archived' ? (
                        <ArchiveRestore className="w-4 h-4 text-green-600" />
                      ) : (
                        <Archive className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          project={null}
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        title="Edit Project"
        size="lg"
      >
        {selectedProject && (
          <ProjectForm
            project={selectedProject}
            onSubmit={handleEditProject}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Archive/Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedProject(null);
        }}
        onConfirm={handleArchiveProject}
        title={selectedProject?.status === 'archived' ? 'Restore Project' : 'Archive Project'}
        message={selectedProject?.status === 'archived' 
          ? `Are you sure you want to restore "${selectedProject?.name}"?` 
          : `Are you sure you want to archive "${selectedProject?.name}"?`
        }
        description={selectedProject?.status === 'archived'
          ? 'Restoring this project will make it active and accessible to all team members.'
          : 'Archived projects will be hidden from regular users and cannot be modified until restored.'
        }
        confirmText={selectedProject?.status === 'archived' ? 'Restore' : 'Archive'}
        isLoading={isSubmitting}
        type={selectedProject?.status === 'archived' ? 'info' : 'warning'}
      />
    </div>
  );
};
