/**
 * ImageReviewTaskWorkspace Component
 * 
 * Main workspace for reviewers to review image annotations with:
 * - Start Review button
 * - View current review task with UUID chain
 * - Approve/Reject/Edit/Skip actions
 * - Review chain display showing all participants
 * - Image display with annotation overlay
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import reviewTaskService, { formatReviewChain } from '../../../services/reviewTaskService';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner.jsx';
import ImageCanvas from './ImageCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import ShapeList from './ShapeList';
import { TOOLS, ANNOTATION_SUB_TYPES, BRUSH_DEFAULTS } from '../constants';
import { Edit, X, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageReviewTaskWorkspace = ({ annotationType = 'image', projectId: projectIdProp, project }) => {
  const { projectId: routeProjectId } = useParams();
  const projectId = projectIdProp || routeProjectId;  // Use prop if provided, else route param
  const { user } = useAuth();
  
  // Get labels from project
  const labels = project?.labels || [];
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [annotation, setAnnotation] = useState(null);
  const [resource, setResource] = useState(null);
  const [reviewLevel, setReviewLevel] = useState(1);
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [poolStats, setPoolStats] = useState(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOLS.SELECT);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULTS.DEFAULT_RADIUS);
  const [polygonUndoRedo, setPolygonUndoRedo] = useState({
    canUndo: false,
    canRedo: false,
    onUndo: null,
    onRedo: null,
    onCancel: null,
  });

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
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // FastAPI validation error - format the first error
        setError(detail[0]?.msg || 'Validation error');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to start review');
      }
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

  // Convert backend annotation data to frontend shapes
  const convertBackendToShapes = useCallback((annotationData) => {
    if (!annotationData) return [];
    
    const shapes = [];
    const BACKEND_TO_FRONTEND_MAP = {
      'boxes': ANNOTATION_SUB_TYPES.BOUNDING_BOX,
      'polygons': ANNOTATION_SUB_TYPES.POLYGON,
      'segments': ANNOTATION_SUB_TYPES.SEGMENTATION,
      'keypoints': ANNOTATION_SUB_TYPES.KEYPOINT,
      'classifications': ANNOTATION_SUB_TYPES.CLASSIFICATION,
    };
    
    Object.entries(BACKEND_TO_FRONTEND_MAP).forEach(([backendKey, frontendType]) => {
      const items = annotationData[backendKey] || [];
      items.forEach(item => {
        const { id, type, label_id, data: nestedData, ...rest } = item;
        const shapeData = nestedData || rest;
        shapes.push({
          id: item.id,
          type: frontendType,
          label: item.label || null,
          data: shapeData,
        });
      });
    });
    
    return shapes;
  }, []);

  // Initialize shapes when annotation changes
  useEffect(() => {
    if (annotation?.annotation_data) {
      setShapes(convertBackendToShapes(annotation.annotation_data));
    }
  }, [annotation, convertBackendToShapes]);

  // Handle edit mode toggle
  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Cancel edit - reset shapes to original
      setShapes(convertBackendToShapes(annotation?.annotation_data));
    }
    setIsEditMode(!isEditMode);
    setSelectedShapeId(null);
  };

  // Handle shape modifications in edit mode
  const handleShapeCreate = (shape) => {
    setShapes(prev => [...prev, shape]);
  };

  const handleShapeUpdate = (shapeId, newData) => {
    setShapes(prev => prev.map(s => s.id === shapeId ? { ...s, data: newData } : s));
  };

  const handleShapeDelete = (shapeId) => {
    setShapes(prev => prev.filter(s => s.id !== shapeId));
    setSelectedShapeId(null);
  };

  // Convert frontend shapes back to backend format
  const convertShapesToBackend = (frontendShapes) => {
    const annotationData = {
      boxes: [],
      polygons: [],
      segments: [],
      keypoints: [],
      classifications: []
    };
    
    const FRONTEND_TO_BACKEND_MAP = {
      [ANNOTATION_SUB_TYPES.BOUNDING_BOX]: 'boxes',
      [ANNOTATION_SUB_TYPES.POLYGON]: 'polygons',
      [ANNOTATION_SUB_TYPES.SEGMENTATION]: 'segments',
      [ANNOTATION_SUB_TYPES.KEYPOINT]: 'keypoints',
      [ANNOTATION_SUB_TYPES.CLASSIFICATION]: 'classifications',
    };
    
    frontendShapes.forEach(shape => {
      const backendKey = FRONTEND_TO_BACKEND_MAP[shape.type];
      if (backendKey) {
        annotationData[backendKey].push({
          id: shape.id,
          type: shape.type,
          label: shape.label,
          label_id: shape.label?.id,
          data: shape.data
        });
      }
    });
    
    return annotationData;
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const annotationData = convertShapesToBackend(shapes);
      
      const actionData = { 
        action: 'edit', 
        annotation_data: annotationData,
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

  // Render annotation shapes on image
  const renderAnnotationOverlay = () => {
    if (!annotation?.annotation_data || !resource) return null;
    
    const { boxes = [], polygons = [], keypoints = [] } = annotation.annotation_data;
    const shapes = [...boxes, ...polygons, ...keypoints];
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox={`0 0 ${resource.width || 800} ${resource.height || 600}`}>
          {/* Render bounding boxes */}
          {boxes.map((box, idx) => (
            <rect
              key={`box-${idx}`}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill="none"
              stroke={box.color || '#00ff00'}
              strokeWidth="2"
            />
          ))}
          {/* Render polygons */}
          {polygons.map((polygon, idx) => (
            <polygon
              key={`polygon-${idx}`}
              points={polygon.points?.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={polygon.color || '#ff0000'}
              strokeWidth="2"
            />
          ))}
          {/* Render keypoints */}
          {keypoints.map((kp, idx) => (
            <circle
              key={`kp-${idx}`}
              cx={kp.x}
              cy={kp.y}
              r="5"
              fill={kp.color || '#ffff00'}
            />
          ))}
        </svg>
      </div>
    );
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
        <h2 className="text-2xl font-bold text-gray-800">Image Review Workspace</h2>
        <p className="text-gray-600 mt-1">
          Review and approve image annotations for this project
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

      {/* Review Level Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review Level
        </label>
        <select
          value={reviewLevel}
          onChange={(e) => setReviewLevel(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Level 1 (First Reviewer)</option>
          <option value={2}>Level 2 (Second Reviewer)</option>
          <option value={3}>Level 3 (Final Reviewer)</option>
        </select>
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
            Click to get the next available image annotation for review
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

            {/* Image Preview with Annotations - Full Editor in Edit Mode */}
            {resource && (
              <div className="border-t pt-4">
                {isEditMode ? (
                  <div className="flex gap-4">
                    {/* Left Toolbar in Edit Mode */}
                    <AnnotationToolbar
                      activeTool={activeTool}
                      onToolChange={setActiveTool}
                      onUndo={polygonUndoRedo.onUndo}
                      onRedo={polygonUndoRedo.onRedo}
                      onDelete={() => selectedShapeId && handleShapeDelete(selectedShapeId)}
                      canUndo={polygonUndoRedo.canUndo}
                      canRedo={polygonUndoRedo.canRedo}
                      canDelete={!!selectedShapeId}
                      selectedLabel={selectedLabel}
                      labels={labels}
                      onLabelChange={setSelectedLabel}
                      brushSize={brushSize}
                      onBrushSizeChange={setBrushSize}
                    />
                    
                    {/* Canvas Area */}
                    <div className="flex-1 flex flex-col">
                      <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                        <ImageCanvas
                          imageUrl={resource.image_url}
                          shapes={shapes}
                          selectedShapeId={selectedShapeId}
                          activeTool={activeTool}
                          selectedLabel={selectedLabel}
                          onShapeCreate={handleShapeCreate}
                          onShapeUpdate={handleShapeUpdate}
                          onShapeDelete={handleShapeDelete}
                          onShapeSelect={setSelectedShapeId}
                          readOnly={false}
                          width={resource.width || 800}
                          height={resource.height || 600}
                          onPolygonUndoRedoState={setPolygonUndoRedo}
                          brushSize={brushSize}
                        />
                      </div>
                    </div>
                    
                    {/* Shape List Sidebar in Edit Mode */}
                    <div className="w-64 bg-white border-l border-gray-200">
                      <div className="p-2 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700">Shapes ({shapes.length})</h4>
                      </div>
                      <div className="max-h-96 overflow-auto">
                        <ShapeList
                          shapes={shapes}
                          selectedShapeId={selectedShapeId}
                          onSelect={setSelectedShapeId}
                          onDelete={handleShapeDelete}
                          readOnly={false}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Image with Annotations</h4>
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '500px' }}>
                      {resource.image_url ? (
                        <>
                          <img 
                            src={resource.image_url} 
                            alt={resource.name || 'Annotation image'}
                            className="w-full h-auto max-h-96 object-contain"
                          />
                          {renderAnnotationOverlay()}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          Image not available
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-2">
                      {resource.name || `Resource #${annotation.resource_id}`}
                      {resource.width && resource.height && (
                        <span className="text-gray-400 ml-2">({resource.width}x{resource.height})</span>
                      )}
                    </p>
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

export default ImageReviewTaskWorkspace;