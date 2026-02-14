/**
 * KeypointShape Component
 * 
 * Renders and handles interaction for keypoint/landmark annotations.
 */

import React from 'react';
import { Circle, Group } from 'react-konva';
import { KEYPOINT_DEFAULTS } from '../../constants';

const KeypointShape = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readOnly,
  color = '#FF5733',
}) => {
  const { data } = shape;
  
  // Handle drag end
  const handleDragEnd = (e) => {
    if (readOnly) return;
    
    onUpdate({
      x: e.target.x(),
      y: e.target.y(),
    });
  };
  
  return (
    <Group>
      {/* Outer hit area (larger, transparent) */}
      <Circle
        x={data.x}
        y={data.y}
        radius={KEYPOINT_DEFAULTS.HIT_AREA_RADIUS}
        fill="transparent"
        onClick={onSelect}
        onTap={onSelect}
      />
      
      {/* Visible keypoint */}
      <Circle
        x={data.x}
        y={data.y}
        radius={KEYPOINT_DEFAULTS.RADIUS}
        stroke={color}
        strokeWidth={KEYPOINT_DEFAULTS.STROKE_WIDTH}
        fill={isSelected ? color : '#fff'}
        draggable={!readOnly}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        shadowColor={color}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.5}
      />
      
      {/* Center dot */}
      <Circle
        x={data.x}
        y={data.y}
        radius={2}
        fill={isSelected ? '#fff' : color}
        listening={false}
      />
    </Group>
  );
};

export default KeypointShape;