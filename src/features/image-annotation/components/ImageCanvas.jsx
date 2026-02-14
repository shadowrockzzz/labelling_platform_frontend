/**
 * ImageCanvas Component
 * 
 * Main canvas component for image annotation using react-konva.
 * Supports bounding boxes, polygons, keypoints, and segmentation.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Circle, Group } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { TOOLS, ANNOTATION_SUB_TYPES, BBOX_DEFAULTS, POLYGON_DEFAULTS, KEYPOINT_DEFAULTS, CANVAS_DEFAULTS, BRUSH_DEFAULTS } from '../constants';

// Shape renderers
import BoundingBoxShape from './shapes/BoundingBoxShape';
import PolygonShape from './shapes/PolygonShape';
import KeypointShape from './shapes/KeypointShape';
import SegmentationShape from './shapes/SegmentationShape';

const ImageCanvas = ({
  imageUrl,
  shapes = [],
  selectedShapeId = null,
  activeTool = TOOLS.SELECT,
  selectedLabel = null,
  onShapeCreate,
  onShapeUpdate,
  onShapeDelete,
  onShapeSelect,
  readOnly = false,
  width = 800,
  height = 600,
  onPolygonUndoRedoState,
  brushSize = BRUSH_DEFAULTS.DEFAULT_RADIUS,
}) => {
  const [image] = useImage(imageUrl, 'anonymous');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [polygonRedoStack, setPolygonRedoStack] = useState([]);
  const [hoveredFirstPoint, setHoveredFirstPoint] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  
  // Brush/Eraser state
  const [currentStroke, setCurrentStroke] = useState(null);
  const [brushMousePos, setBrushMousePos] = useState(null);
  
  const stageRef = useRef(null);
  const lastClickTime = useRef(0);
  
  // Image dimensions
  const imageWidth = image?.width || width;
  const imageHeight = image?.height || height;
  
  // Calculate scale to fit image in container
  useEffect(() => {
    if (image) {
      const scaleX = width / imageWidth;
      const scaleY = height / imageHeight;
      const fitScale = Math.min(scaleX, scaleY);
      setScale(fitScale);
    }
  }, [image, width, height, imageWidth, imageHeight]);
  
  // Get pointer position relative to stage
  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    
    // Transform to image coordinates
    return {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    };
  }, [position, scale]);
  
  // Finish polygon drawing
  const finishPolygon = useCallback(() => {
    if (polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS) {
      const newPolygon = {
        id: uuidv4(),
        type: ANNOTATION_SUB_TYPES.POLYGON,
        label: selectedLabel,
        data: {
          points: polygonPoints.flatMap(p => [p.x, p.y]),
        },
      };
      onShapeCreate?.(newPolygon);
      setPolygonPoints([]);
      setPolygonRedoStack([]);
      setHoveredFirstPoint(false);
    }
  }, [polygonPoints, selectedLabel, onShapeCreate]);
  
  // Handle mouse down for drawing
  const handleMouseDown = useCallback((e) => {
    if (readOnly || activeTool === TOOLS.SELECT) return;
    
    const pos = getPointerPosition();
    if (!pos) return;
    
    if (activeTool === TOOLS.BOUNDING_BOX) {
      setIsDrawing(true);
      setCurrentShape({
        id: uuidv4(),
        type: ANNOTATION_SUB_TYPES.BOUNDING_BOX,
        label: selectedLabel,
        data: {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        },
      });
    } else if (activeTool === TOOLS.KEYPOINT) {
      // Create keypoint immediately on click
      const newKeypoint = {
        id: uuidv4(),
        type: ANNOTATION_SUB_TYPES.KEYPOINT,
        label: selectedLabel,
        data: {
          x: pos.x,
          y: pos.y,
        },
      };
      onShapeCreate?.(newKeypoint);
    } else if (activeTool === TOOLS.POLYGON) {
      // Check for double-click using timing
      const now = Date.now();
      const isDoubleClick = (now - lastClickTime.current) < 300;
      lastClickTime.current = now;
      
      // Check if clicking on first point to close polygon
      if (polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS) {
        const firstPoint = polygonPoints[0];
        const distance = Math.sqrt(
          Math.pow(pos.x - firstPoint.x, 2) + Math.pow(pos.y - firstPoint.y, 2)
        );
        if (distance < 15) {
          // Clicking on first point - finish polygon
          finishPolygon();
          return;
        }
      }
      
      // If double-click and have enough points, finish polygon
      if (isDoubleClick && polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS) {
        finishPolygon();
        return;
      }
      
      // Single click - add point to polygon (skip if it's a double-click to avoid extra point)
      if (!isDoubleClick) {
        setPolygonPoints(prev => [...prev, pos]);
      }
    } else if (activeTool === TOOLS.BRUSH || activeTool === TOOLS.ERASER) {
      // Start brush/eraser stroke
      setIsDrawing(true);
      setCurrentStroke({
        points: [pos.x, pos.y],
        isEraser: activeTool === TOOLS.ERASER,
        lineWidth: brushSize,
      });
    }
  }, [activeTool, readOnly, selectedLabel, getPointerPosition, onShapeCreate, polygonPoints, finishPolygon, brushSize]);
  
  // Handle mouse move for drawing and polygon hover detection
  const handleMouseMove = useCallback((e) => {
    const pos = getPointerPosition();
    if (!pos) return;
    
    // Track mouse position for brush cursor
    if (activeTool === TOOLS.BRUSH || activeTool === TOOLS.ERASER) {
      setBrushMousePos(pos);
    }
    
    // Track mouse position for polygon drawing
    if (activeTool === TOOLS.POLYGON && polygonPoints.length > 0) {
      setMousePos(pos);
      // Check if hovering near first point (for closing polygon)
      if (polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS) {
        const firstPoint = polygonPoints[0];
        const distance = Math.sqrt(
          Math.pow(pos.x - firstPoint.x, 2) + Math.pow(pos.y - firstPoint.y, 2)
        );
        setHoveredFirstPoint(distance < 15);
      } else {
        setHoveredFirstPoint(false);
      }
    }
    
    // Handle brush/eraser drawing
    if (isDrawing && currentStroke) {
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, pos.x, pos.y],
      }));
      return;
    }
    
    if (!isDrawing || readOnly) return;
    
    if (currentShape && currentShape.type === ANNOTATION_SUB_TYPES.BOUNDING_BOX) {
      setCurrentShape(prev => ({
        ...prev,
        data: {
          x: Math.min(prev.data.x, pos.x),
          y: Math.min(prev.data.y, pos.y),
          width: Math.abs(pos.x - prev.data.x),
          height: Math.abs(pos.y - prev.data.y),
        },
      }));
    }
  }, [isDrawing, readOnly, currentShape, getPointerPosition, activeTool, polygonPoints, currentStroke]);
  
  // Handle mouse up for finishing drawing
  const handleMouseUp = useCallback(() => {
    // Handle brush/eraser stroke completion
    if (isDrawing && currentStroke) {
      // Only create if stroke has meaningful length
      if (currentStroke.points.length >= 4) {
        const newSegmentation = {
          id: uuidv4(),
          type: ANNOTATION_SUB_TYPES.SEGMENTATION,
          label: selectedLabel,
          data: {
            strokes: [currentStroke],
          },
        };
        onShapeCreate?.(newSegmentation);
      }
      setIsDrawing(false);
      setCurrentStroke(null);
      return;
    }
    
    if (!isDrawing || !currentShape) return;
    
    setIsDrawing(false);
    
    // Only create shape if it has meaningful size
    if (currentShape.type === ANNOTATION_SUB_TYPES.BOUNDING_BOX) {
      if (currentShape.data.width >= BBOX_DEFAULTS.MIN_WIDTH && 
          currentShape.data.height >= BBOX_DEFAULTS.MIN_HEIGHT) {
        onShapeCreate?.(currentShape);
      }
    }
    
    setCurrentShape(null);
  }, [isDrawing, currentShape, onShapeCreate, currentStroke, selectedLabel]);
  
  // Handle polygon double-click to finish
  const handleDblClick = useCallback(() => {
    if (activeTool === TOOLS.POLYGON && polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS) {
      const newPolygon = {
        id: uuidv4(),
        type: ANNOTATION_SUB_TYPES.POLYGON,
        label: selectedLabel,
        data: {
          points: polygonPoints.flatMap(p => [p.x, p.y]),
        },
      };
      onShapeCreate?.(newPolygon);
      setPolygonPoints([]);
      setPolygonRedoStack([]); // Clear redo stack on finish
    }
  }, [activeTool, polygonPoints, selectedLabel, onShapeCreate]);
  
  // Polygon undo - remove last point
  const handlePolygonUndo = useCallback(() => {
    if (polygonPoints.length > 0) {
      const lastPoint = polygonPoints[polygonPoints.length - 1];
      setPolygonRedoStack(prev => [...prev, lastPoint]);
      setPolygonPoints(prev => prev.slice(0, -1));
    }
  }, [polygonPoints]);
  
  // Polygon redo - restore last undone point
  const handlePolygonRedo = useCallback(() => {
    if (polygonRedoStack.length > 0) {
      const pointToRestore = polygonRedoStack[polygonRedoStack.length - 1];
      setPolygonPoints(prev => [...prev, pointToRestore]);
      setPolygonRedoStack(prev => prev.slice(0, -1));
    }
  }, [polygonRedoStack]);
  
  // Cancel polygon drawing
  const handlePolygonCancel = useCallback(() => {
    setPolygonPoints([]);
    setPolygonRedoStack([]);
  }, []);
  
  // Notify parent about undo/redo state
  useEffect(() => {
    if (onPolygonUndoRedoState) {
      onPolygonUndoRedoState({
        canUndo: polygonPoints.length > 0,
        canRedo: polygonRedoStack.length > 0,
        onUndo: handlePolygonUndo,
        onRedo: handlePolygonRedo,
        onCancel: handlePolygonCancel,
      });
    }
  }, [polygonPoints, polygonRedoStack, handlePolygonUndo, handlePolygonRedo, handlePolygonCancel, onPolygonUndoRedoState]);
  
  // Keyboard shortcuts for polygon undo/redo/cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle when polygon tool is active and points exist
      if (activeTool !== TOOLS.POLYGON) return;
      
      // Escape - cancel polygon
      if (e.key === 'Escape') {
        e.preventDefault();
        handlePolygonCancel();
        return;
      }
      
      // Backspace or Ctrl+Z - undo last point
      if (e.key === 'Backspace' || (e.ctrlKey && e.key === 'z' && !e.shiftKey)) {
        e.preventDefault();
        handlePolygonUndo();
        return;
      }
      
      // Ctrl+Shift+Z or Ctrl+Y - redo point
      if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handlePolygonRedo();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, handlePolygonUndo, handlePolygonRedo, handlePolygonCancel]);
  
  // Handle wheel for zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      CANVAS_DEFAULTS.MIN_SCALE,
      Math.min(CANVAS_DEFAULTS.MAX_SCALE, oldScale + direction * CANVAS_DEFAULTS.SCALE_STEP)
    );
    
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
    setScale(newScale);
  }, [scale, position]);
  
  // Handle stage click for deselection
  const handleStageClick = useCallback((e) => {
    if (e.target === stageRef.current) {
      onShapeSelect?.(null);
    }
  }, [onShapeSelect]);
  
  // Render shape based on type
  const renderShape = (shape) => {
    const isSelected = shape.id === selectedShapeId;
    const commonProps = {
      shape,
      isSelected,
      onSelect: () => onShapeSelect?.(shape.id),
      onUpdate: (newData) => onShapeUpdate?.(shape.id, newData),
      onDelete: () => onShapeDelete?.(shape.id),
      readOnly,
      color: shape.label?.color || '#FF5733',
    };
    
    switch (shape.type) {
      case ANNOTATION_SUB_TYPES.BOUNDING_BOX:
        return <BoundingBoxShape key={shape.id} {...commonProps} />;
      case ANNOTATION_SUB_TYPES.POLYGON:
        return <PolygonShape key={shape.id} {...commonProps} />;
      case ANNOTATION_SUB_TYPES.KEYPOINT:
        return <KeypointShape key={shape.id} {...commonProps} />;
      case ANNOTATION_SUB_TYPES.SEGMENTATION:
        return <SegmentationShape key={shape.id} {...commonProps} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="image-canvas-container" style={{ width, height, overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onWheel={handleWheel}
        onClick={handleStageClick}
        style={{ cursor: hoveredFirstPoint ? 'pointer' : (activeTool === TOOLS.SELECT ? 'default' : 'crosshair') }}
      >
        {/* Image Layer */}
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={imageWidth}
              height={imageHeight}
            />
          )}
        </Layer>
        
        {/* Shapes Layer */}
        <Layer>
          {shapes.map(renderShape)}
          
          {/* Current drawing shape */}
          {currentShape && currentShape.type === ANNOTATION_SUB_TYPES.BOUNDING_BOX && (
            <Rect
              x={currentShape.data.x}
              y={currentShape.data.y}
              width={currentShape.data.width}
              height={currentShape.data.height}
              stroke={currentShape.label?.color || '#FF5733'}
              strokeWidth={BBOX_DEFAULTS.STROKE_WIDTH / scale}
              dash={[4 / scale, 4 / scale]}
              fill="transparent"
            />
          )}
          
          {/* Polygon points being drawn */}
          {polygonPoints.length > 0 && (
            <Group>
              {/* Line connecting points */}
              <Line
                points={polygonPoints.flatMap(p => [p.x, p.y])}
                stroke={selectedLabel?.color || '#FF5733'}
                strokeWidth={POLYGON_DEFAULTS.STROKE_WIDTH / scale}
                fill="transparent"
              />
              {/* Preview line to mouse position */}
              {mousePos && (
                <Line
                  points={[
                    polygonPoints[polygonPoints.length - 1].x,
                    polygonPoints[polygonPoints.length - 1].y,
                    mousePos.x,
                    mousePos.y,
                  ]}
                  stroke={selectedLabel?.color || '#FF5733'}
                  strokeWidth={POLYGON_DEFAULTS.STROKE_WIDTH / scale}
                  dash={[4 / scale, 4 / scale]}
                  fill="transparent"
                  opacity={0.5}
                />
              )}
              {/* Render points */}
              {polygonPoints.map((point, idx) => {
                const isFirstPoint = idx === 0;
                const isFirstPointHoverable = isFirstPoint && polygonPoints.length >= POLYGON_DEFAULTS.MIN_POINTS;
                
                return (
                  <Circle
                    key={idx}
                    x={point.x}
                    y={point.y}
                    radius={isFirstPointHoverable ? (hoveredFirstPoint ? 12 / scale : 8 / scale) : 6 / scale}
                    fill={selectedLabel?.color || '#FF5733'}
                    stroke={isFirstPointHoverable ? '#FFFFFF' : 'transparent'}
                    strokeWidth={isFirstPointHoverable ? 2 / scale : 0}
                    opacity={isFirstPointHoverable ? 1 : 0.8}
                  />
                );
              })}
            </Group>
          )}
          
          {/* Current brush stroke being drawn */}
          {currentStroke && currentStroke.points.length >= 2 && (
            <Line
              points={currentStroke.points}
              stroke={currentStroke.isEraser ? '#FFFFFF' : (selectedLabel?.color || '#FF5733')}
              strokeWidth={currentStroke.lineWidth / scale}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={currentStroke.isEraser ? 0.8 : 0.6}
            />
          )}
          
          {/* Brush cursor preview */}
          {(activeTool === TOOLS.BRUSH || activeTool === TOOLS.ERASER) && brushMousePos && !isDrawing && (
            <Circle
              x={brushMousePos.x}
              y={brushMousePos.y}
              radius={brushSize / scale}
              stroke={activeTool === TOOLS.ERASER ? '#FFFFFF' : (selectedLabel?.color || '#FF5733')}
              strokeWidth={1 / scale}
              fill={activeTool === TOOLS.ERASER ? 'rgba(255,255,255,0.2)' : `${selectedLabel?.color || '#FF5733'}33`}
              dash={activeTool === TOOLS.ERASER ? [4 / scale, 4 / scale] : undefined}
            />
          )}
        </Layer>
      </Stage>
      
      {/* Tool instructions overlay */}
      {activeTool === TOOLS.POLYGON && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded text-sm space-y-1 text-center">
          <div>Click to add points. Double-click to finish.</div>
          <div className="text-xs text-gray-300">
            <span className="mr-3">⌫ Undo</span>
            <span className="mr-3">Esc Cancel</span>
            {polygonRedoStack.length > 0 && <span>Ctrl+Y Redo</span>}
          </div>
          {polygonPoints.length > 0 && (
            <div className="text-xs text-blue-300">
              {polygonPoints.length} point{polygonPoints.length !== 1 ? 's' : ''} added
            </div>
          )}
        </div>
      )}
      
      {/* Brush/Eraser instructions overlay */}
      {(activeTool === TOOLS.BRUSH || activeTool === TOOLS.ERASER) && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded text-sm space-y-1 text-center">
          <div>{activeTool === TOOLS.BRUSH ? '🖌️ Brush' : '🧹 Eraser'} Mode</div>
          <div className="text-xs text-gray-300">
            Click and drag to {activeTool === TOOLS.BRUSH ? 'draw' : 'erase'}
          </div>
          <div className="text-xs text-blue-300">
            Brush size: {brushSize}px
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;