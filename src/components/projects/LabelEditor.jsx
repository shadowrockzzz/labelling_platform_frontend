import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import ColorPicker from './ColorPicker.jsx';

/**
 * LabelEditor Component
 * Allows admins/project managers to customize labels for text annotation projects
 */
const LabelEditor = ({ textSubType, config, onConfigChange, isSubmitting }) => {
  const [useCustomLabels, setUseCustomLabels] = useState(false);
  const [labels, setLabels] = useState([]);
  const [errors, setErrors] = useState({});
  const isInitializing = useRef(false);

  // Initialize state from config (when textSubType changes or when customLabels actually change)
  useEffect(() => {
    // Skip if we're already initializing
    if (isInitializing.current) {
      return;
    }

    isInitializing.current = true;
    const hasCustomLabels = config?.customLabels && config.customLabels.length > 0;
    
    setUseCustomLabels(hasCustomLabels);
    
    if (hasCustomLabels) {
      setLabels(config.customLabels);
    } else {
      // If switching to default labels, clear labels array
      setLabels([]);
    }
    
    // Reset initialization flag after a brief delay
    const timer = setTimeout(() => {
      isInitializing.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [textSubType, config?.customLabels]); // Re-run when textSubType OR customLabels change

  const handleUseCustomToggle = (checked) => {
    setUseCustomLabels(checked);
    setErrors({});
    isInitializing.current = true;

    if (checked) {
      // When switching to custom, start with single empty label OR use existing custom labels
      if (config?.customLabels && config.customLabels.length > 0) {
        // Preserve existing custom labels when switching back to custom mode
        setLabels(config.customLabels);
        updateConfig(config.customLabels);
      } else {
        // Start fresh with single empty label
        setLabels([{ name: '', color: '#3B82F6' }]);
        updateConfig([{ name: '', color: '#3B82F6' }]);
      }
    } else {
      // Clear custom labels
      setLabels([]);
      updateConfig(null);
    }

    const timer = setTimeout(() => {
      isInitializing.current = false;
    }, 100);
    return () => clearTimeout(timer);
  };

  const handleAddLabel = () => {
    if (labels.length >= 20) {
      setErrors({ ...errors, general: 'Maximum of 20 labels allowed' });
      return;
    }
    
    const newLabel = {
      name: '',
      color: '#3B82F6'
    };
    
    const newLabels = [...labels, newLabel];
    setLabels(newLabels);
    updateConfig(newLabels);
  };

  const handleRemoveLabel = (index) => {
    if (labels.length <= 1) {
      setErrors({ ...errors, general: 'At least one label is required' });
      return;
    }
    
    const newLabels = labels.filter((_, i) => i !== index);
    setLabels(newLabels);
    setErrors({});
    updateConfig(newLabels);
  };

  const handleLabelChange = (index, field, value) => {
    const newLabels = [...labels];
    newLabels[index][field] = value;
    
    // Validate
    const newErrors = { ...errors };
    
    if (field === 'name') {
      // Check for duplicates
      const nameUpper = value.toUpperCase();
      const isDuplicate = newLabels.some((label, i) => 
        i !== index && label.name.toUpperCase() === nameUpper
      );
      
      if (isDuplicate) {
        newErrors[`name-${index}`] = 'Label name must be unique';
      } else if (!value.trim()) {
        newErrors[`name-${index}`] = 'Label name cannot be empty';
      } else {
        delete newErrors[`name-${index}`];
      }
    }
    
    delete newErrors.general;
    setErrors(newErrors);
    setLabels(newLabels);
    
    if (Object.keys(newErrors).length === 0) {
      updateConfig(newLabels);
    }
  };

  const updateConfig = (labelArray) => {
    if (labelArray === null) {
      // Switching to default labels
      onConfigChange('customLabels', null);
      onConfigChange('useCustomLabels', false);
    } else {
      // Using custom labels
      onConfigChange('customLabels', labelArray);
      onConfigChange('useCustomLabels', true);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      {/* Toggle for Custom Labels */}
      <div>
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="radio"
            checked={!useCustomLabels}
            onChange={() => handleUseCustomToggle(false)}
            className="mt-0.5 border-gray-300 text-primary-600 focus:ring-primary-500"
            disabled={isSubmitting}
          />
          <div>
            <span className="font-medium">Use Default Labels</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Use system-defined labels for this annotation type
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="radio"
            checked={useCustomLabels}
            onChange={() => handleUseCustomToggle(true)}
            className="mt-0.5 border-gray-300 text-primary-600 focus:ring-primary-500"
            disabled={isSubmitting}
          />
          <div>
            <span className="font-medium">Use Custom Labels</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Define your own labels with custom colors
            </p>
          </div>
        </label>
      </div>

      {/* Custom Labels Editor */}
      {useCustomLabels && (
        <div className="mt-4 space-y-4">
          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddLabel}
            disabled={isSubmitting || labels.length >= 20}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Label
          </button>

          {/* Labels List */}
          <div className="space-y-3">
            {labels.map((label, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Label Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label {index + 1} Name
                      </label>
                      <input
                        type="text"
                        value={label.name || ''}
                        onChange={(e) => handleLabelChange(index, 'name', e.target.value)}
                        placeholder="e.g., PERSON"
                        className={`w-full px-3 py-2 border rounded-md text-sm font-medium uppercase ${
                          errors[`name-${index}`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {errors[`name-${index}`] && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[`name-${index}`]}
                        </p>
                      )}
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <ColorPicker
                        color={label.color || '#3B82F6'}
                        onChange={(color) => handleLabelChange(index, 'color', color)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(index)}
                    disabled={isSubmitting || labels.length <= 1}
                    className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove label"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Label Count Info */}
          <p className="text-xs text-gray-500">
            {labels.length}/20 labels {hasErrors && '(has errors)'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LabelEditor;