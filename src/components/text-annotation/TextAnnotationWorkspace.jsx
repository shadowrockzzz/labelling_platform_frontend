import React, { useState } from 'react';
import { useTextResources } from '../../hooks/useTextResources';
import { useTextAnnotations } from '../../hooks/useTextAnnotations';
import { textResourceService } from '../../services/textResourceService';
import ResourceUploader from './ResourceUploader';
import ResourceList from './ResourceList';
import TextAnnotationEditor from './TextAnnotationEditor';
import AnnotationList from './AnnotationList';
import ReviewPanel from './ReviewPanel';
import QueueStatus from './QueueStatus';
import { ANNOTATION_STATUS } from '../../features/text-annotation/constants';

const TextAnnotationWorkspace = ({ projectId, userRole, project }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('annotate'); // 'annotate' or 'review'

  const {
    resources,
    loading: resourcesLoading,
    uploadResource,
    addUrlResource,
    deleteResource,
  } = useTextResources(projectId);

  const {
    annotations,
    loading: annotationsLoading,
    createAnnotation,
    updateAnnotation,
    submitAnnotation,
    reviewAnnotation,
    fetchAnnotations,
  } = useTextAnnotations(
    projectId, 
    activeTab === 'review' ? { status: 'submitted' } : (selectedResource ? { resource_id: selectedResource.id } : {})
  );

  // Determine user capabilities based on role (convert to uppercase for comparison)
  const normalizedRole = userRole ? userRole.toUpperCase() : '';
  const canUpload = ['ADMIN', 'PROJECT_MANAGER', 'ANNOTATOR'].includes(normalizedRole);
  const canAnnotate = ['ADMIN', 'PROJECT_MANAGER', 'ANNOTATOR'].includes(normalizedRole);
  const canReview = ['ADMIN', 'PROJECT_MANAGER', 'REVIEWER'].includes(normalizedRole);

  const handleResourceSelect = async (resource) => {
    setSelectedResource(resource);
    setEditingAnnotation(null);
    setShowEditor(false);
    // Fetch annotations for this resource
    fetchAnnotations(1, { resource_id: resource.id });
  };

  const handleCreateAnnotation = () => {
    if (!selectedResource) {
      alert('Please select a resource first');
      return;
    }
    setEditingAnnotation(null);
    setShowEditor(true);
  };

  const handleEditAnnotation = (annotation) => {
    setEditingAnnotation(annotation);
    setShowEditor(true);
  };

  const handleSaveAnnotation = async (data) => {
    try {
      if (editingAnnotation) {
        await updateAnnotation(editingAnnotation.id, data);
      } else {
        await createAnnotation(data);
      }
      setShowEditor(false);
      setEditingAnnotation(null);
    } catch (error) {
      alert('Failed to save annotation: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitAnnotation = async (annotationId) => {
    try {
      await submitAnnotation(annotationId);
      alert('Annotation submitted for review');
    } catch (error) {
      alert('Failed to submit annotation: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReviewAnnotation = async (annotationId, action, comment) => {
    try {
      await reviewAnnotation(annotationId, action, comment);
      alert(`Annotation ${action}d successfully`);
    } catch (error) {
      alert(`Failed to ${action} annotation: ` + (error.response?.data?.error || error.message));
    }
  };

  const handleUpload = async (file, name) => {
    try {
      await uploadResource(file, name);
      alert('Resource uploaded successfully');
    } catch (error) {
      alert('Failed to upload resource: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddUrl = async (url, name) => {
    try {
      await addUrlResource(url, name);
      alert('Resource added successfully');
    } catch (error) {
      alert('Failed to add resource: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await deleteResource(resourceId);
      if (selectedResource?.id === resourceId) {
        setSelectedResource(null);
        setShowEditor(false);
      }
      alert('Resource deleted successfully');
    } catch (error) {
      alert('Failed to delete resource: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200">
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
        {canReview && (
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'review'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Review
          </button>
        )}
      </div>

      {activeTab === 'annotate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Resources */}
          <div className="space-y-6">
            {canUpload && (
              <ResourceUploader
                onUpload={handleUpload}
                onAddUrl={handleAddUrl}
                loading={resourcesLoading}
              />
            )}
            <ResourceList
              resources={resources}
              loading={resourcesLoading}
              onSelect={handleResourceSelect}
              onDelete={canUpload ? handleDeleteResource : null}
            />
          </div>

          {/* Right Column: Annotations */}
          <div className="space-y-6">
            {showEditor && selectedResource ? (
              <TextAnnotationEditor
                resource={selectedResource}
                annotation={editingAnnotation}
                annotationSubType={project?.config?.textSubType || ''}
                onSave={handleSaveAnnotation}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingAnnotation(null);
                }}
                loading={annotationsLoading}
              />
            ) : (
              <>
                {canAnnotate && selectedResource && (
                  <button
                    onClick={handleCreateAnnotation}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    Create New Annotation
                  </button>
                )}
                <AnnotationList
                  annotations={annotations}
                  loading={annotationsLoading}
                  onSelect={() => {}}
                  onEdit={handleEditAnnotation}
                  onSubmit={handleSubmitAnnotation}
                  canSubmit={canAnnotate}
                  canReview={canReview}
                />
              </>
            )}
            
            {/* Queue Status */}
            <QueueStatus projectId={projectId} />
          </div>
        </div>
      ) : (
        /* Review Tab */
        <ReviewPanel
          annotations={annotations}
          onReview={handleReviewAnnotation}
          loading={annotationsLoading}
        />
      )}
    </div>
  );
};

export default TextAnnotationWorkspace;