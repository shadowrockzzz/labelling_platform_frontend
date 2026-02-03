import React from 'react';
import { ANNOTATION_SUB_TYPES, getSubTypeConfig } from '../constants';

/**
 * LabelPalette Component
 * Displays available labels for annotation. Supports custom labels from project config
 * or falls back to system defaults.
 * 
 * @param {string} annotationType - The annotation sub-type (e.g., 'ner', 'pos')
 * @param {object} projectConfig - Project configuration containing custom labels
 * @param {function} onLabelSelect - Callback when a label is selected
 * @param {string} selectedLabel - Currently selected label
 */
const LabelPalette = ({ annotationType, projectConfig, onLabelSelect, selectedLabel }) => {
  // Check if project has custom labels configured
  const hasCustomLabels = projectConfig?.useCustomLabels && projectConfig?.customLabels?.length > 0;
  
  let labels = [];
  let labelColors = {};
  
  if (hasCustomLabels) {
    // Use custom labels from project config
    labels = projectConfig.customLabels.map(label => label.name);
    labelColors = {};
    projectConfig.customLabels.forEach(label => {
      labelColors[label.name] = label.color;
    });
  } else {
    // Fall back to system defaults
    const config = getSubTypeConfig(annotationType) || ANNOTATION_SUB_TYPES.NER;
    labels = config.labels || [];
    labelColors = config.labelColors || {};
  }

  const handleLabelClick = (label) => {
    onLabelSelect(label);
  };

  const config = getSubTypeConfig(annotationType) || ANNOTATION_SUB_TYPES.NER;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Label Palette — {config.shortLabel}
        {hasCustomLabels && (
          <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Custom
          </span>
        )}
      </h3>
      
      {selectedLabel && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-900">
            <strong>Selected:</strong> {selectedLabel}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {labels.map(label => {
          const colorValue = labelColors[label] || '#6B7280'; // gray-500
          const isSelected = selectedLabel === label;
          
          return (
            <button
              key={label}
              type="button"
              onClick={() => handleLabelClick(label)}
              style={{
                backgroundColor: isSelected ? colorValue : `${colorValue}20`,
                color: isSelected ? getContrastColor(colorValue) : colorValue,
                borderColor: colorValue
              }}
              className={`
                px-4 py-2 rounded-md font-medium text-sm transition-all
                border-2
                ${isSelected 
                  ? 'text-white ring-2 ring-offset-2'
                  : 'hover:opacity-80'
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 Click a label to apply it to selected text. Labels are color-coded for easy identification.
          {hasCustomLabels && ' Custom labels configured for this project.'}
        </p>
      </div>
    </div>
  );
};

// Helper function to determine text color based on background
function getContrastColor(hexcolor) {
  // Remove the hash if it's there
  hexcolor = hexcolor.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  
  // Calculate the brightness
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return black or white depending on the brightness
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

export default LabelPalette;
