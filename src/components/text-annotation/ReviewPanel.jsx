import React, { useState } from 'react';
import { ANNOTATION_STATUSES } from '../../features/text-annotation/constants';

const ReviewPanel = ({ annotations, onReview, loading }) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const handleReview = async (action) => {
    if (!selectedAnnotation) return;
    
    await onReview(selectedAnnotation.id, action, reviewComment);
    setSelectedAnnotation(null);
    setReviewComment('');
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
    </div>
  );
};

export default ReviewPanel;