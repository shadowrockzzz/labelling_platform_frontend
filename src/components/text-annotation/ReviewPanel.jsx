import React, { useState, useEffect } from 'react';
import { ANNOTATION_STATUSES } from '../../features/text-annotation/constants';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { toast } from 'react-hot-toast';
import EditAnnotationForm from './EditAnnotationForm';

const ReviewPanel = ({ annotations, onReview, loading, projectId }) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [isCreatingCorrection, setIsCreatingCorrection] = useState(false);
  const [showCorrectionHistory, setShowCorrectionHistory] = useState(null);

  useEffect(() => {
    // Load corrections when an annotation is selected
    const loadCorrections = async () => {
      if (selectedAnnotation && projectId) {
        try {
          const response = await textAnnotationService.listCorrections(
            projectId,
            selectedAnnotation.id
          );
          setCorrections(response.data || []);
        } catch (error) {
          console.error('Failed to load corrections:', error);
          toast.error('Failed to load corrections');
        }
      }
    };
    
    loadCorrections();
  }, [selectedAnnotation, projectId]);

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

  const handleAcceptCorrection = async (correctionId, annotatorResponse) => {
    if (!projectId) return;
    
    try {
      await textAnnotationService.acceptCorrection(
        projectId,
        correctionId,
        annotatorResponse
      );
      toast.success('Correction accepted and applied');
      
      // Reload corrections
      const response = await textAnnotationService.listCorrections(
        projectId,
        selectedAnnotation.id
      );
      setCorrections(response.data || []);
    } catch (error) {
      console.error('Failed to accept correction:', error);
      toast.error('Failed to accept correction');
    }
  };

  const handleReview = async (action) => {
    if (!selectedAnnotation) return;
    
    await onReview(selectedAnnotation.id, action, reviewComment);
    setSelectedAnnotation(null);
    setReviewComment('');
    setCorrections([]);
  };

  const pendingReview = annotations.filter(
    a => a.status === ANNOTATION_STATUSES.UNDER_REVIEW || a.status === ANNOTATION_STATUSES.SUBMITTED
  );

  if (pendingReview.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Review Queue</h3>
        <p className="text-center text-gray-500">No annotations pending review</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Review Queue ({pendingReview.length})</h3>
      
      {!selectedAnnotation ? (
        <div className="space-y-4">
          {pendingReview.map((annotation) => (
            <div
              key={annotation.id}
              className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAnnotation(annotation)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {annotation.annotation_type?.toUpperCase()}
                  </p>
                  {annotation.label && (
                    <p className="text-sm text-gray-600">Label: {annotation.label}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(annotation.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Annotation Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                {selectedAnnotation.annotation_type?.toUpperCase()}
              </h4>
              <button
                onClick={() => setSelectedAnnotation(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to list
              </button>
            </div>
            {selectedAnnotation.label && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Label:</span> {selectedAnnotation.label}
              </p>
            )}
            {selectedAnnotation.span_start !== null && selectedAnnotation.span_end !== null && (
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Span:</span> {selectedAnnotation.span_start} - {selectedAnnotation.span_end}
              </p>
            )}
            {selectedAnnotation.annotation_data && Object.keys(selectedAnnotation.annotation_data).length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-blue-600 cursor-pointer">View additional data</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(selectedAnnotation.annotation_data, null, 2)}
                </pre>
              </details>
            )}
          </div>

          {/* Review Form */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Comment
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add your review comments here..."
            />
          </div>

          {/* Corrections Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
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
              <div className="space-y-3">
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            correction.status === 'accepted'
                              ? 'bg-green-200 text-green-800'
                              : correction.status === 'rejected'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {correction.status}
                          </span>
                          <span className="text-xs text-gray-600">
                            {new Date(correction.created_at).toLocaleString()}
                          </span>
                        </div>
                        {correction.comment && (
                          <p className="text-sm text-gray-700 italic">"{correction.comment}"</p>
                        )}
                      </div>
                      
                      {/* Show corrected data summary */}
                      <button
                        type="button"
                        onClick={() => setShowCorrectionHistory(showCorrectionHistory === correction.id ? null : correction.id)}
                        className="ml-2 text-gray-600 hover:text-gray-900"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>

                    {/* Expandable correction details */}
                    {showCorrectionHistory === correction.id && correction.corrected_data && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-900 mb-2">Corrected Data:</p>
                        {correction.corrected_data.spans && (
                          <div className="space-y-2">
                            {correction.corrected_data.spans.map((span, idx) => (
                              <div key={idx} className="text-xs bg-white p-2 rounded border">
                                <p><strong>Label:</strong> {span.label}</p>
                                <p><strong>Text:</strong> {span.text}</p>
                                <p><strong>Position:</strong> {span.start} - {span.end}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                          {JSON.stringify(correction.corrected_data, null, 2)}
                        </pre>
                        
                        {/* Show annotator response if exists */}
                        {correction.annotator_response && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-900 mb-1">
                              Annotator Response:
                            </p>
                            <p className="text-sm text-gray-700 italic">
                              "{correction.annotator_response}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accept/Reject buttons for pending corrections (annotator action) */}
                    {correction.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptCorrection(correction.id, reviewComment)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center justify-center space-x-1"
                        >
                          <CheckCircle size={16} />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview('reject')}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center justify-center space-x-1"
                        >
                          <XCircle size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No corrections suggested yet</p>
            )}
          </div>

          {/* Review Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleReview('approve')}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => handleReview('reject')}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? 'Processing...' : 'Reject'}
            </button>
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
