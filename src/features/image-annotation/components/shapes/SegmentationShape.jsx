/**
 * SegmentationShape Component
 * 
 * Renders and handles interaction for segmentation/brush annotations.
 * Stores freehand brush strokes as arrays of points.
 */

import React from 'react';
import { Line, Group } from 'react-konva';
import { BRUSH_DEFAULTS } from '../../constants';

const SegmentationShape = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readOnly,
  color = '#FF5733',
}) => {
  const { data } = shape;
  
  // Each stroke is a separate line with its points and properties
  const strokes = data.strokes || [];
  
  return (
    <Group onClick={onSelect} onTap={onSelect}>
      {strokes.map((stroke, index) => (
        <Line
          key={index}
          points={stroke.points}
          stroke={stroke.isEraser ? '#FFFFFF' : color}
          strokeWidth={stroke.lineWidth || BRUSH_DEFAULTS.DEFAULT_RADIUS}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={stroke.isEraser ? 'destination-out' : 'source-over'}
          opacity={stroke.isEraser ? 1 : 0.6}
          shadowColor={isSelected && !stroke.isEraser ? color : undefined}
          shadowBlur={isSelected && !stroke.isEraser ? 5 : 0}
          shadowOpacity={0.5}
        />
      ))}
      
      {/* Selection indicator */}
      {isSelected && (
        <Line
          points={strokes.flatMap(s => s.points).slice(0, 4)}
          stroke={color}
          strokeWidth={1}
          dash={[4, 4]}
          opacity={0}
        />
      )}
    </Group>
  );
};

export default SegmentationShape;