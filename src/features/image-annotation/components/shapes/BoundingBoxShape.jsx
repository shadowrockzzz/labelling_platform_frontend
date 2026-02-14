/**
 * BoundingBoxShape Component
 * 
 * Renders and handles interaction for bounding box annotations.
 */

import React, { useRef, useEffect } from 'react';
import { Rect, Transformer, Group } from 'react-konva';
import { BBOX_DEFAULTS } from '../../constants';

const BoundingBoxShape = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  readOnly,
  color = '#FF5733',
}) => {
  const shapeRef = useRef();
  const transformerRef = useRef();
  
  // Set up transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  const { data } = shape;
  
  // Handle drag end
  const handleDragEnd = (e) => {
    if (readOnly) return;
    
    onUpdate({
      ...data,
      x: e.target.x(),
      y: e.target.y(),
    });
  };
  
  // Handle transform end
  const handleTransformEnd = () => {
    if (readOnly || !shapeRef.current) return;
    
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);
    
    onUpdate({
      x: node.x(),
      y: node.y(),
      width: Math.max(BBOX_DEFAULTS.MIN_WIDTH, node.width() * scaleX),
      height: Math.max(BBOX_DEFAULTS.MIN_HEIGHT, node.height() * scaleY),
    });
  };
  
  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={data.x}
        y={data.y}
        width={data.width}
        height={data.height}
        stroke={color}
        strokeWidth={BBOX_DEFAULTS.STROKE_WIDTH}
        fill={`${color}20`}
        draggable={!readOnly}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      
      {isSelected && !readOnly && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < BBOX_DEFAULTS.MIN_WIDTH || 
                newBox.height < BBOX_DEFAULTS.MIN_HEIGHT) {
              return oldBox;
            }
            return newBox;
          }}
          borderStroke={color}
          anchorStroke={color}
          anchorFill="#fff"
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </Group>
  );
};

export default BoundingBoxShape;