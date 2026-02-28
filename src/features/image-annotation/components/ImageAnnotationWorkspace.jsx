/**
 * ImageAnnotationWorkspace Component
 * 
 * Main workspace for image annotation combining canvas, toolbar, and sidebar.
 * 
 * Tab structure by role:
 * - Annotators: Annotate (unannotated queue), My Rejected
 * - Reviewers: Review Queue
 * - Admins: Review Queue, All Annotations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, AlertCircle, Edit, Eye, MessageSquare, Filter, Download, CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import ImageCanvas from './ImageCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import ImageResourceList from './ImageResourceList';
import ShapeList from './ShapeList';
import ImageUploader from './ImageUploader';

import { TOOLS, ANNOTATION_STATUS, ANNOTATION_SUB_TYPES, BRUSH_DEFAULTS } from '../constants';
import { getImages, getUnannotatedImages, getImage } from '../../../services/imageResourceService';
import { 
  getResourceAnnotation, 
  getAnnotation,
  addShape, 
  updateShape, 
  deleteShape,
  submitAnnotation,
  reviewAnnotation,
  getPendingReview,
  getAnnotations,
  updateAnnotation
} from '../../../services/imageAnnotationService';

// Helper functions to convert between frontend and backend formats
const BACKEND_TO_FRONTEND_MAP = {
  'boxes': ANNOTATION_SUB_TYPES.BOUNDING_BOX,
  'polygons': ANNOTATION_SUB_TYPES.POLYGON,
  'segments': ANNOTATION_SUB_TYPES.SEGMENTATION,
  'keypoints': ANNOTATION_SUB_TYPES.KEYPOINT,
  'classifications': ANNOTATION_SUB_TYPES.CLASSIFICATION,
};

const FRONTEND_TO_BACKEND_MAP = {
  [ANNOTATION_SUB_TYPES.BOUNDING_BOX]: 'boxes',
  [ANNOTATION_SUB_TYPES.POLYGON]: 'polygons',
  [ANNOTATION_SUB_TYPES.SEGMENTATION]: 'segments',
  [ANNOTATION_SUB_TYPES.KEYPOINT]: 'keypoints',
  [ANNOTATION_SUB_TYPES.CLASSIFICATION]: 'classifications',
};

// Convert backend format to frontend shapes array
const convertBackendToShapes = (annotationData) => {
  if (!annotationData) {
    return [];
  }
  
  const shapes = [];
  
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
};

const ImageAnnotationWorkspace = ({ project, userRole = 'annotator' }) => {
  // Get projectId from project prop
  const projectId = project?.id;
  
  // Determine user capabilities based on role
  const normalizedRole = userRole ? userRole.toUpperCase() : '';
  const canUpload = ['ADMIN', 'PROJECT_MANAGER', 'ANNOTATOR'].includes(normalizedRole);
  const canAnnotate = ['ADMIN', 'PROJECT_MANAGER', 'ANNOTATOR'].includes(normalizedRole);
  const canReview = ['ADMIN', 'PROJECT_MANAGER', 'REVIEWER'].includes(normalizedRole);
  const isAdmin = normalizedRole === 'ADMIN';
  
  // Determine default tab based on role
  const getDefaultTab = () => {
    if (canAnnotate && !canReview) return 'annotate';
    if (canReview) return 'review';
    return 'annotate';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Resource state
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Annotation state
  const [annotation, setAnnotation] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  
  // Tool state
  const [activeTool, setActiveTool] = useState(TOOLS.SELECT);
  const [selectedLabel, setSelectedLabel] = useState(null);
  
  // Polygon undo/redo state
  const [polygonUndoRedo, setPolygonUndoRedo] = useState({
    canUndo: false,
    canRedo: false,
    onUndo: null,
    onRedo: null,
    onCancel: null,
  });
  
  // Brush size state
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULTS.DEFAULT_RADIUS);
  
  // Upload modal state
  const [showUploader, setShowUploader] = useState(false);
  
  // Pending review state (for reviewers)
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedPendingAnnotation, setSelectedPendingAnnotation] = useState(null);
  
  // Rejected annotations state (for annotators)
  const [rejectedAnnotations, setRejectedAnnotations] = useState([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [selectedRejectedAnnotation, setSelectedRejectedAnnotation] = useState(null);
  
  // All annotations state (for admins)
  const [allAnnotations, setAllAnnotations] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allAnnotationsFilters, setAllAnnotationsFilters] = useState({
    status: '',
    annotator_id: '',
  });
  
  // Review action state
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit mode state (for reviewers editing before approve, and annotators fixing rejected)
  const [editMode, setEditMode] = useState(false);

  // Load resources (only for annotators)
  useEffect(() => {
    if (projectId && canAnnotate && !canReview) {
      loadResources();
    }
  }, [projectId, canAnnotate, canReview]);
  
  const loadResources = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      // For annotators: show only unannotated images (queue)
      const response = await getUnannotatedImages(projectId, 100);
      setResources(response.data || []);
    } catch (error) {
      toast.error('Failed to load images');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load pending reviews for reviewers/admins
  useEffect(() => {
    if (projectId && canReview && activeTab === 'review') {
      loadPendingReviews();
    }
  }, [projectId, canReview, activeTab]);
  
  const loadPendingReviews = async () => {
    if (!projectId) return;
    
    try {
      setLoadingPending(true);
      const response = await getPendingReview(projectId, 50);
      setPendingReviews(response.data || []);
    } catch (error) {
      console.error('Failed to load pending reviews:', error);
      setPendingReviews([]);
    } finally {
      setLoadingPending(false);
    }
  };
  
  // Load rejected annotations for annotators
  useEffect(() => {
    if (projectId && canAnnotate && !canReview && activeTab === 'rejected') {
      loadRejectedAnnotations();
    }
  }, [projectId, canAnnotate, canReview, activeTab]);
  
  const loadRejectedAnnotations = async () => {
    if (!projectId) return;
    
    try {
      setLoadingRejected(true);
      const response = await getAnnotations(projectId, { status: ANNOTATION_STATUS.REJECTED });
      setRejectedAnnotations(response.data || []);
    } catch (error) {
      console.error('Failed to load rejected annotations:', error);
    } finally {
      setLoadingRejected(false);
    }
  };
  
  // Load all annotations for admins
  useEffect(() => {
    if (projectId && isAdmin && activeTab === 'all') {
      loadAllAnnotations();
    }
  }, [projectId, isAdmin, activeTab, allAnnotationsFilters]);
  
  const loadAllAnnotations = async () => {
    if (!projectId) return;
    
    try {
      setLoadingAll(true);
      const params = {};
      if (allAnnotationsFilters.status) params.status = allAnnotationsFilters.status;
      if (allAnnotationsFilters.annotator_id) params.annotator_id = allAnnotationsFilters.annotator_id;
      
      const response = await getAnnotations(projectId, params);
      setAllAnnotations(response.data || []);
    } catch (error) {
      console.error('Failed to load all annotations:', error);
    } finally {
      setLoadingAll(false);
    }
  };
  
  // Load annotation when resource is selected
  useEffect(() => {
    if (selectedResource && activeTab === 'annotate') {
      loadAnnotation(selectedResource.id);
    }
  }, [selectedResource, activeTab]);
  
  // Load annotation by ID (for reviewing)
  const loadAnnotationById = async (annotationId) => {
    try {
      const response = await getAnnotation(projectId, annotationId);
      setAnnotation(response);
      setSelectedPendingAnnotation(annotationId);
      // Set the resource for display
      if (response.resource) {
        setSelectedResource(response.resource);
      }
      // Convert backend format to frontend shapes array
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
    } catch (error) {
      toast.error('Failed to load annotation');
      console.error(error);
    }
  };
  
  const loadAnnotation = async (resourceId) => {
    try {
      const response = await getResourceAnnotation(projectId, resourceId);
      setAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
    } catch (error) {
      // No annotation exists yet
      setAnnotation(null);
      setShapes([]);
    }
  };
  
  // Handle shape creation
  const handleShapeCreate = async (shape) => {
    try {
      const shapeData = {
        id: shape.id,
        type: shape.type,
        label_id: shape.label?.id,
        data: shape.data,
      };
      
      const response = await addShape(
        projectId,
        selectedResource.id,
        shapeData,
        shape.type
      );
      
      setAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
      toast.success('Shape added');
    } catch (error) {
      toast.error('Failed to add shape');
      console.error('Shape creation error:', error);
    }
  };
  
  // Handle shape update
  const handleShapeUpdate = async (shapeId, newData) => {
    try {
      if (!annotation) return;
      
      const response = await updateShape(
        projectId,
        annotation.id,
        shapeId,
        newData
      );
      
      setAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
    } catch (error) {
      toast.error('Failed to update shape');
      console.error(error);
    }
  };
  
  // Handle shape delete
  const handleShapeDelete = async (shapeId) => {
    try {
      if (!annotation) return;
      
      const response = await deleteShape(
        projectId,
        annotation.id,
        shapeId
      );
      
      setAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
      setSelectedShapeId(null);
      toast.success('Shape deleted');
    } catch (error) {
      toast.error('Failed to delete shape');
      console.error(error);
    }
  };
  
  // Handle submit for review
  const handleSubmit = async () => {
    if (!annotation) return;
    
    try {
      await submitAnnotation(projectId, annotation.id);
      toast.success('Annotation submitted for review');
      // Clear current selection and refresh the queue
      setSelectedResource(null);
      setAnnotation(null);
      setShapes([]);
      loadResources(); // Refresh the queue
    } catch (error) {
      toast.error('Failed to submit annotation');
      console.error(error);
    }
  };
  
  // Handle review (approve or reject)
  const handleReview = async (action) => {
    if (!annotation) return;
    
    const comment = action === 'reject' 
      ? rejectComment
      : prompt('Enter comment (optional):'); 
    
    try {
      setIsSubmitting(true);
      await reviewAnnotation(projectId, annotation.id, action, comment || null);
      toast.success(`Annotation ${action}ed`);
      // Clear selection and refresh pending list
      setSelectedResource(null);
      setAnnotation(null);
      setShapes([]);
      setSelectedPendingAnnotation(null);
      setShowRejectDialog(false);
      setRejectComment('');
      loadPendingReviews();
    } catch (error) {
      toast.error(`Failed to ${action} annotation`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool(TOOLS.SELECT);
          break;
        case 'b':
          setActiveTool(TOOLS.BOUNDING_BOX);
          break;
        case 'p':
          setActiveTool(TOOLS.POLYGON);
          break;
        case 'k':
          setActiveTool(TOOLS.KEYPOINT);
          break;
        case 'delete':
        case 'backspace':
          if (selectedShapeId) {
            handleShapeDelete(selectedShapeId);
          }
          break;
        case 'escape':
          setSelectedShapeId(null);
          setActiveTool(TOOLS.SELECT);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId]);
  
  const labels = project?.labels || [];
  const readOnly = annotation?.status === ANNOTATION_STATUS.APPROVED;

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Tab Navigation - Different tabs based on role */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex space-x-2">
          {/* Annotate tab - Only for annotators */}
          {canAnnotate && !canReview && (
            <button
              onClick={() => setActiveTab('annotate')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'annotate'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annotate
            </button>
          )}
          
          {/* My Rejected tab - Only for annotators */}
          {canAnnotate && !canReview && (
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'rejected'
                ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Rejected
            </button>
          )}
          
          {/* Review tab - Only for reviewers/admins */}
          {canReview && (
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'review'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Review Queue
            </button>
          )}
          
          {/* All Annotations tab - Only for admins */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Annotations
            </button>
          )}
        </div>
      </div>

      {/* Annotate Tab Content */}
      {activeTab === 'annotate' && canAnnotate && !canReview && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
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
          
          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="font-medium text-gray-900">
                  {selectedResource?.name || 'Select an image'}
                </h2>
                {annotation && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    annotation.status === ANNOTATION_STATUS.DRAFT ? 'bg-gray-100 text-gray-700' :
                    annotation.status === ANNOTATION_STATUS.SUBMITTED ? 'bg-blue-100 text-blue-700' :
                    annotation.status === ANNOTATION_STATUS.APPROVED ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {annotation.status}
                  </span>
                )}
              </div>
              
              {/* Submit button for draft annotations */}
              {annotation && annotation.status === ANNOTATION_STATUS.DRAFT && shapes.length > 0 && (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Submit for Review
                </button>
              )}
            </div>
            
            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {selectedResource ? (
                <ImageCanvas
                  imageUrl={selectedResource.image_url}
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  activeTool={activeTool}
                  selectedLabel={selectedLabel}
                  onShapeCreate={handleShapeCreate}
                  onShapeUpdate={handleShapeUpdate}
                  onShapeDelete={handleShapeDelete}
                  onShapeSelect={setSelectedShapeId}
                  readOnly={readOnly}
                  width={800}
                  height={600}
                  onPolygonUndoRedoState={setPolygonUndoRedo}
                  brushSize={brushSize}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select an image to start annotating</p>
                  <p className="text-sm mt-2">Choose from the list on the right</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col">
            {/* Upload Button Header */}
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Images ({resources.length})</h3>
              {canUpload && (
                <button
                  onClick={() => setShowUploader(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Upload images"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
              )}
            </div>
            
            {/* Resource List */}
            <div className="flex-1 overflow-auto">
              <ImageResourceList
                resources={resources}
                selectedResource={selectedResource}
                onSelect={setSelectedResource}
                loading={loading}
                showHeader={false}
              />
            </div>
            
            {/* Shape List */}
            {selectedResource && (
              <div className="border-t border-gray-200 max-h-64 overflow-auto">
                <ShapeList
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  onSelect={setSelectedShapeId}
                  onDelete={handleShapeDelete}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Rejected Tab Content */}
      {activeTab === 'rejected' && canAnnotate && !canReview && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar - Show when editing rejected annotation */}
          {editMode && selectedRejectedAnnotation && (
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
          )}
          
          {/* Left: Rejected List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">My Rejected ({rejectedAnnotations.length})</h3>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {loadingRejected ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : rejectedAnnotations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p>No rejected annotations</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {rejectedAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => {
                        loadAnnotationById(ann.id);
                        setSelectedRejectedAnnotation(ann.id);
                        setEditMode(false);
                      }}
                      className={`p-4 cursor-pointer hover:bg-orange-50 transition-colors ${
                        selectedRejectedAnnotation === ann.id ? 'bg-orange-100 border-l-2 border-orange-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ann.resource?.name || `Resource #${ann.resource_id}`}
                        </p>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                          {ann.status}
                        </span>
                      </div>
                      {ann.review_comment && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {ann.review_comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Edit Canvas & Actions */}
          <div className="flex-1 flex flex-col">
            {/* Header with actions */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="font-medium text-gray-900">
                  {selectedResource?.name || 'Select a rejected annotation'}
                </h2>
                {annotation && (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                    {annotation.status}
                  </span>
                )}
                {editMode && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    EDIT MODE
                  </span>
                )}
              </div>
              
              {/* Edit/Resubmit buttons */}
              {annotation && annotation.status === ANNOTATION_STATUS.REJECTED && (
                <div className="flex gap-2 items-center">
                  {/* Edit Mode Toggle */}
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                      editMode 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                    {editMode ? 'View Mode' : 'Edit'}
                  </button>
                  
                  {editMode && (
                    <button
                      onClick={async () => {
                        if (!annotation) return;
                        try {
                          setIsSubmitting(true);
                          // Resubmit the annotation after edits
                          await submitAnnotation(projectId, annotation.id);
                          toast.success('Annotation resubmitted for review');
                          // Clear selection and refresh
                          setSelectedResource(null);
                          setAnnotation(null);
                          setShapes([]);
                          setSelectedRejectedAnnotation(null);
                          setEditMode(false);
                          loadRejectedAnnotations();
                        } catch (error) {
                          toast.error('Failed to resubmit annotation');
                          console.error(error);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || shapes.length === 0}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resubmit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Review Comment Banner */}
            {annotation?.review_comment && (
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
                <div className="flex items-start">
                  <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-orange-800">Reviewer Feedback:</p>
                    <p className="text-sm text-orange-900">{annotation.review_comment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {selectedResource ? (
                <ImageCanvas
                  imageUrl={selectedResource.image_url}
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  activeTool={editMode ? activeTool : TOOLS.SELECT}
                  selectedLabel={selectedLabel}
                  onShapeCreate={handleShapeCreate}
                  onShapeUpdate={handleShapeUpdate}
                  onShapeDelete={handleShapeDelete}
                  onShapeSelect={setSelectedShapeId}
                  readOnly={!editMode}
                  width={800}
                  height={600}
                  onPolygonUndoRedoState={setPolygonUndoRedo}
                  brushSize={brushSize}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <p className="text-lg">Select a rejected annotation to fix</p>
                  <p className="text-sm mt-2">Click Edit to modify, then Resubmit</p>
                </div>
              )}
            </div>

            {/* Shape List */}
            {selectedResource && shapes.length > 0 && (
              <div className="bg-white border-t border-gray-200 max-h-48 overflow-auto">
                <ShapeList
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  onSelect={setSelectedShapeId}
                  onDelete={editMode ? handleShapeDelete : null}
                  readOnly={!editMode}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Queue Tab Content */}
      {activeTab === 'review' && canReview && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar - Show when in edit mode */}
          {editMode && (
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
          )}
          
          {/* Left: Pending Review List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Pending Review ({pendingReviews.length})</h3>
            </div>
            <div className="flex-1 overflow-auto">
              {loadingPending ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : pendingReviews.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p>No pending reviews</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingReviews.map((pending) => (
                    <div
                      key={pending.id}
                      onClick={() => {
                        loadAnnotationById(pending.id);
                        setEditMode(false);
                      }}
                      className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedPendingAnnotation === pending.id ? 'bg-blue-100 border-l-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pending.resource?.name || `Resource #${pending.resource_id}`}
                        </p>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                          {pending.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        by {pending.annotator?.full_name || pending.annotator?.email || 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Review Canvas & Actions */}
          <div className="flex-1 flex flex-col">
            {/* Header with actions */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="font-medium text-gray-900">
                  {selectedResource?.name || 'Select an annotation to review'}
                </h2>
                {annotation && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {annotation.status}
                  </span>
                )}
                {editMode && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    EDIT MODE
                  </span>
                )}
              </div>
              
              {/* Review buttons */}
              {annotation && annotation.status === ANNOTATION_STATUS.SUBMITTED && (
                <div className="flex gap-2 items-center">
                  {/* Edit Mode Toggle */}
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                      editMode 
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                    {editMode ? 'View Mode' : 'Edit'}
                  </button>
                  
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {selectedResource ? (
                <ImageCanvas
                  imageUrl={selectedResource.image_url}
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  activeTool={editMode ? activeTool : TOOLS.SELECT}
                  selectedLabel={selectedLabel}
                  onShapeCreate={handleShapeCreate}
                  onShapeUpdate={handleShapeUpdate}
                  onShapeDelete={handleShapeDelete}
                  onShapeSelect={setSelectedShapeId}
                  readOnly={!editMode}
                  width={800}
                  height={600}
                  onPolygonUndoRedoState={setPolygonUndoRedo}
                  brushSize={brushSize}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select an annotation from the list to review</p>
                </div>
              )}
            </div>

            {/* Shape List for review */}
            {selectedResource && shapes.length > 0 && (
              <div className="bg-white border-t border-gray-200 max-h-48 overflow-auto">
                <ShapeList
                  shapes={shapes}
                  selectedShapeId={selectedShapeId}
                  onSelect={setSelectedShapeId}
                  onDelete={editMode ? handleShapeDelete : null}
                  readOnly={!editMode}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Annotations Tab Content (Admin) */}
      {activeTab === 'all' && isAdmin && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{allAnnotations.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-gray-600">
                  {allAnnotations.filter(a => a.status === ANNOTATION_STATUS.DRAFT).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {allAnnotations.filter(a => a.status === ANNOTATION_STATUS.SUBMITTED).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {allAnnotations.filter(a => a.status === ANNOTATION_STATUS.APPROVED).length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {allAnnotations.filter(a => a.status === ANNOTATION_STATUS.REJECTED).length}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={allAnnotationsFilters.status}
                  onChange={(e) => setAllAnnotationsFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value={ANNOTATION_STATUS.DRAFT}>Draft</option>
                  <option value={ANNOTATION_STATUS.SUBMITTED}>Submitted</option>
                  <option value={ANNOTATION_STATUS.APPROVED}>Approved</option>
                  <option value={ANNOTATION_STATUS.REJECTED}>Rejected</option>
                </select>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(allAnnotations, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `image_annotations_project_${projectId}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Annotations exported');
                  }}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Annotations Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loadingAll ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : allAnnotations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No annotations found</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annotator</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allAnnotations.map((ann) => (
                      <tr key={ann.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{ann.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">#{ann.resource_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {ann.annotator?.full_name || ann.annotator?.email || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ann.status === ANNOTATION_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                            ann.status === ANNOTATION_STATUS.SUBMITTED ? 'bg-blue-100 text-blue-800' :
                            ann.status === ANNOTATION_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ann.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(ann.updated_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <ImageUploader
          projectId={projectId}
          onUploadComplete={() => {
            loadResources();
            setShowUploader(false);
          }}
          onClose={() => setShowUploader(false)}
        />
      )}

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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reject Annotation</h3>
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
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleReview('reject')}
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
    </div>
  );
};

export default ImageAnnotationWorkspace;