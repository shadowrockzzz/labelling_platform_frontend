/**
 * PolygonShape Component
 * 
 * Renders and handles interaction for polygon annotations.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Line, Group, Circle } from 'react-konva';
import { POLYGON_DEFAULTS } from '../../constants';

const PolygonShape = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readOnly,
  color = '#FF5733',
}) => {
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(null);
  const { data } = shape;
  const points = data.points || [];
  
  // Convert flat array to point pairs for anchor rendering
  const pointPairs = [];
  for (let i = 0; i < points.length; i += 2) {
    pointPairs.push({ x: points[i], y: points[i + 1] });
  }
  
  // Handle polygon drag
  const handleDragEnd = (e) => {
    if (readOnly) return;
    
    // Calculate the offset from original position
    const offsetX = e.target.x();
    const offsetY = e.target.y();
    
    // Reset position as we'll apply offset to points
    e.target.position({ x: 0, y: 0 });
    
    // Update all points with offset
    const newPoints = points.map((coord, idx) => {
      return idx % 2 === 0 ? coord + offsetX : coord + offsetY;
    });
    
    onUpdate({ points: newPoints });
  };
  
  // Handle anchor drag
  const handleAnchorDrag = (index, e) => {
    if (readOnly) return;
    
    const newPoints = [...points];
    newPoints[index * 2] = e.target.x();
    newPoints[index * 2 + 1] = e.target.y();
    
    onUpdate({ points: newPoints });
  };
  
  return (
    <Group>
      {/* Main polygon */}
      <Line
        points={points}
        stroke={color}
        strokeWidth={POLYGON_DEFAULTS.STROKE_WIDTH}
        fill={`${color}${Math.round(POLYGON_DEFAULTS.FILL_OPACITY * 255).toString(16).padStart(2, '0')}`}
        closed
        draggable={!readOnly && !isDraggingAnchor}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
      />
      
      {/* Anchor points (shown when selected) */}
      {isSelected && !readOnly && pointPairs.map((point, idx) => (
        <Circle
          key={idx}
          x={point.x}
          y={point.y}
          radius={6}
          stroke={color}
          strokeWidth={2}
          fill="#fff"
          draggable
          onMouseEnter={() => setIsDraggingAnchor(idx)}
          onMouseLeave={() => setIsDraggingAnchor(null)}
          onDragMove={(e) => handleAnchorDrag(idx, e)}
          style={{ cursor: 'move' }}
        />
      ))}
    </Group>
  );
};

export default PolygonShape;