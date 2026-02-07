import React from 'react';
import { Edit, Send, FileText } from 'lucide-react';
import { ANNOTATION_STATUSES, getSubTypeConfig, ANNOTATION_SUB_TYPES } from '../../features/text-annotation/constants';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

// Helper to get color class for label
const getLabelColorClass = (subType, label) => {
  const config = Object.values(ANNOTATION_SUB_TYPES).find(type => type.value === subType);
  if (!config) return 'bg-gray-200 text-gray-800';
  return config.labelColors[label] || 'bg-gray-200 text-gray-800';
};

// Helper to format annotation data for display
const formatAnnotationData = (annotation) => {
  const subType = annotation.annotation_sub_type || 'ner';
  const data = annotation.annotation_data || {};
  
  switch (subType) {
    case 'ner':
      return {
        icon: '🏷️',
        details: [
          data.confidence !== undefined && `Confidence: ${(data.confidence * 100).toFixed(0)}%`,
          data.nested && 'Nested Entity'
        ].filter(Boolean).join(' • ')
      };
    
    case 'pos':
      return {
        icon: '📝',
        details: [
          data.token_index !== undefined && `Index: ${data.token_index}`,
          data.batch && 'Batch'
        ].filter(Boolean).join(' • ')
      };
    
    case 'sentiment':
      return {
        icon: '😊',
        details: [
          data.intensity !== undefined && `Intensity: ${data.intensity}`,
          data.emotions && Object.keys(data.emotions).length > 0 && `${Object.keys(data.emotions).length} emotion(s)`
        ].filter(Boolean).join(' • ')
      };
    
    case 'relation':
      return {
        icon: '🔗',
        details: [
          data.relation_label || annotation.label,
          data.confidence !== undefined && `Confidence: ${(data.confidence * 100).toFixed(0)}%`
        ].filter(Boolean).join(' • ')
      };
    
    case 'span':
      return {
        icon: '📏',
        details: [
          data.subcategory && `Subcategory: ${data.subcategory}`,
          data.priority !== undefined && `Priority: ${data.priority}`
        ].filter(Boolean).join(' • ')
      };
    
    case 'classification':
      return {
        icon: '📊',
        details: [
          data.classification_type && `Type: ${data.classification_type}`,
          data.classes && data.classes.length > 0 && `${data.classes.length} class(es)`
        ].filter(Boolean).join(' • ')
      };
    
    case 'dependency':
      return {
        icon: '🌳',
        details: [
          data.relation && `Relation: ${data.relation}`,
          data.is_root && 'Root Token',
          data.head_token && `Head: ${data.head_token}`
        ].filter(Boolean).join(' • ')
      };
    
    case 'coreference':
      return {
        icon: '🔁',
        details: [
          data.chain_id && `Chain: ${data.chain_id}`,
          data.mention_type && `Type: ${data.mention_type}`,
          data.is_representative && 'Representative'
        ].filter(Boolean).join(' • ')
      };
    
    default:
      return {
        icon: '📄',
        details: `${Object.keys(data).length} field(s)`
      };
  }
};

const AnnotationList = ({ 
  annotations, 
  loading, 
  onSelect, 
  onEdit, 
  onSubmit, 
  canSubmit,
  canReview,
  resourceContent
}) => {
  // Handle both old model (multiple annotations) and new model (one annotation with spans)
  // NEW MODEL: annotations.spans contains the actual span data
  // OLD MODEL: each annotation is a separate span
  const isSingleAnnotationModel = annotations.length === 1 && annotations[0]?.spans && annotations[0].spans.length > 0;
  const spansToDisplay = isSingleAnnotationModel ? annotations[0].spans : annotations;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Loading annotations...</p>
      </div>
    );
  }

  if (spansToDisplay.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No annotations yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Select text in editor and choose a label to create your first annotation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Annotations
        </h3>
        <span className="text-sm text-gray-500">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {spansToDisplay.map((item, index) => {
          // Handle both old model (annotation) and new model (span)
          const isSpanModel = item.text !== undefined; // New model has 'text' field directly
          const annotation = isSpanModel ? {
            ...item,
            annotation_sub_type: annotations[0]?.annotation_sub_type || 'ner',
            id: item.id || `${annotations[0]?.id}_${item.span_id}`,
            status: annotations[0]?.status || 'pending',
            created_at: annotations[0]?.created_at,
            label: item.label
          } : item;
          
          const subTypeConfig = getSubTypeConfig(annotation.annotation_sub_type);
          const formattedData = formatAnnotationData(annotation);
          const hasSpan = annotation.span_start !== null && annotation.span_end !== null;
          
          return (
            <div
              key={annotation.id}
              className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => onSelect(annotation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header: Type, Label, Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {/* Sub-Type Badge */}
                      <span 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ backgroundColor: subTypeConfig?.color || '#6366f1', color: 'white' }}
                      >
                        {formattedData.icon} {subTypeConfig?.shortLabel || annotation.annotation_sub_type?.toUpperCase() || 'TEXT'}
                      </span>
                      
                      {/* Annotation Type Badge */}
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        TEXT
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[annotation.status] || statusColors.pending}`}>
                        {annotation.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      {/* Label Badge (if applicable) */}
                      {annotation.label && (
                        <span 
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getLabelColorClass(annotation.annotation_sub_type, annotation.label)}`}
                        >
                          {annotation.label}
                        </span>
                      )}
                    </div>

                    {/* Span Information */}
                    {hasSpan && resourceContent && (
                      <div className="mb-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600 font-mono">
                          <span className="text-gray-400">[{annotation.span_start}:{annotation.span_end}]</span>
                          <span className="ml-2 text-gray-900">
                            "{resourceContent.substring(annotation.span_start, annotation.span_end)}"
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Additional Details */}
                    {formattedData.details && (
                      <p className="text-xs text-gray-600 mb-2">
                        {formattedData.details}
                      </p>
                    )}

                    {/* Annotation Data Summary */}
                    {annotation.annotation_data && Object.keys(annotation.annotation_data).length > 0 && (
                      <details className="text-xs text-gray-500 mt-2">
                        <summary className="cursor-pointer hover:text-gray-700">
                          View details ({Object.keys(annotation.annotation_data).length} fields)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-left overflow-x-auto">
                          {JSON.stringify(annotation.annotation_data, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Review Comment */}
                    {annotation.review_comment && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-900">
                          <span className="font-semibold">Review:</span> {annotation.review_comment}
                        </p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {annotation.created_at && (
                        <span>Created: {new Date(annotation.created_at).toLocaleString()}</span>
                      )}
                      {annotation.submitted_at && (
                        <span>Submitted: {new Date(annotation.submitted_at).toLocaleString()}</span>
                      )}
                      {annotation.reviewed_at && (
                        <span>Reviewed: {new Date(annotation.reviewed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(annotation);
                  }}
                  className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit size={14} className="mr-1.5" />
                  Edit
                </button>
                
                {canSubmit && (annotation.status === ANNOTATION_STATUSES.PENDING || annotation.status === ANNOTATION_STATUSES.IN_PROGRESS) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubmit(annotation.id);
                    }}
                    className="flex items-center px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  >
                    <Send size={14} className="mr-1.5" />
                    Submit
                  </button>
                )}

                {canReview && (annotation.status === ANNOTATION_STATUSES.SUBMITTED || annotation.status === ANNOTATION_STATUSES.UNDER_REVIEW) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(annotation);
                    }}
                    className="flex items-center px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnotationList;