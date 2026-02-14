/**
 * ImageAnnotationWorkspace Component
 * 
 * Main workspace for image annotation combining canvas, toolbar, and sidebar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import ImageCanvas from './ImageCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import ImageResourceList from './ImageResourceList';
import ShapeList from './ShapeList';
import ImageUploader from './ImageUploader';

import { TOOLS, ANNOTATION_STATUS, ANNOTATION_SUB_TYPES, BRUSH_DEFAULTS } from '../constants';
import { getImages, getUnannotatedImages } from '../../../services/imageResourceService';
import { 
  getResourceAnnotation, 
  addShape, 
  updateShape, 
  deleteShape,
  submitAnnotation 
} from '../../../services/imageAnnotationService';

// Helper functions to convert between frontend and backend formats
// Backend stores: { boxes: [], polygons: [], segments: [], keypoints: [], classifications: [] }
// Frontend expects: [{ id, type, label, data }, ...]

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
      // Backend stores: {id, type, label_id, data: {x, y, width, height}, label, color, ...}
      // Frontend needs: {id, type, label, data: {x, y, width, height}}
      
      // If item has a nested 'data' field, use it; otherwise use the item itself (minus metadata fields)
      const { id, type, label_id, data: nestedData, ...rest } = item;
      
      // The shape data is either in nestedData or spread across rest
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
  
  // Load resources
  useEffect(() => {
    if (projectId) {
      loadResources();
    }
  }, [projectId]);
  
  const loadResources = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await getImages(projectId);
      setResources(response.data || []);
    } catch (error) {
      toast.error('Failed to load images');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load annotation when resource is selected
  useEffect(() => {
    if (selectedResource) {
      loadAnnotation(selectedResource.id);
    }
  }, [selectedResource]);
  
  const loadAnnotation = async (resourceId) => {
    try {
      const response = await getResourceAnnotation(projectId, resourceId);
      setAnnotation(response);
      // Convert backend format to frontend shapes array
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
      // Convert backend format to frontend shapes array
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
      toast.success('Shape added');
    } catch (error) {
      toast.error('Failed to add shape');
      console.error(error);
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
      // Convert backend format to frontend shapes array
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
      // Convert backend format to frontend shapes array
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
      loadAnnotation(selectedResource.id);
    } catch (error) {
      toast.error('Failed to submit annotation');
      console.error(error);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if typing in an input
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
    <div className="flex h-full bg-gray-100">
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
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Upload images"
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
        
        {/* Resource List */}
        <div className="flex-1 overflow-hidden">
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
    </div>
  );
};

export default ImageAnnotationWorkspace;