/**
 * ReviewTaskWorkspace Component
 * 
 * Main workspace for reviewers to review annotations with:
 * - Start Review button
 * - View current review task with UUID chain
 * - Approve/Reject/Edit/Skip actions
 * - Review chain display showing all participants
 * - Full TextAnnotationEditor in edit mode
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import reviewTaskService, { formatReviewChain } from '../../services/reviewTaskService';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import TextAnnotationEditor from './TextAnnotationEditor';
import { Edit, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewTaskWorkspace = ({ annotationType = 'text', projectId: projectIdProp, project, team }) => {
  const { projectId: routeProjectId } = useParams();
  const projectId = projectIdProp || routeProjectId;  // Use prop if provided, else route param
  const { user } = useAuth();
  
  // Auto-detect reviewer level from project team assignments
  const reviewLevel = useMemo(() => {
    if (!user || !team?.reviewers) return 1;
    const reviewerAssignment = team.reviewers.find(r => r.id === user.id || r.user_id === user.id);
    return reviewerAssignment?.review_level || 1;
  }, [user, team]);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [annotation, setAnnotation] = useState(null);
  const [resource, setResource] = useState(null);
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [poolStats, setPoolStats] = useState(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAnnotationData, setEditedAnnotationData] = useState(null);
  const [fullResource, setFullResource] = useState(null); // Resource with full_content for editor
  const [loadingResource, setLoadingResource] = useState(false);
  
  // Get project config and labels
  const projectConfig = project?.config || {};
  const projectLabels = project?.labels || [];

  // Load pool stats on mount
  useEffect(() => {
    loadPoolStats();
  }, [projectId, reviewLevel]);

  const loadPoolStats = async () => {
    try {
      const stats = await reviewTaskService.getReviewPoolStats(annotationType, projectId, reviewLevel);
      setPoolStats(stats);
    } catch (err) {
      console.error('Error loading pool stats:', err);
    }
  };

  const handleStartReview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reviewTaskService.startReview(annotationType, projectId, reviewLevel);
      
      if (result.has_task) {
        setReviewTask(result.review_task);
        setAnnotation(result.annotation);
        setResource(result.resource);
      } else {
        setError(result.message || 'No tasks available for review');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start review');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (action === 'reject' && !comment) {
      setPendingAction(action);
      setShowCommentModal(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const actionData = { action };
      if (comment) {
        actionData.comment = comment;
      }
      
      await reviewTaskService.reviewAction(annotationType, reviewTask.id, actionData);
      
      // Clear current task and get next
      setReviewTask(null);
      setAnnotation(null);
      setResource(null);
      setComment('');
      setShowCommentModal(false);
      setPendingAction(null);
      
      // Auto-start next review
      await handleStartReview();
      loadPoolStats();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} annotation`);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!reviewTask) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await reviewTaskService.skipReview(annotationType, reviewTask.id);
      
      if (result.next_task) {
        setReviewTask(result.next_task);
        setAnnotation(result.annotation);
        setResource(result.resource);
      } else {
        setReviewTask(null);
        setAnnotation(null);
        setResource(null);
        setError(result.message || 'No more tasks available');
      }
      loadPoolStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to skip task');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = () => {
    if (pendingAction) {
      handleAction(pendingAction);
    }
  };

  // Format review chain for display
  const formattedChain = annotation?.review_chain ? formatReviewChain(annotation.review_chain) : [];

  // Initialize edited data when annotation changes
  useEffect(() => {
    if (annotation?.annotation_data) {
      setEditedAnnotationData(JSON.parse(JSON.stringify(annotation.annotation_data)));
    }
    // Reset full resource when annotation changes
    setFullResource(null);
  }, [annotation]);
  
  // Fetch full resource content when entering edit mode
  const fetchFullResource = async () => {
    if (!resource?.id || !projectId) return;
    
    setLoadingResource(true);
    try {
      // Import the service dynamically to avoid circular deps
      const { textResourceService } = await import('../../services/textResourceService');
      const fullRes = await textResourceService.getResource(projectId, resource.id);
      setFullResource(fullRes);
    } catch (err) {
      console.error('Failed to fetch full resource:', err);
      toast.error('Failed to load resource content');
    } finally {
      setLoadingResource(false);
    }
  };

  // Handle edit mode toggle
  const handleToggleEditMode = async () => {
    if (!isEditMode) {
      // Entering edit mode - fetch full resource content if needed
      if (!fullResource && resource?.id) {
        await fetchFullResource();
      }
    } else {
      // Cancel edit - reset to original
      setEditedAnnotationData(JSON.parse(JSON.stringify(annotation?.annotation_data)));
    }
    setIsEditMode(!isEditMode);
  };
  
  // Handle annotation save from TextAnnotationEditor
  const handleEditorSave = async (data, closeEditor = false) => {
    // The TextAnnotationEditor handles its own API calls for spans
    // We just need to refresh the annotation data
    if (closeEditor) {
      // Refresh the review task to get updated annotation
      setIsEditMode(false);
      await handleStartReview();
    }
  };

  // Handle annotation data changes in edit mode
  const handleAnnotationDataChange = (newData) => {
    setEditedAnnotationData(newData);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const actionData = { 
        action: 'edit', 
        annotation_data: editedAnnotationData,
        comment: comment || 'Reviewer edited annotation'
      };
      
      await reviewTaskService.reviewAction(annotationType, reviewTask.id, actionData);
      
      toast.success('Annotation edited successfully');
      setIsEditMode(false);
      setComment('');
      
      // Clear and get next task
      setReviewTask(null);
      setAnnotation(null);
      setResource(null);
      await handleStartReview();
      loadPoolStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save edit');
      toast.error('Failed to save edit');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reviewTask) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Review Workspace</h2>
        <p className="text-gray-600 mt-1">
          Review and approve annotations for this project
        </p>
      </div>

      {/* Pool Stats */}
      {poolStats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-blue-600">{poolStats.total_available}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{poolStats.total_locked}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{poolStats.total_completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">My Tasks</p>
            <p className="text-2xl font-bold text-purple-600">{poolStats.my_locked_count}</p>
          </div>
        </div>
      )}

      {/* Review Level Display - Read Only */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          You are reviewing at <span className="font-semibold text-blue-700">Level {reviewLevel}</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Start Review Button (when no task) */}
      {!reviewTask && (
        <div className="text-center py-12">
          <button
            onClick={handleStartReview}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Reviewing'}
          </button>
          <p className="mt-4 text-gray-500">
            Click to get the next available annotation for review
          </p>
        </div>
      )}

      {/* Review Task Display */}
      {reviewTask && annotation && (
        <div className="space-y-6">
          {/* Task Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Review Task #{reviewTask.short_id}</h3>
                <p className="text-sm text-gray-500">
                  Review Level: {reviewTask.review_level} | Status: {reviewTask.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Annotation ID: {annotation.id}</p>
                {annotation.annotator_task_id && (
                  <p className="text-xs text-gray-400">
                    Annotator Task: {annotation.annotator_task_id.substring(0, 8)}...
                  </p>
                )}
              </div>
            </div>

            {/* Resource Preview / Editor */}
            {resource && (
              <div className="border-t pt-4">
                {isEditMode ? (
                  // Full Annotation Editor in Edit Mode
                  <div className="space-y-4">
                    {loadingResource ? (
                      <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                        <span className="ml-3 text-gray-600">Loading editor...</span>
                      </div>
                    ) : fullResource ? (
                      <TextAnnotationEditor
                        resource={fullResource}
                        annotation={annotation}
                        annotationSubType={projectConfig?.textSubType || 'ner'}
                        annotations={[]}
                        onSave={handleEditorSave}
                        onCancel={() => setIsEditMode(false)}
                        loading={loading}
                        projectConfig={projectConfig}
                        projectId={projectId}
                      />
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                        <p className="text-yellow-800">Unable to load resource content for editing.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // View Mode - Show resource preview and annotation data
                  <>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resource</h4>
                    <p className="text-gray-900">{resource.name || `Resource #${annotation.resource_id}`}</p>
                    {resource.content_preview && (
                      <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-3 rounded">
                        {resource.content_preview}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Annotation Data Preview - Only show when not in edit mode */}
            {!isEditMode && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Annotation Data</h4>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-60">
                  {JSON.stringify(annotation.annotation_data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Review Chain */}
          {formattedChain.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Review History</h4>
              <div className="space-y-2">
                {formattedChain.map((entry, index) => (
                  <div key={index} className="flex items-center text-sm border-l-2 border-blue-200 pl-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                      entry.action === 'approved' ? 'bg-green-100 text-green-700' :
                      entry.action === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {entry.action}
                    </span>
                    <span className="text-gray-600">
                      Level {entry.level} | Reviewer #{entry.reviewerId}
                    </span>
                    <span className="text-gray-400 ml-auto text-xs">
                      {entry.actedAt}
                    </span>
                    {entry.comment && (
                      <p className="text-gray-500 text-xs mt-1 w-full">{entry.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Mode Toggle & Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700">Actions</h4>
              <button
                onClick={handleToggleEditMode}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isEditMode 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditMode ? (
                  <>
                    <Eye className="w-4 h-4" />
                    View Mode
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Edit Mode
                  </>
                )}
              </button>
            </div>
            
            {/* Comment Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Comment (optional for approve, required for reject)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Add a comment..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAction('approve')}
                disabled={loading || isEditMode}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading || !comment || isEditMode}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:bg-gray-400"
              >
                ✗ Reject
              </button>
              {isEditMode ? (
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Edit
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal for Reject */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rejection Reason Required</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this annotation.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Enter rejection reason..."
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setPendingAction(null);
                  setComment('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewTaskWorkspace;