import React, { useState } from 'react';
import { ANNOTATION_TYPES, ANNOTATION_SUB_TYPES } from '../../features/text-annotation/constants';

const TextAnnotationEditor = ({ resource, annotation, onSave, onCancel, loading }) => {
  const [annotationType, setAnnotationType] = useState(ANNOTATION_TYPES.GENERAL);
  const [label, setLabel] = useState('');
  const [spanStart, setSpanStart] = useState('');
  const [spanEnd, setSpanEnd] = useState('');
  const [annotationData, setAnnotationData] = useState('{}');

  // Initialize with existing annotation data if editing
  React.useEffect(() => {
    if (annotation) {
      setAnnotationType(annotation.annotation_type || ANNOTATION_TYPES.GENERAL);
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
      annotation_type: annotationType,
      label: label || null,
      span_start: spanStart ? parseInt(spanStart) : null,
      span_end: spanEnd ? parseInt(spanEnd) : null,
      annotation_data: annotationData ? JSON.parse(annotationData) : {}
    };

    onSave(data);
  };

  const currentSubType = ANNOTATION_SUB_TYPES[annotationType];

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

        {/* Annotation Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annotation Type
          </label>
          <select
            value={annotationType}
            onChange={(e) => setAnnotationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ANNOTATION_TYPES).map(([key, value]) => (
              <option key={value} value={value}>
                {ANNOTATION_SUB_TYPES[value]?.label || key}
              </option>
            ))}
          </select>
        </div>

        {/* Label */}
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
          {currentSubType?.labels && (
            <div className="mt-2 flex flex-wrap gap-2">
              {currentSubType.labels.map((labelOption) => (
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

        {/* Span Selection (for NER) */}
        {annotationType === ANNOTATION_TYPES.NER && (
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
        </div>

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