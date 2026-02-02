import React from 'react';
import { ANNOTATION_SUB_TYPES } from '../constants';

const LabelPalette = ({ annotationType, onLabelSelect, selectedLabel }) => {
  const config = Object.values(ANNOTATION_SUB_TYPES).find(type => type.value === annotationType) || ANNOTATION_SUB_TYPES.NER;
  const labels = config.labels || [];
  const labelColors = config.labelColors || {};

  const handleLabelClick = (label) => {
    onLabelSelect(label);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Label Palette — {config.shortLabel}
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
          const colorClass = labelColors[label] || 'bg-gray-500';
          const isSelected = selectedLabel === label;
          
          return (
            <button
              key={label}
              type="button"
              onClick={() => handleLabelClick(label)}
              className={`
                px-4 py-2 rounded-md font-medium text-sm transition-all
                ${isSelected 
                  ? `${colorClass} text-white ring-2 ring-offset-2 ring-${colorClass.split('-')[1]}-500`
                  : `${colorClass.replace('bg-', 'bg-').replace('500', '200')} text-gray-700 hover:opacity-80`
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
        </p>
      </div>
    </div>
  );
};

export default LabelPalette;