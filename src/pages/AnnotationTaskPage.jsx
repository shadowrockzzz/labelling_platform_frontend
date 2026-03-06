/**
 * AnnotationTaskPage - Unified task-based annotation workflow
 * 
 * This page implements a unified flow where annotators can:
 * 1. Click "Start Annotating" 
 * 2. If annotator-provided: Upload their resource first, then annotate
 * 3. If PM-provided: Claim a task from the pool
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Play, 
  SkipForward, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Upload,
  FileText,
  Image,
  Save,
  X,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import annotationTaskService from '../services/annotationTaskService';
import { projectService } from '../services/projectService';
import { textResourceService } from '../services/textResourceService';
import { uploadImage } from '../services/imageResourceService';
import { textAnnotationService } from '../services/textAnnotationService';
import { 
  getResourceAnnotation, 
  addShape, 
  updateShape, 
  deleteShape,
  submitAnnotation as submitImageAnnotation
} from '../services/imageAnnotationService';
import TextAnnotationEditor from '../components/text-annotation/TextAnnotationEditor';
import ImageCanvas from '../features/image-annotation/components/ImageCanvas';
import AnnotationToolbar from '../features/image-annotation/components/AnnotationToolbar';
import ShapeList from '../features/image-annotation/components/ShapeList';
import { TOOLS, ANNOTATION_SUB_TYPES, BRUSH_DEFAULTS } from '../features/image-annotation/constants';

const AnnotationTaskPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Project state
  const [project, setProject] = useState(null);
  const [resourceProvider, setResourceProvider] = useState('annotator');
  
  // Task state
  const [currentTask, setCurrentTask] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Upload state for annotator-provided mode
  const [uploadStep, setUploadStep] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Image annotation state
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOLS.SELECT);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULTS.DEFAULT_RADIUS);
  const [imageAnnotation, setImageAnnotation] = useState(null);
  const [polygonUndoRedo, setPolygonUndoRedo] = useState({
    canUndo: false,
    canRedo: false,
    onUndo: null,
    onRedo: null,
    onCancel: null,
  });
  
  // Determine if project is PM-provided or annotator-provided
  const isPMProvided = resourceProvider === 'project_manager';
  const isImageProject = project?.annotation_type === 'image';
  
  // Fetch project info
  const fetchProject = useCallback(async () => {
    try {
      const projectData = await projectService.getProjectById(projectId);
      setProject(projectData);
      setResourceProvider(projectData.config?.resource_provider || 'annotator');
      return projectData;
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project information');
      return null;
    }
  }, [projectId]);
  
  // Fetch task stats
  const fetchStats = useCallback(async () => {
    if (!project) return;
    try {
      const projectType = project.annotation_type || 'text';
      const stats = await annotationTaskService.getTaskStats(projectId, projectType);
      setTaskStats(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [projectId, project]);
  
  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch project info first
        const projectData = await fetchProject();
        const projectType = projectData?.annotation_type || 'text';
        
        // Check if user has an active task
        const activeTask = await annotationTaskService.getMyActiveTask(projectId, projectType);
        console.log('[ANNOTATION_TASK_PAGE] Active task response:', activeTask);
        console.log('[ANNOTATION_TASK_PAGE] Active task resource_url:', activeTask?.resource_url);
        console.log('[ANNOTATION_TASK_PAGE] Active task resource:', activeTask?.resource);
        if (activeTask) {
          setCurrentTask(activeTask);
        }
        
        // Fetch stats (will be called by fetchStats after project is set)
      } catch (err) {
        setError('Failed to load task data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, [projectId, fetchProject]);
  
  // Handle "Start Annotating" click - unified entry point
  const handleStartAnnotating = async () => {
    setError(null);
    setSuccessMessage(null);
    
    if (isPMProvided) {
      // PM-provided: Claim from pool
      await handleClaimTask();
    } else {
      // Annotator-provided: Show upload UI
      setUploadStep(true);
    }
  };
  
  // Claim a new task (PM-provided mode)
  const handleClaimTask = async () => {
    setClaiming(true);
    
    try {
      const projectType = project?.annotation_type || 'text';
      const result = await annotationTaskService.claimTask(projectId, projectType);
      setCurrentTask(result.task);
      setSuccessMessage(result.message);
      await fetchStats();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to claim task';
      if (detail.includes('No tasks available')) {
        setError('🎉 All tasks have been claimed! No more tasks available.');
      } else {
        setError(detail);
      }
    } finally {
      setClaiming(false);
    }
  };
  
  // Handle file upload (annotator-provided mode)
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Upload the resource first
      const isImage = project.annotation_type === 'image';
      const projectType = project.annotation_type || 'text';
      
      let resource;
      if (isImage) {
        resource = await uploadImage(projectId, selectedFile);
      } else {
        resource = await textResourceService.uploadResource(projectId, selectedFile);
      }
      
      // Now claim the task that was auto-created for this resource
      setUploadStep(false);
      setSelectedFile(null);
      
      // Claim the task (it should be the one we just created)
      const result = await annotationTaskService.claimTask(projectId, projectType);
      setCurrentTask(result.task);
      setSuccessMessage('Resource uploaded! Your annotation task is ready.');
      await fetchStats();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };
  
  // Skip current task
  const handleSkipTask = async () => {
    if (!currentTask) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const projectType = project?.annotation_type || 'text';
      await annotationTaskService.skipTask(currentTask.id, projectId, projectType);
      setCurrentTask(null);
      setSuccessMessage('Task skipped. Click "Start Annotating" to continue.');
      await fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to skip task');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle annotation submission
  const handleAnnotationComplete = async (annotationId) => {
    if (!currentTask) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const projectType = project?.annotation_type || 'text';
      await annotationTaskService.submitTask(currentTask.id, projectId, annotationId, projectType);
      setCurrentTask(null);
      setSuccessMessage('🎉 Task submitted successfully! Click "Start Annotating" to continue.');
      await fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };
  
  // === TEXT ANNOTATION HANDLERS ===
  const handleTextSave = async (data, closeEditor = true) => {
    // If data is null, the batch was already submitted inside TextAnnotationEditor
    if (!data) {
      if (closeEditor) {
        setCurrentTask(null);
        setSuccessMessage('🎉 Task submitted successfully! Click "Start Annotating" to continue.');
        await fetchStats();
      }
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create the annotation
      const annotation = await textAnnotationService.createAnnotation(projectId, data);
      
      // If it's a batch submit (closeEditor=true), submit the task
      if (closeEditor && annotation?.id) {
        await annotationTaskService.submitTask(currentTask.id, projectId, annotation.id, 'text');
        setCurrentTask(null);
        setSuccessMessage('🎉 Task submitted successfully! Click "Start Annotating" to continue.');
        await fetchStats();
      } else {
        toast.success('Annotation saved');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save annotation');
      toast.error('Failed to save annotation');
    } finally {
      setSubmitting(false);
    }
  };
  
  // === IMAGE ANNOTATION HANDLERS ===
  
  // Convert backend format to frontend shapes array
  const convertBackendToShapes = (annotationData) => {
    if (!annotationData) return [];
    
    const BACKEND_TO_FRONTEND_MAP = {
      'boxes': ANNOTATION_SUB_TYPES.BOUNDING_BOX,
      'polygons': ANNOTATION_SUB_TYPES.POLYGON,
      'segments': ANNOTATION_SUB_TYPES.SEGMENTATION,
      'keypoints': ANNOTATION_SUB_TYPES.KEYPOINT,
      'classifications': ANNOTATION_SUB_TYPES.CLASSIFICATION,
    };
    
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
  
  // Load existing image annotation when task changes
  useEffect(() => {
    const loadImageAnnotation = async () => {
      if (!currentTask || !isImageProject) return;
      
      try {
        const annotation = await getResourceAnnotation(projectId, currentTask.resource_id);
        setImageAnnotation(annotation);
        const frontendShapes = convertBackendToShapes(annotation.annotation_data);
        setShapes(frontendShapes);
      } catch (err) {
        // No annotation exists yet, start fresh
        setImageAnnotation(null);
        setShapes([]);
      }
    };
    
    loadImageAnnotation();
  }, [currentTask, isImageProject, projectId]);
  
  const handleImageShapeCreate = async (shape) => {
    try {
      const shapeData = {
        id: shape.id,
        type: shape.type,
        label_id: shape.label?.id,
        data: shape.data,
      };
      
      const response = await addShape(
        projectId,
        currentTask.resource_id,
        shapeData,
        shape.type
      );
      
      setImageAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
      toast.success('Shape added');
    } catch (err) {
      toast.error('Failed to add shape');
      console.error('Shape creation error:', err);
    }
  };
  
  const handleImageShapeUpdate = async (shapeId, newData) => {
    if (!imageAnnotation) return;
    
    try {
      const response = await updateShape(
        projectId,
        imageAnnotation.id,
        shapeId,
        newData
      );
      
      setImageAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
    } catch (err) {
      toast.error('Failed to update shape');
      console.error(err);
    }
  };
  
  const handleImageShapeDelete = async (shapeId) => {
    if (!imageAnnotation) return;
    
    try {
      const response = await deleteShape(
        projectId,
        imageAnnotation.id,
        shapeId
      );
      
      setImageAnnotation(response);
      const frontendShapes = convertBackendToShapes(response.annotation_data);
      setShapes(frontendShapes);
      setSelectedShapeId(null);
      toast.success('Shape deleted');
    } catch (err) {
      toast.error('Failed to delete shape');
      console.error(err);
    }
  };
  
  const handleImageSubmit = async () => {
    if (!imageAnnotation || shapes.length === 0) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // First submit the annotation for review
      await submitImageAnnotation(projectId, imageAnnotation.id);
      
      // Then mark the task as submitted
      await annotationTaskService.submitTask(currentTask.id, projectId, imageAnnotation.id, 'image');
      
      setCurrentTask(null);
      setShapes([]);
      setImageAnnotation(null);
      setSuccessMessage('🎉 Task submitted successfully! Click "Start Annotating" to continue.');
      await fetchStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit annotation');
      toast.error('Failed to submit annotation');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Stats card component
  const StatsCard = ({ label, value, icon: Icon, color = 'blue' }) => (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-500 opacity-50`} />
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          ← Back to Project
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          Annotation Tasks
        </h1>
        <p className="text-gray-600 mt-1">
          {isPMProvided 
            ? 'Claim tasks from the resource pool and annotate'
            : 'Upload your resource and annotate it'}
        </p>
      </div>
      
      {/* Resource Provider Mode Indicator */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          {isPMProvided ? (
            <>
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-indigo-800">Project Manager provides resources</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Annotator provides resources</span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {isPMProvided 
            ? 'Resources have been pre-uploaded by the project manager. Claim one to start annotating.'
            : 'Upload your own resource to annotate. Each upload creates a new annotation task.'}
        </p>
      </div>
      
      {/* Stats */}
      {taskStats && isPMProvided && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            label="Available" 
            value={taskStats.available} 
            icon={ClipboardList}
            color="green"
          />
          <StatsCard 
            label="In Progress" 
            value={taskStats.locked + taskStats.in_progress} 
            icon={Play}
            color="blue"
          />
          <StatsCard 
            label="Submitted" 
            value={taskStats.submitted} 
            icon={CheckCircle}
            color="purple"
          />
          <StatsCard 
            label="Total" 
            value={taskStats.total} 
            icon={ClipboardList}
            color="gray"
          />
        </div>
      )}
      
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Main content */}
      {currentTask ? (
        // Show annotation editor
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold">Current Task</h2>
              <p className="text-sm text-gray-500">
                Task ID: {currentTask.id} | Resource: {currentTask.resource?.name || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Lock expires: {currentTask.lock_expires_at 
                    ? new Date(currentTask.lock_expires_at).toLocaleTimeString()
                    : 'N/A'}
                </span>
              </div>
              <button
                onClick={handleSkipTask}
                disabled={submitting}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
          
          {/* Editor based on project type */}
          <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
            {isImageProject ? (
              // Image Annotation Editor
              <>
                {/* Toolbar */}
                <AnnotationToolbar
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  onUndo={polygonUndoRedo.onUndo}
                  onRedo={polygonUndoRedo.onRedo}
                  onDelete={() => selectedShapeId && handleImageShapeDelete(selectedShapeId)}
                  canUndo={polygonUndoRedo.canUndo}
                  canRedo={polygonUndoRedo.canRedo}
                  canDelete={!!selectedShapeId}
                  selectedLabel={selectedLabel}
                  labels={project?.labels || []}
                  onLabelChange={setSelectedLabel}
                  brushSize={brushSize}
                  onBrushSizeChange={setBrushSize}
                />
                
                {/* Canvas - Full width and height */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {currentTask.resource_url ? (
                    <ImageCanvas
                      imageUrl={currentTask.resource_url}
                      shapes={shapes}
                      selectedShapeId={selectedShapeId}
                      activeTool={activeTool}
                      selectedLabel={selectedLabel}
                      onShapeCreate={handleImageShapeCreate}
                      onShapeUpdate={handleImageShapeUpdate}
                      onShapeDelete={handleImageShapeDelete}
                      onShapeSelect={setSelectedShapeId}
                      readOnly={false}
                      width={1200}
                      height={800}
                      onPolygonUndoRedoState={setPolygonUndoRedo}
                      brushSize={brushSize}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      <span className="text-gray-500">Loading image...</span>
                    </div>
                  )}
                </div>
                
                {/* Shape List Sidebar */}
                <div className="w-64 border-l border-gray-200 bg-white p-4 overflow-y-auto">
                  <h3 className="font-medium text-gray-700 mb-2">Annotations ({shapes.length})</h3>
                  <ShapeList
                    shapes={shapes}
                    selectedShapeId={selectedShapeId}
                    onSelect={setSelectedShapeId}
                    onDelete={handleImageShapeDelete}
                    readOnly={false}
                  />
                  
                  {/* Submit Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleImageSubmit}
                      disabled={submitting || shapes.length === 0}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                               disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submit Annotation
                        </>
                      )}
                    </button>
                    {shapes.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Add at least one annotation to submit
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Text Annotation Editor
              <div className="flex-1 p-6">
                {currentTask.resource ? (
                  <TextAnnotationEditor
                    resource={{
                      id: currentTask.resource_id,
                      name: currentTask.resource.name,
                      full_content: currentTask.resource_content || currentTask.resource.full_content
                    }}
                    annotation={null}
                    annotationSubType={project?.config?.annotation_sub_type || 'ner'}
                    annotations={[]}
                    onSave={handleTextSave}
                    onCancel={handleSkipTask}
                    loading={submitting}
                    projectConfig={project?.config || {}}
                    projectId={projectId}
                  />
                ) : (
                  <div className="text-gray-500">Loading resource...</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : uploadStep ? (
        // Show upload UI for annotator-provided mode
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-emerald-600" />
            Upload Your Resource
          </h2>
          <p className="text-gray-600 mb-6">
            {project?.annotation_type === 'image'
              ? 'Upload an image file to annotate. Supported formats: PNG, JPG, JPEG, GIF, WebP'
              : 'Upload a text file to annotate. Supported formats: TXT, CSV, JSON'}
          </p>
          
          {/* File drop area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input').click()}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {project?.annotation_type === 'image' ? (
                  <Image className="w-8 h-8 text-emerald-600" />
                ) : (
                  <FileText className="w-8 h-8 text-emerald-600" />
                )}
                <span className="text-gray-700">{selectedFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Click to select a file or drag and drop
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {project?.annotation_type === 'image'
                    ? 'PNG, JPG, JPEG, GIF, WebP up to 10MB'
                    : 'TXT, CSV, JSON up to 10MB'}
                </p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept={project?.annotation_type === 'image' ? 'image/*' : '.txt,.csv,.json'}
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setUploadStep(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Start Annotating
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // Show "Start Annotating" landing page
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          {isPMProvided ? (
            <>
              <ClipboardList className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Ready to annotate?
              </h2>
              <p className="text-gray-500 mb-6">
                Claim a task to get started. You'll get one resource to annotate at a time.
              </p>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Ready to annotate?
              </h2>
              <p className="text-gray-500 mb-6">
                Upload your resource file and start annotating it.
              </p>
            </>
          )}
          
          <button
            onClick={handleStartAnnotating}
            disabled={claiming || (isPMProvided && taskStats && taskStats.available === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center 
                     gap-2 mx-auto font-medium"
          >
            {claiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Annotating
              </>
            )}
          </button>
          
          {isPMProvided && taskStats && taskStats.available === 0 && (
            <p className="mt-4 text-amber-600">
              No tasks currently available
            </p>
          )}
        </div>
      )}
      
      {/* Refresh stats */}
      <button
        onClick={fetchStats}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh stats
      </button>
    </div>
  );
};

export default AnnotationTaskPage;