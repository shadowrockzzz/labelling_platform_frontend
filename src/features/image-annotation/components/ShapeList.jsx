/**
 * ShapeList Component
 * 
 * Displays list of shapes in the current annotation.
 */

import React from 'react';
import { Square, Hexagon, CircleDot, Trash2 } from 'lucide-react';
import { ANNOTATION_SUB_TYPES, ANNOTATION_TYPE_LABELS } from '../constants';

const SHAPE_ICONS = {
  [ANNOTATION_SUB_TYPES.BOUNDING_BOX]: Square,
  [ANNOTATION_SUB_TYPES.POLYGON]: Hexagon,
  [ANNOTATION_SUB_TYPES.KEYPOINT]: CircleDot,
};

const ShapeList = ({
  shapes,
  selectedShapeId,
  onSelect,
  onDelete,
  readOnly,
}) => {
  if (!shapes || shapes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No shapes yet. Use the tools to annotate.
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Shapes ({shapes.length})</h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        {shapes.map((shape, index) => {
          const isSelected = selectedShapeId === shape.id;
          const Icon = SHAPE_ICONS[shape.type] || Square;
          const color = shape.label?.color || '#FF5733';
          
          return (
            <div
              key={shape.id}
              onClick={() => onSelect(shape.id)}
              className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Shape Icon */}
              <div
                className="w-6 h-6 rounded flex items-center justify-center mr-3"
                style={{ backgroundColor: color + '20' }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              
              {/* Shape Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {shape.label?.name || `Shape ${index + 1}`}
                </p>
                <p className="text-xs text-gray-500">
                  {ANNOTATION_TYPE_LABELS[shape.type] || shape.type}
                </p>
              </div>
              
              {/* Delete Button */}
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(shape.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete shape"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapeList;