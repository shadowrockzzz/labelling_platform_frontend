import React from 'react';
import { ANNOTATION_STATUS } from '../../features/text-annotation/constants';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const AnnotationList = ({ 
  annotations, 
  loading, 
  onSelect, 
  onEdit, 
  onSubmit, 
  canSubmit,
  canReview
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Loading annotations...</p>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No annotations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Annotations</h3>
      <div className="space-y-4">
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="border border-gray-200 rounded-md hover:shadow-md transition-shadow"
          >
            <div 
              className="p-4 cursor-pointer"
              onClick={() => onSelect(annotation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {annotation.annotation_type?.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColors[annotation.status] || statusColors.pending}`}>
                      {annotation.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {annotation.label && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Label:</span> {annotation.label}
                    </p>
                  )}
                  {annotation.span_start !== null && annotation.span_end !== null && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Span:</span> {annotation.span_start} - {annotation.span_end}
                    </p>
                  )}
                  {annotation.annotation_data && Object.keys(annotation.annotation_data).length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {Object.keys(annotation.annotation_data).length} additional field(s)
                    </p>
                  )}
                  {annotation.review_comment && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      <span className="font-medium not-italic">Review:</span> {annotation.review_comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(annotation);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Edit
              </button>
              {canSubmit && (annotation.status === ANNOTATION_STATUS.PENDING || annotation.status === ANNOTATION_STATUS.IN_PROGRESS) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubmit(annotation.id);
                  }}
                  className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationList;