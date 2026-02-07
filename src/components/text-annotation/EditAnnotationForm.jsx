import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Modal from '../common/Modal';

const EditAnnotationForm = ({
  isOpen,
  onClose,
  annotation,
  projectId,
  onCreateCorrection,
  isSubmitting = false
}) => {
  const [correctedData, setCorrectedData] = useState(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('spans');

  useEffect(() => {
    if (annotation) {
      // Initialize corrected data with current annotation data
      if (annotation.annotation_data && annotation.annotation_data.spans) {
        setCorrectedData({
          spans: JSON.parse(JSON.stringify(annotation.annotation_data.spans))
        });
      } else {
        setCorrectedData({
          spans: []
        });
      }
    }
  }, [annotation]);

  const handleSpanChange = (spanId, field, value) => {
    setCorrectedData(prev => ({
      ...prev,
      spans: prev.spans.map(span =>
        span.id === spanId ? { ...span, [field]: value } : span
      )
    }));
  };

  const handleDeleteSpan = (spanId) => {
    setCorrectedData(prev => ({
      ...prev,
      spans: prev.spans.filter(span => span.id !== spanId)
    }));
  };

  const handleAddSpan = () => {
    setCorrectedData(prev => ({
      ...prev,
      spans: [...prev.spans, {
        id: `span_${Date.now()}`,
        text: '',
        label: '',
        start: 0,
        end: 0
      }]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateCorrection(correctedData, comment);
  };

  const isReviewer = annotation?.reviewer_id !== null;

  if (!annotation) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Annotation"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('spans')}
              className={`${
                activeTab === 'spans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Spans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`${
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Metadata
            </button>
          </nav>
        </div>

        {/* Spans Tab */}
        {activeTab === 'spans' && (
          <div className="space-y-4">
            {correctedData && correctedData.spans && correctedData.spans.length > 0 ? (
              <div className="space-y-3">
                {correctedData.spans.map((span) => (
                  <div key={span.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        Span: {span.text || 'No text selected'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpan(span.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete span"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={span.label || ''}
                          onChange={(e) => handleSpanChange(span.id, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Entity type"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text
                        </label>
                        <input
                          type="text"
                          value={span.text || ''}
                          onChange={(e) => handleSpanChange(span.id, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Annotated text"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Position
                        </label>
                        <input
                          type="number"
                          value={span.start || 0}
                          onChange={(e) => handleSpanChange(span.id, 'start', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Position
                        </label>
                        <input
                          type="number"
                          value={span.end || 0}
                          onChange={(e) => handleSpanChange(span.id, 'end', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No spans in this annotation
              </div>
            )}
            
            <button
              type="button"
              onClick={handleAddSpan}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add New Span
            </button>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (required)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Explain the corrections you're making..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This comment will be visible to the original annotator.
              </p>
            </div>
          </div>
        )}

        {/* Current Annotation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Original Annotation
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Annotator:</strong> {annotation.annotator_name || 'Unknown'}</p>
            <p><strong>Created:</strong> {new Date(annotation.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> {annotation.status}</p>
            {annotation.annotation_data?.spans && (
              <p><strong>Spans:</strong> {annotation.annotation_data.spans.length}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Create Correction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAnnotationForm;