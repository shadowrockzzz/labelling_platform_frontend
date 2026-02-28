import React, { useState, useEffect } from 'react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { textResourceService } from '../../services/textResourceService';
import { ANNOTATION_STATUSES } from '../../features/text-annotation/constants';
import { AlertCircle, Edit, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RejectedAnnotations Component
 * Shows annotators their rejected annotations with reviewer feedback
 */
const RejectedAnnotations = ({ projectId, onEditAnnotation }) => {
  const [rejectedAnnotations, setRejectedAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [resourceContent, setResourceContent] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadRejectedAnnotations();
    }
  }, [projectId]);

  const loadRejectedAnnotations = async () => {
    try {
      setLoading(true);
      // Fetch annotations with 'rejected' status for current user
      const response = await textAnnotationService.listAnnotations(projectId, {
        status: ANNOTATION_STATUSES.REJECTED,
      });
      setRejectedAnnotations(response.data || []);
    } catch (error) {
      console.error('Failed to load rejected annotations:', error);
      toast.error('Failed to load rejected annotations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnnotation = async (annotation) => {
    setSelectedAnnotation(annotation);
    setLoadingResource(true);
    
    try {
      // Load the resource content
      const resource = await textResourceService.getResource(projectId, annotation.resource_id);
      setResourceContent(resource);
    } catch (error) {
      console.error('Failed to load resource:', error);
      toast.error('Failed to load resource content');
    } finally {
      setLoadingResource(false);
    }
  };

  const handleEditClick = (annotation) => {
    if (onEditAnnotation) {
      onEditAnnotation(annotation);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Loading rejected annotations...</span>
        </div>
      </div>
    );
  }

  if (rejectedAnnotations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">My Rejected Annotations</h3>
        </div>
        <p className="text-center text-gray-500 py-8">
          You have no rejected annotations. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              My Rejected Annotations ({rejectedAnnotations.length})
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            Review feedback and make corrections to re-submit
          </p>
        </div>
      </div>

      {/* List of rejected annotations */}
      {!selectedAnnotation ? (
        <div className="grid gap-4">
          {rejectedAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                      REJECTED
                    </span>
                    <span className="text-sm text-gray-500">
                      Resource ID: {annotation.resource_id}
                    </span>
                  </div>
                  
                  {/* Show reviewer comments if any */}
                  {annotation.review_comment && (
                    <div className="bg-orange-50 rounded p-3 mb-3">
                      <div className="flex items-start">
                        <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-orange-800 mb-1">Reviewer Feedback:</p>
                          <p className="text-sm text-orange-900">{annotation.review_comment}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Rejected on: {new Date(annotation.updated_at).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleViewAnnotation(annotation)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center space-x-1"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleEditClick(annotation)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                    title="Edit and re-submit"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit & Re-submit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Selected annotation detail view */
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Annotation Details</h4>
            <button
              onClick={() => {
                setSelectedAnnotation(null);
                setResourceContent(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to list
            </button>
          </div>

          {loadingResource ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading resource content...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Reviewer feedback */}
              {selectedAnnotation.review_comment && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 mb-1">Reviewer Feedback:</p>
                      <p className="text-orange-900">{selectedAnnotation.review_comment}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resource content */}
              {resourceContent && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Resource Content:</h5>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {resourceContent.full_content || resourceContent.content || 'No content available'}
                    </pre>
                  </div>
                </div>
              )}

              {/* Annotation data */}
              {selectedAnnotation.annotation_data && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Your Annotation:</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {JSON.stringify(selectedAnnotation.annotation_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedAnnotation(null);
                    setResourceContent(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditClick(selectedAnnotation)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit & Re-submit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Load corrections for annotations if they exist */}
      {selectedAnnotation && (
        <CorrectionHistory
          projectId={projectId}
          annotationId={selectedAnnotation.id}
        />
      )}
    </div>
  );
};

/* Sub-component to show correction history */
const CorrectionHistory = ({ projectId, annotationId }) => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && annotationId) {
      loadCorrections();
    }
  }, [projectId, annotationId]);

  const loadCorrections = async () => {
    try {
      setLoading(true);
      const response = await textAnnotationService.listCorrections(projectId, annotationId);
      setCorrections(response.data || []);
    } catch (error) {
      console.error('Failed to load corrections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || corrections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h5 className="text-sm font-medium text-gray-700 mb-3">Correction History:</h5>
      <div className="space-y-2">
        {corrections.map((correction) => (
          <div
            key={correction.id}
            className={`p-3 rounded border ${
              correction.status === 'pending'
                ? 'border-yellow-300 bg-yellow-50'
                : correction.status === 'accepted'
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                correction.status === 'pending'
                  ? 'bg-yellow-200 text-yellow-800'
                  : correction.status === 'accepted'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-red-200 text-red-800'
              }`}>
                {correction.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(correction.created_at).toLocaleString()}
              </span>
            </div>
            {correction.comment && (
              <p className="text-sm text-gray-700 mt-1">{correction.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RejectedAnnotations;