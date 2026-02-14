/**
 * AnnotationToolbar Component
 * 
 * Toolbar for selecting annotation tools and options.
 */

import React from 'react';
import { 
  MousePointer2, 
  Square, 
  Hexagon, 
  CircleDot, 
  Paintbrush, 
  Eraser, 
  Move, 
  ZoomIn,
  Trash2,
  Minus,
  Plus
} from 'lucide-react';
import { TOOLS, ANNOTATION_TYPE_LABELS, BRUSH_DEFAULTS } from '../constants';

const TOOL_CONFIG = {
  [TOOLS.SELECT]: { icon: MousePointer2, label: 'Select (V)' },
  [TOOLS.BOUNDING_BOX]: { icon: Square, label: 'Bounding Box (B)' },
  [TOOLS.POLYGON]: { icon: Hexagon, label: 'Polygon (P)' },
  [TOOLS.KEYPOINT]: { icon: CircleDot, label: 'Keypoint (K)' },
  [TOOLS.BRUSH]: { icon: Paintbrush, label: 'Brush (Shift+B)' },
  [TOOLS.ERASER]: { icon: Eraser, label: 'Eraser (E)' },
  [TOOLS.PAN]: { icon: Move, label: 'Pan (Space)' },
  [TOOLS.ZOOM]: { icon: ZoomIn, label: 'Zoom (Z)' },
};

const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  canUndo = false,
  canRedo = false,
  canDelete = false,
  selectedLabel = null,
  labels = [],
  onLabelChange,
  brushSize = BRUSH_DEFAULTS.DEFAULT_RADIUS,
  onBrushSizeChange,
}) => {
  const isBrushTool = activeTool === TOOLS.BRUSH || activeTool === TOOLS.ERASER;
  
  const increaseBrushSize = () => {
    const newSize = Math.min(BRUSH_DEFAULTS.MAX_RADIUS, brushSize + 5);
    onBrushSizeChange?.(newSize);
  };
  
  const decreaseBrushSize = () => {
    const newSize = Math.max(BRUSH_DEFAULTS.MIN_RADIUS, brushSize - 5);
    onBrushSizeChange?.(newSize);
  };
  
  return (
    <div className="flex flex-col bg-white border-r border-gray-200 w-14">
      {/* Tools Section */}
      <div className="p-2 space-y-1 border-b border-gray-200">
        {Object.entries(TOOL_CONFIG).map(([tool, config]) => {
          const Icon = config.icon;
          const isActive = activeTool === tool;
          
          return (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={config.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
      
      {/* Actions Section */}
      <div className="p-2 space-y-1 border-b border-gray-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
            canUndo 
              ? 'text-gray-600 hover:bg-gray-100' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6M3 13a9 9 0 1 0 2.5-6.5L3 7" />
          </svg>
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
            canRedo 
              ? 'text-gray-600 hover:bg-gray-100' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6M21 13a9 9 0 1 1-2.5-6.5L21 7" />
          </svg>
        </button>
        
        <button
          onClick={onDelete}
          disabled={!canDelete}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
            canDelete 
              ? 'text-red-600 hover:bg-red-50' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Delete (Delete)"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      {/* Brush Size Section - only show when brush/eraser is active */}
      {isBrushTool && (
        <div className="p-2 space-y-1 border-b border-gray-200">
          <div className="text-xs text-gray-500 text-center mb-1">Size</div>
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={increaseBrushSize}
              disabled={brushSize >= BRUSH_DEFAULTS.MAX_RADIUS}
              className={`w-10 h-8 flex items-center justify-center rounded-lg ${
                brushSize < BRUSH_DEFAULTS.MAX_RADIUS
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Increase brush size"
            >
              <Plus size={16} />
            </button>
            <div className="text-xs font-medium text-gray-700">{brushSize}px</div>
            <button
              onClick={decreaseBrushSize}
              disabled={brushSize <= BRUSH_DEFAULTS.MIN_RADIUS}
              className={`w-10 h-8 flex items-center justify-center rounded-lg ${
                brushSize > BRUSH_DEFAULTS.MIN_RADIUS
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Decrease brush size"
            >
              <Minus size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Labels Section */}
      {labels.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="text-xs text-gray-500 text-center mb-2">Labels</div>
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => onLabelChange?.(label)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                selectedLabel?.id === label.id 
                  ? 'ring-2 ring-blue-500 ring-offset-1' 
                  : ''
              }`}
              style={{ backgroundColor: label.color + '40' }}
              title={label.name}
            >
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: label.color }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnotationToolbar;