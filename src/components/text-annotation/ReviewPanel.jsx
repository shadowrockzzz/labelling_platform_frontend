import React, { useState, useEffect } from 'react';
import { ANNOTATION_STATUSES } from '../../features/text-annotation/constants';
import { Plus, Eye, CheckCircle, XCircle, FileText, MessageSquare, Edit, ChevronLeft, SkipForward, Layers, Play, RefreshCw, Loader2 } from 'lucide-react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { textResourceService } from '../../services/textResourceService';
import reviewTaskService from '../../services/reviewTaskService';
import toast from 'react-hot-toast';
import EditAnnotationForm from './EditAnnotationForm';

/**
 * ReviewPanel Component
 * Shows submitted annotations for reviewers with ability to:
 * - View resource content
 * - Approve annotations
 * - Update & Approve (with corrections)
 * - Reject with comments
 * - Skip and move to next annotation
 * - Start reviewing from the review pool
 */
const ReviewPanel = ({ 
  projectId, 
  annotations, 
  onReview, 
  loading, 
  projectLabels,
  maxReviewLevel = 1,
  currentReviewLevel = 1,
  currentReviewerName = null,
  reviewerLevel = 1 // The current reviewer's assigned level
}) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [resourceContent, setResourceContent] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [isCreatingCorrection, setIsCreatingCorrection] = useState(false);
  const [showCorrectionHistory, setShowCorrectionHistory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Review pool state
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [currentReviewTask, setCurrentReviewTask] = useState(null);
  const [poolStats, setPoolStats] = useState(null);
  const [isLoadingPoolStats, setIsLoadingPoolStats] = useState(false);

  // Load submitted annotations for review
  const [submittedAnnotations, setSubmittedAnnotations] = useState([]);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadSubmittedAnnotations();
      loadPoolStats();
    }
  }, [projectId, reviewerLevel]);

  const loadSubmittedAnnotations = async () => {
    try {
      setInitError(null);
      const response = await textAnnotationService.listAnnotations(projectId, {
        status: `${ANNOTATION_STATUSES.SUBMITTED},${ANNOTATION_STATUSES.UNDER_REVIEW}`,
      });
      setSubmittedAnnotations(response.data || []);
    } catch (error) {
      console.error('Failed to load submitted annotations:', error);
      setInitError('Failed to load annotations. Please refresh the page.');
    }
  };

  const loadPoolStats = async () => {
    if (!projectId) return;
    
    setIsLoadingPoolStats(true);
    try {
      const stats = await reviewTaskService.getReviewPoolStats('text', projectId, reviewerLevel);
      setPoolStats(stats);
    } catch (error) {
      console.error('Failed to load pool stats:', error);
      // Don't show error - the button should still work
      setPoolStats({ available: 0, locked: 0 });
    } finally {
      setIsLoadingPoolStats(false);
    }
  };

  const handleStartReviewing = async () => {
    if (!projectId) return;
    
    setIsStartingReview(true);
    try {
      const taskData = await reviewTaskService.startReview('text', projectId, reviewerLevel);
      
      if (taskData && taskData.annotation) {
        setSelectedAnnotation(taskData.annotation);
        setCurrentReviewTask(taskData.review_task);
        
        // Load resource content for the annotation
        if (taskData.annotation.resource_id) {
          setLoadingResource(true);
          try {
            const resource = await textResourceService.getResource(projectId, taskData.annotation.resource_id);
            setResourceContent(resource);
          } catch (error) {
            console.error('Failed to load resource:', error);
            toast.error('Failed to load resource content');
          } finally {
            setLoadingResource(false);
          }
        }
        
        toast.success('Review task loaded successfully');
      } else if (taskData && taskData.message) {
        toast.info(taskData.message);
      }
    } catch (error) {
      console.error('Failed to start review:', error);
      toast.error(error.response?.data?.detail || 'Failed to get review task');
    } finally {
      setIsStartingReview(false);
    }
  };

  useEffect(() => {
    // Load corrections and resource when an annotation is selected
    const loadData = async () => {
      if (selectedAnnotation && projectId) {
        // Load corrections
        try {
          const response = await textAnnotationService.listCorrections(
            projectId,
            selectedAnnotation.id
          );
          setCorrections(response.data || []);
        } catch (error) {
          console.error('Failed to load corrections:', error);
        }
        
        // Load resource content if not already loaded
        if (!resourceContent && selectedAnnotation.resource_id) {
          setLoadingResource(true);
          try {
            const resource = await textResourceService.getResource(projectId, selectedAnnotation.resource_id);
            setResourceContent(resource);
          } catch (error) {
            console.error('Failed to load resource:', error);
            toast.error('Failed to load resource content');
          } finally {
            setLoadingResource(false);
          }
        }
      }
    };
    
    loadData();
  }, [selectedAnnotation, projectId]);

  const handleSelectAnnotation = (annotation) => {
    setSelectedAnnotation(annotation);
    setReviewComment('');
    setRejectComment('');
    setResourceContent(null);
    setCurrentReviewTask(null);
  };

  const handleBackToList = () => {
    setSelectedAnnotation(null);
    setResourceContent(null);
    setReviewComment('');
    setRejectComment('');
    setCurrentReviewTask(null);
    loadSubmittedAnnotations();
    loadPoolStats();
  };

  const handleApprove = async () => {
    if (!selectedAnnotation) return;
    
    setIsSubmitting(true);
    try {
      await onReview(selectedAnnotation.id, 'approve', reviewComment || null);
      toast.success('Annotation approved');
      handleBackToList();
    } catch (error) {
      toast.error('Failed to approve annotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAnnotation) return;
    if (!rejectComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReview(selectedAnnotation.id, 'reject', rejectComment);
      toast.success('Annotation rejected and sent back to annotator');
      setShowRejectDialog(false);
      handleBackToList();
    } catch (error) {
      toast.error('Failed to reject annotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCorrection = async (correctedData, comment) => {
    if (!selectedAnnotation || !projectId) return;
    
    setIsCreatingCorrection(true);
    try {
      await textAnnotationService.createCorrection(
        projectId,
        selectedAnnotation.id,
        correctedData,
        comment
      );
      toast.success('Correction created successfully');
      setShowCorrectionForm(false);
      setReviewComment('');
      
      // Reload corrections
      const response = await textAnnotationService.listCorrections(
        projectId,
        selectedAnnotation.id
      );
      setCorrections(response.data || []);
    } catch (error) {
      console.error('Failed to create correction:', error);
      toast.error(error.response?.data?.detail || 'Failed to create correction');
    } finally {
      setIsCreatingCorrection(false);
    }
  };

  const handleUpdateAndApprove = async () => {
    // Open the correction form
    setShowCorrectionForm(true);
  };

  const handleSkipReview = async () => {
    if (!selectedAnnotation || !projectId) return;
    
    setIsSkipping(true);
    try {
      // If we have a review task from the pool, use the new skip API
      if (currentReviewTask && currentReviewTask.id) {
        const result = await reviewTaskService.skipReview('text', currentReviewTask.id);
        
        if (result && result.next_task && result.next_task.annotation) {
          // Load the next task
          setSelectedAnnotation(result.next_task.annotation);
          setCurrentReviewTask(result.next_task.review_task);
          setReviewComment('');
          setRejectComment('');
          setCorrections([]);
          
          // Load resource content
          if (result.next_task.annotation.resource_id) {
            setLoadingResource(true);
            try {
              const resource = await textResourceService.getResource(projectId, result.next_task.annotation.resource_id);
              setResourceContent(resource);
            } catch (error) {
              console.error('Failed to load resource:', error);
            } finally {
              setLoadingResource(false);
            }
          }
          
          toast.success('Skipped. Loaded next review task.');
        } else {
          toast.success('Skipped annotation. No more tasks available.');
          handleBackToList();
        }
      } else {
        // Legacy skip
        await textResourceService.skipReviewAnnotation(projectId, selectedAnnotation.id);
        toast.success('Skipped annotation');
        handleBackToList();
      }
    } catch (error) {
      console.error('Failed to skip annotation:', error);
      toast.error('Failed to skip annotation');
    } finally {
      setIsSkipping(false);
    }
  };

  // Use submittedAnnotations if annotations prop is empty
  const pendingReview = annotations?.length > 0 
    ? annotations.filter(
        a => a.status === ANNOTATION_STATUSES.UNDER_REVIEW || a.status === ANNOTATION_STATUSES.SUBMITTED
      )
    : submittedAnnotations;

  if (!selectedAnnotation) {
    return (
      <div className="space-y-6">
        {/* DEBUG: Component loaded successfully */}
        <div className="bg-green-100 border-2 border-green-500 rounded-lg p-2 text-green-800 text-sm">
          ✓ ReviewPanel loaded. Your level: {reviewerLevel} | Project ID: {projectId}
        </div>
        
        {/* PROMINENT START REVIEWING BUTTON - ALWAYS VISIBLE AT TOP */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Play className="w-6 h-6" />
                Ready to Review?
              </h3>
              <p className="text-blue-100">
                {poolStats ? (
                  <>
                    <span className="font-bold text-white">{poolStats.available || 0}</span> tasks waiting at Level {reviewerLevel}
                    {poolStats.locked > 0 && (
                      <span className="ml-2">• <span className="font-bold text-white">{poolStats.locked}</span> in progress</span>
                    )}
                  </>
                ) : (
                  'Loading pool statistics...'
                )}
              </p>
            </div>
            <button
              onClick={handleStartReviewing}
              disabled={isStartingReview}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                isStartingReview
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transform hover:scale-105'
              }`}
            >
              {isStartingReview ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading Task...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>START REVIEWING</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Review Queue List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Review Queue</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {pendingReview.length} pending
            </span>
          </div>
        
          {/* Manual selection list */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Or select from queue:</h4>
            <button
              onClick={() => { loadSubmittedAnnotations(); loadPoolStats(); }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          {pendingReview.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">All caught up!</p>
              <p className="text-gray-400 text-sm mt-1">No annotations pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReview.map((annotation) => (
                <div
                  key={annotation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => handleSelectAnnotation(annotation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                          {annotation.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          Annotation #{annotation.id}
                        </span>
                        {annotation.current_review_level && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                            Level {annotation.current_review_level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          Resource #{annotation.resource_id}
                        </span>
                        {annotation.label && (
                          <span>Label: {annotation.label}</span>
                        )}
                      </div>
                      {annotation.annotator && (
                        <p className="text-sm text-gray-500 mt-1">
                          By: {annotation.annotator.full_name || annotation.annotator.email}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(annotation.updated_at).toLocaleDateString()}
                      </span>
                      <ChevronLeft className="w-5 h-5 text-gray-400 mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToList}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              Reviewing Annotation #{selectedAnnotation.id}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {selectedAnnotation.current_review_level && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Level {selectedAnnotation.current_review_level}
              </span>
            )}
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {selectedAnnotation.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resource Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Resource Content</h4>
          
          {loadingResource ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading content...</span>
            </div>
          ) : resourceContent ? (
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {resourceContent.full_content || resourceContent.content || 'No content available'}
              </pre>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Resource content not available
            </div>
          )}
          
          {/* Annotation data preview */}
          {selectedAnnotation.annotation_data && (
            <div className="mt-4">
              <details className="bg-gray-50 rounded-lg">
                <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700">
                  View Annotation Data
                </summary>
                <div className="px-4 py-3 border-t border-gray-200">
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                    {JSON.stringify(selectedAnnotation.annotation_data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Right: Review Actions */}
        <div className="space-y-4">
          {/* Annotation Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Annotation Details</h4>
            
            <div className="space-y-2 text-sm">
              {selectedAnnotation.label && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Label:</span>
                  <span className="font-medium">{selectedAnnotation.label}</span>
                </div>
              )}
              {selectedAnnotation.span_start !== null && selectedAnnotation.span_end !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Span:</span>
                  <span className="font-medium">
                    {selectedAnnotation.span_start} - {selectedAnnotation.span_end}
                  </span>
                </div>
              )}
              {selectedAnnotation.annotation_type && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{selectedAnnotation.annotation_type.toUpperCase()}</span>
                </div>
              )}
              {selectedAnnotation.annotator && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Annotator:</span>
                  <span className="font-medium">
                    {selectedAnnotation.annotator.full_name || selectedAnnotation.annotator.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Review Comment Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Comment (optional for approval)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any notes about this review..."
            />
          </div>

          {/* Corrections Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Corrections ({corrections.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowCorrectionForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Suggest Correction</span>
              </button>
            </div>

            {corrections.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {corrections.map((correction) => (
                  <div
                    key={correction.id}
                    className={`border rounded-md p-3 ${
                      correction.status === 'accepted'
                        ? 'border-green-300 bg-green-50'
                        : correction.status === 'rejected'
                        ? 'border-red-300 bg-red-50'
                        : 'border-yellow-300 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            correction.status === 'accepted'
                              ? 'bg-green-200 text-green-800'
                              : correction.status === 'rejected'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {correction.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(correction.created_at).toLocaleString()}
                          </span>
                        </div>
                        {correction.comment && (
                          <p className="text-sm text-gray-700 italic">"{correction.comment}"</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCorrectionHistory(
                          showCorrectionHistory === correction.id ? null : correction.id
                        )}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    {showCorrectionHistory === correction.id && correction.corrected_data && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                          {JSON.stringify(correction.corrected_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No corrections suggested yet</p>
            )}
          </div>

          {/* Review Level Info */}
          {maxReviewLevel > 1 && (
            <div className="bg-indigo-50 rounded-lg shadow-md p-4 border border-indigo-200">
              <div className="flex items-center space-x-2 mb-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">Review Chain</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-700">
                  Level <span className="font-bold">{currentReviewLevel}</span> of <span className="font-bold">{maxReviewLevel}</span>
                </span>
                {currentReviewerName && (
                  <span className="text-gray-600">
                    Currently with: <span className="font-medium">{currentReviewerName}</span>
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center space-x-1">
                {Array.from({ length: maxReviewLevel }, (_, i) => i + 1).map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded ${
                      level < currentReviewLevel
                        ? 'bg-green-500'
                        : level === currentReviewLevel
                        ? 'bg-indigo-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-3">
              {/* Skip Button */}
              <button
                onClick={handleSkipReview}
                disabled={isSkipping || loading}
                className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isSkipping || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                <SkipForward size={18} />
                <span>{isSkipping ? 'Skipping...' : 'Skip & Next'}</span>
              </button>

              {/* Approve Button */}
              <button
                onClick={handleApprove}
                disabled={isSubmitting || loading}
                className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isSubmitting || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <CheckCircle size={18} />
                <span>Approve</span>
              </button>

              {/* Update & Approve Button */}
              <button
                onClick={handleUpdateAndApprove}
                disabled={isSubmitting || loading}
                className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isSubmitting || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Edit size={18} />
                <span>Update & Approve</span>
              </button>

              {/* Reject Button */}
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isSubmitting || loading}
                className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors flex items-center justify-center space-x-2 ${
                  isSubmitting || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <XCircle size={18} />
                <span>Reject with Comments</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowRejectDialog(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reject Annotation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-3">
                        Please provide a reason for rejection. This will be sent back to the annotator.
                      </p>
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={4}
                        placeholder="Enter rejection reason..."
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleReject}
                  disabled={!rejectComment.trim() || isSubmitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    !rejectComment.trim() || isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectComment('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EditAnnotationForm Modal */}
      <EditAnnotationForm
        isOpen={showCorrectionForm}
        onClose={() => setShowCorrectionForm(false)}
        annotation={selectedAnnotation}
        projectId={projectId}
        onCreateCorrection={handleCreateCorrection}
        isSubmitting={isCreatingCorrection}
      />
    </div>
  );
};

export default ReviewPanel;