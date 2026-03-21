import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import HighlightableTextArea from '../../features/text-annotation/components/HighlightableTextArea';
import LabelPalette from '../../features/text-annotation/components/LabelPalette';
import { ANNOTATION_SUB_TYPES, getSubTypeConfig } from '../../features/text-annotation/constants';
import { textAnnotationService } from '../../services/textAnnotationService';

const TextAnnotationEditor = ({ 
  resource, 
  annotation, 
  annotationSubType = 'ner',
  annotations = [],
  onSave, 
  onCancel,
  loading,
  projectConfig = {},
  projectId
}) => {
  const [selectedText, setSelectedText] = useState({ text: '', start: null, end: null });
  const [selectedLabel, setSelectedLabel] = useState('');
  const [annotationData, setAnnotationData] = useState({});
  const [pendingSpans, setPendingSpans] = useState([]); // Local accumulation for batch submission
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent duplicate submissions

  const subTypeConfig = getSubTypeConfig(annotationSubType);
  const showSpanFields = subTypeConfig.fields.includes('span_start') && subTypeConfig.fields.includes('span_end');

  // Initialize with existing annotation data if editing
  useEffect(() => {
    if (annotation) {
      setSelectedLabel(annotation.label || '');
      setAnnotationData(annotation.annotation_data || {});
      
      // For span-based annotations, populate pendingSpans with existing data
      // Handle various annotation data formats
      if (showSpanFields && annotation.annotation_data) {
        const annData = annotation.annotation_data;
        let spans = [];
        
        // Check for 'spans' key (expected format)
        if (annData.spans && Array.isArray(annData.spans)) {
          spans = annData.spans;
        }
        // Check for 'entities' key (NER format)
        else if (annData.entities && Array.isArray(annData.entities)) {
          spans = annData.entities.map((ent, idx) => ({
            id: ent.id || `entity_${idx}`,
            text: ent.text || ent.entity_text || '',
            label: ent.label || ent.type || '',
            start: ent.start || ent.span_start || 0,
            end: ent.end || ent.span_end || 0,
            ...ent
          }));
        }
        // Check if annotation_data itself is an array of spans
        else if (Array.isArray(annData)) {
          spans = annData.map((span, idx) => ({
            id: span.id || `span_${idx}`,
            text: span.text || '',
            label: span.label || '',
            start: span.start || span.span_start || 0,
            end: span.end || span.span_end || 0,
            ...span
          }));
        }
        
        console.log('=== Initializing pendingSpans ===');
        console.log('Annotation data:', annData);
        console.log('Extracted spans:', spans);
        
        setPendingSpans(spans);
      }
    } else {
      // Clear pending spans when not editing
      setPendingSpans([]);
    }
  }, [annotation, showSpanFields]);

  // Handle text selection from HighlightableTextArea
  const handleTextSelect = (selection) => {
    setSelectedText(selection);
    // Clear previous label when new text is selected
    setSelectedLabel('');
  };

  // Handle label selection from LabelPalette
  const handleLabelSelect = (label) => {
    setSelectedLabel(label);
    // Removed auto-save - annotation is only created when clicking "Save & Continue" button
  };

  // Create annotation from selected text and label
  const createAnnotationFromSelection = (label) => {
    const data = {
      resource_id: resource.id,
      annotation_type: 'text',
      annotation_sub_type: annotationSubType,
      label: label,
      span_start: selectedText.start,
      span_end: selectedText.end,
      annotation_data: buildAnnotationData(label)
    };
    onSave(data);
    // Reset selection but keep editor open for continuous annotation
    setSelectedText({ text: '', start: null, end: null });
    setSelectedLabel('');
  };

  // Build annotation_data based on sub-type
  const buildAnnotationData = (label) => {
    const baseData = { ...annotationData };

    // Type-specific data structure
    switch (annotationSubType) {
      case 'ner':
        return {
          ...baseData,
          entity_text: selectedText.text,
          confidence: baseData.confidence || null,
          nested: baseData.nested || false
        };
      
      case 'pos':
        return {
          ...baseData,
          token: selectedText.text,
          token_index: calculateTokenIndex(selectedText.start),
          batch: baseData.batch || false
        };
      
      case 'sentiment':
        return {
          ...baseData,
          text: selectedText.text,
          intensity: baseData.intensity || 50,
          emotions: baseData.emotions || {}
        };
      
      case 'span':
        return {
          ...baseData,
          text: selectedText.text,
          category: label,
          subcategory: baseData.subcategory || null,
          overlaps_with: baseData.overlaps_with || [],
          priority: baseData.priority || 1
        };
      
      case 'dependency':
        return {
          ...baseData,
          head_token: baseData.head_token || '',
          dependent_token: selectedText.text,
          head_index: baseData.head_index || 0,
          dependent_index: calculateTokenIndex(selectedText.start),
          relation: label,
          is_root: baseData.is_root || false
        };
      
      case 'coreference':
        return {
          ...baseData,
          mention_text: selectedText.text,
          chain_id: baseData.chain_id || `CHAIN_${annotations.length + 1}`,
          mention_type: baseData.mention_type || 'proper_noun',
          is_representative: baseData.is_representative || false,
          other_mentions: baseData.other_mentions || []
        };
      
      default:
        return baseData;
    }
  };

  // Calculate token index (simplified)
  const calculateTokenIndex = (start) => {
    const textBefore = resource.full_content?.substring(0, start) || '';
    return textBefore.split(/\s+/).length - 1;
  };

  // Handle manual save (for non-span types or done button)
  const handleManualSave = async (e, closeEditor = false) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring...');
      return;
    }
    
    
    if (!showSpanFields) {
      // For non-span types, use old annotation model for now
      const data = {
        resource_id: resource.id,
        annotation_type: 'text',
        annotation_sub_type: annotationSubType,
        label: selectedLabel || annotationData.label || null,
        span_start: null,
        span_end: null,
        annotation_data: annotationData
      };
      onSave(data, closeEditor);
      return;
    }

    // For span types with "Done" button, submit batch
    await handleBatchSubmit(e, closeEditor);
  };

  // Clean span data by removing null/undefined/empty values
  const cleanSpanData = (spanData) => {
    return Object.fromEntries(
      Object.entries(spanData).filter(([_, value]) => {
        // Keep the value if it's not null, undefined, or empty string
        if (value === null || value === undefined || value === '') {
          return false;
        }
        // Keep 0 values (they're valid)
        if (value === 0) {
          return true;
        }
        // Keep arrays and objects that are not empty
        if (Array.isArray(value) || typeof value === 'object') {
          return true;
        }
        // Keep truthy values
        return true;
      })
    );
  };

  // Handle save and continue annotation (BATCH: accumulates locally, no API call)
  const handleSaveAndContinue = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (!showSpanFields || !selectedLabel) {
      console.error('Cannot save: no span selected or no label chosen');
      return;
    }

    try {
      // Build span object with unique ID
      const spanData = {
        id: `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: selectedText.text,
        label: selectedLabel,
        start: selectedText.start,
        end: selectedText.end,
        ...buildAnnotationData(selectedLabel)
      };

      // Clean up span data - remove null/undefined/empty values
      const cleanedSpanData = cleanSpanData(spanData);

      // Add to local state (NO API CALL)
      setPendingSpans(prev => [...prev, cleanedSpanData]);

      // Reset form for next annotation
      setSelectedText({ text: '', start: null, end: null });
      setSelectedLabel('');
      setAnnotationData({});
      setSubmitError('');

    } catch (error) {
      console.error('Failed to build span:', error);
    }
  };

  // Remove a pending span from local state
  const removePendingSpan = (spanId) => {
    setPendingSpans(prev => prev.filter(span => span.id !== spanId));
  };

  // Handle batch submission (Done button)
  const handleBatchSubmit = async (e, closeEditor = true) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring...');
      return;
    }
    
    if (pendingSpans.length === 0 && !annotation) {
      setSubmitError('No spans to submit. Please add at least one annotation.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (annotation) {
        // Editing existing annotation - update it
        const updateData = {
          annotation_data: {
            spans: (pendingSpans && pendingSpans.length > 0) 
              ? pendingSpans 
              : (annotation.annotation_data?.spans || [])
          }
        };
        
        // Log payload for debugging
        console.log('=== Saving Annotation ===');
        console.log('Payload:', JSON.stringify(updateData, null, 2));
        console.log('Pending spans:', pendingSpans);
        console.log('Original annotation spans:', annotation.annotation_data?.spans);
        console.log('Annotation ID:', annotation.id);
        console.log('Project ID:', projectId);
        
        await textAnnotationService.updateAnnotation(projectId, annotation.id, updateData);
      } else {
        // Creating new annotation
        const batchData = {
          resource_id: resource.id,
          annotation_type: 'text',
          annotation_sub_type: annotationSubType,
          spans: pendingSpans || []
        };

        await textAnnotationService.createAnnotation(
          projectId,
          batchData
        );
      }

      // Clear pending spans on success
      setPendingSpans([]);
      setSubmitError('');

      // Call onSave to refresh annotations in parent
      // Pass null to indicate no resubmission needed (batch already submitted)
      if (onSave) {
        onSave(null, closeEditor);
      }

    } catch (error) {
      console.error('Failed to submit batch:', error);
      // Keep pending spans for retry
      setSubmitError(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        error.message || 
        'Failed to submit annotations. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update annotation_data field
  const updateAnnotationData = (field, value) => {
    setAnnotationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to get button text based on state
  const getSaveButtonText = () => {
    if (isSubmitting) return 'Saving...';
    if (loading) return 'Loading...';
    
    if (showSpanFields && !annotation) return 'Save & Continue';
    if (annotation) return 'Update';
    return 'Save';
  };

  // Helper function to get Done button text
  const getDoneButtonText = () => {
    if (isSubmitting) return 'Submitting...';
    if (loading) return 'Loading...';
    return `Done (${pendingSpans ? pendingSpans.length : 0})`;
  };

  // Render type-specific form fields
  const renderTypeSpecificFields = () => {
    switch (annotationSubType) {
      case 'ner':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Score (0.0 - 1.0)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={annotationData.confidence || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  // Only update if within valid range or empty
                  if (isNaN(val) || (val >= 0 && val <= 1)) {
                    updateAnnotationData('confidence', isNaN(val) ? null : val);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0 - 1.0"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="nested"
                checked={annotationData.nested || false}
                onChange={(e) => updateAnnotationData('nested', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="nested" className="text-sm text-gray-700">Nested Entity</label>
            </div>
          </div>
        );

      case 'pos':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="batch"
                checked={annotationData.batch || false}
                onChange={(e) => updateAnnotationData('batch', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="batch" className="text-sm text-gray-700">Batch Annotation</label>
            </div>
          </div>
        );

      case 'sentiment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intensity (0-100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={annotationData.intensity || 50}
                onChange={(e) => updateAnnotationData('intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{annotationData.intensity || 50}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emotions (JSON)</label>
              <textarea
                value={JSON.stringify(annotationData.emotions || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateAnnotationData('emotions', JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
                placeholder='{"joy": 0.8, "anger": 0.1}'
              />
            </div>
          </div>
        );

      case 'relation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Head Entity (JSON)</label>
              <textarea
                value={JSON.stringify(annotationData.head_entity || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateAnnotationData('head_entity', JSON.parse(e.target.value));
                  } catch (err) {}
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
                placeholder='{"text": "John", "label": "PERSON", "start": 0, "end": 4}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tail Entity (JSON)</label>
              <textarea
                value={JSON.stringify(annotationData.tail_entity || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateAnnotationData('tail_entity', JSON.parse(e.target.value));
                  } catch (err) {}
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={3}
                placeholder='{"text": "Google", "label": "ORG", "start": 10, "end": 16}'
              />
            </div>
          </div>
        );

      case 'span':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <input
                type="text"
                value={annotationData.subcategory || ''}
                onChange={(e) => updateAnnotationData('subcategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional subcategory"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority (1-5)</label>
              <select
                value={annotationData.priority || 1}
                onChange={(e) => updateAnnotationData('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'classification':
        const classificationType = projectConfig?.classificationType || 'multi_class';
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classification Type: <span className="font-semibold text-blue-600">{classificationType.replace('_', '-')}</span>
              </label>
              <p className="text-xs text-gray-500">
                {classificationType === 'binary' && 'Binary classification: Select one of two mutually exclusive classes'}
                {classificationType === 'multi_class' && 'Multi-class classification: Select one of three or more mutually exclusive classes'}
                {classificationType === 'multi_label' && 'Multi-label classification: Select multiple classes simultaneously'}
              </p>
            </div>
          </div>
        );

      case 'dependency':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Head Token</label>
              <input
                type="text"
                value={annotationData.head_token || ''}
                onChange={(e) => updateAnnotationData('head_token', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 'said'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Head Index</label>
              <input
                type="number"
                value={annotationData.head_index || ''}
                onChange={(e) => updateAnnotationData('head_index', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Token index of head"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_root"
                checked={annotationData.is_root || false}
                onChange={(e) => updateAnnotationData('is_root', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="is_root" className="text-sm text-gray-700">Root Token</label>
            </div>
          </div>
        );

      case 'coreference':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chain ID</label>
              <input
                type="text"
                value={annotationData.chain_id || ''}
                onChange={(e) => updateAnnotationData('chain_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. CHAIN_1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mention Type</label>
              <select
                value={annotationData.mention_type || 'proper_noun'}
                onChange={(e) => updateAnnotationData('mention_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="proper_noun">Proper Noun</option>
                <option value="common_noun">Common Noun</option>
                <option value="pronoun">Pronoun</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_representative"
                checked={annotationData.is_representative || false}
                onChange={(e) => updateAnnotationData('is_representative', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="is_representative" className="text-sm text-gray-700">Representative Mention</label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {annotation ? 'Edit Annotation' : 'Create Annotation'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {subTypeConfig.label} — {subTypeConfig.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Resource Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <p className="font-medium text-gray-900">{resource.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Text Area */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Text Content</h4>
          <HighlightableTextArea
            content={resource.full_content || ''}
            annotations={annotations}
            onTextSelect={handleTextSelect}
            annotationType={annotationSubType}
            readOnly={false}
          />
        </div>

        {/* Right Column: Labels & Form */}
        <div>
          {/* Label Palette */}
          <div className="mb-6">
            <LabelPalette
              annotationType={annotationSubType}
              projectConfig={projectConfig}
              onLabelSelect={handleLabelSelect}
              selectedLabel={selectedLabel}
            />
          </div>

          {/* Type-Specific Fields */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {showSpanFields ? 'Additional Fields' : 'Annotation Details'}
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {renderTypeSpecificFields()}
            </div>
          </div>

          {/* Pending/Existing Spans List (for span-based annotations) */}
          {showSpanFields && pendingSpans.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span>
                  {annotation ? `Existing Spans (${pendingSpans.length})` : `Pending Spans (${pendingSpans.length})`}
                </span>
                <span className="ml-2 text-sm font-normal text-blue-700">
                  {annotation ? '- Click Update to save changes' : '- Ready to submit'}
                </span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingSpans.map((span) => (
                  <div 
                    key={span.id} 
                    className="flex items-center justify-between bg-white p-2 rounded-md border border-blue-100"
                  >
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        {span.label}
                      </span>
                      <span className="text-sm text-gray-700 font-mono">
                        [{span.start}:{span.end}]
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        "{span.text}"
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingSpan(span.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove span"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Error Message */}
          {submitError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 font-medium">
                {submitError}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition-colors flex items-center"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
            {showSpanFields ? (
              <>
                {/* Show "Save & Continue" button for span-based annotations (both create and edit) */}
                <button
                  type="button"
                  onClick={handleSaveAndContinue}
                  disabled={loading || isSubmitting || !selectedLabel}
                  className={`px-4 py-2 rounded-md text-white transition-colors flex items-center ${
                    loading || isSubmitting || !selectedLabel
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Save size={16} className="mr-2" />
                  Save & Continue
                </button>
                {/* Show "Done" button for span-based annotations (batch submission) - both create and edit */}
                <button
                  type="button"
                  onClick={(e) => handleManualSave(e, true)}
                  disabled={loading || isSubmitting || pendingSpans.length === 0}
                  className={`px-4 py-2 rounded-md text-white transition-colors flex items-center ${
                    loading || isSubmitting || pendingSpans.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Save size={16} className="mr-2" />
                  {getDoneButtonText()}
                </button>
              </>
            ) : null}
            {!showSpanFields && !annotation && (
              <button
                type="button"
                onClick={handleManualSave}
                disabled={loading || isSubmitting || !selectedLabel}
                className={`px-4 py-2 rounded-md text-white transition-colors flex items-center ${
                  loading || isSubmitting || !selectedLabel
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Save size={16} className="mr-2" />
                Save
              </button>
            )}
            {!showSpanFields && annotation && (
              <button
                type="button"
                onClick={handleManualSave}
                disabled={loading || isSubmitting}
                className={`px-4 py-2 rounded-md text-white transition-colors flex items-center ${
                  loading || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Save size={16} className="mr-2" />
                Update
              </button>
            )}
          </div>
        </div>
      </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select text in content area to create an annotation</li>
              <li>• Click a label from palette to apply it</li>
              {showSpanFields && (
                <>
                  <li>• Click "Save & Continue" to add new spans to the list</li>
                  <li>• You can remove spans by clicking the trash icon</li>
                  <li>• Click "Done" to save all spans (existing + new)</li>
                </>
              )}
              {!showSpanFields && (
                <li>• For non-span types: Fill in form fields and click Save/Update</li>
              )}
              <li>• Press Escape to clear text selection</li>
            </ul>
          </div>
    </div>
  );
};

export default TextAnnotationEditor;