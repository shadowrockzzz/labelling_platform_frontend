import React, { useState } from 'react';
import { ANNOTATION_TYPES, ANNOTATION_SUB_TYPES, getSubTypeConfig, getSubTypeLabels } from '../../features/text-annotation/constants';

const TextAnnotationEditor = ({ resource, annotation, onSave, onCancel, loading }) => {
  const [annotationSubType, setAnnotationSubType] = useState(ANNOTATION_SUB_TYPES.NER);
  const [label, setLabel] = useState('');
  const [spanStart, setSpanStart] = useState('');
  const [spanEnd, setSpanEnd] = useState('');
  const [annotationData, setAnnotationData] = useState('{}');

  // Initialize with existing annotation data if editing
  React.useEffect(() => {
    if (annotation) {
      setAnnotationSubType(annotation.annotation_sub_type || ANNOTATION_SUB_TYPES.NER);
      setLabel(annotation.label || '');
      setSpanStart(annotation.span_start || '');
      setSpanEnd(annotation.span_end || '');
      setAnnotationData(JSON.stringify(annotation.annotation_data || {}, null, 2));
    }
  }, [annotation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      resource_id: resource.id,
      annotation_type: ANNOTATION_TYPES.TEXT, // Always 'text' for this module
      annotation_sub_type: annotationSubType,
      label: label || null,
      span_start: spanStart ? parseInt(spanStart) : null,
      span_end: spanEnd ? parseInt(spanEnd) : null,
      annotation_data: annotationData ? JSON.parse(annotationData) : {}
    };

    onSave(data);
  };

  const subTypeConfig = getSubTypeConfig(annotationSubType);
  const labels = getSubTypeLabels(annotationSubType);
  const showSpanFields = subTypeConfig.fields.includes('span_start') && subTypeConfig.fields.includes('span_end');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">
        {annotation ? 'Edit Annotation' : 'Create Annotation'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Resource Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium text-gray-900">{resource.name}</p>
          {resource.full_content && (
            <p className="mt-2 text-sm text-gray-600">
              {resource.full_content.substring(0, 200)}...
            </p>
          )}
        </div>

        {/* Annotation Sub-Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annotation Type
          </label>
          <select
            value={annotationSubType}
            onChange={(e) => setAnnotationSubType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(ANNOTATION_SUB_TYPES).map((subType) => {
              const config = getSubTypeConfig(subType);
              return (
                <option key={subType} value={subType}>
                  {config.label}
                </option>
              );
            })}
          </select>
          {subTypeConfig.description && (
            <p className="mt-1 text-sm text-gray-500">
              {subTypeConfig.description}
            </p>
          )}
        </div>

        {/* Label */}
        {subTypeConfig.fields.includes('label') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter label"
            />
            {labels && labels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {labels.map((labelOption) => (
                  <button
                    key={labelOption}
                    type="button"
                    onClick={() => setLabel(labelOption)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      label === labelOption
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {labelOption}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Span Selection (for types that use spans) */}
        {showSpanFields && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Span Start
              </label>
              <input
                type="number"
                value={spanStart}
                onChange={(e) => setSpanStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Character index"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Span End
              </label>
              <input
                type="number"
                value={spanEnd}
                onChange={(e) => setSpanEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Character index"
                min="0"
              />
            </div>
          </div>
        )}

        {/* Annotation Data (JSON) */}
        {subTypeConfig.fields.includes('annotation_data') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Data (JSON)
            </label>
            <textarea
              value={annotationData}
              onChange={(e) => setAnnotationData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={6}
              placeholder='{"key": "value"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              Required fields based on selected type: 
              {Object.entries(subTypeConfig.dataStructure || {})
                .filter(([_, field]) => field.required)
                .map(([key, _]) => key)
                .join(', ') || 'none'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Saving...' : annotation ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextAnnotationEditor;