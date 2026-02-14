/**
 * Image Annotation Constants
 * 
 * Constants for image annotation functionality including
 * annotation types, colors, tools, and default values.
 */

// Annotation sub-types
export const ANNOTATION_SUB_TYPES = {
  BOUNDING_BOX: 'bounding_box',
  POLYGON: 'polygon',
  SEGMENTATION: 'segmentation',
  KEYPOINT: 'keypoint',
  CLASSIFICATION: 'classification',
};

// Display labels for annotation types
export const ANNOTATION_TYPE_LABELS = {
  [ANNOTATION_SUB_TYPES.BOUNDING_BOX]: 'Bounding Box',
  [ANNOTATION_SUB_TYPES.POLYGON]: 'Polygon',
  [ANNOTATION_SUB_TYPES.SEGMENTATION]: 'Segmentation',
  [ANNOTATION_SUB_TYPES.KEYPOINT]: 'Keypoint',
  [ANNOTATION_SUB_TYPES.CLASSIFICATION]: 'Classification',
};

// Annotation status values
export const ANNOTATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Status display labels
export const STATUS_LABELS = {
  [ANNOTATION_STATUS.DRAFT]: 'Draft',
  [ANNOTATION_STATUS.SUBMITTED]: 'Submitted',
  [ANNOTATION_STATUS.APPROVED]: 'Approved',
  [ANNOTATION_STATUS.REJECTED]: 'Rejected',
};

// Status colors for UI
export const STATUS_COLORS = {
  [ANNOTATION_STATUS.DRAFT]: 'gray',
  [ANNOTATION_STATUS.SUBMITTED]: 'blue',
  [ANNOTATION_STATUS.APPROVED]: 'green',
  [ANNOTATION_STATUS.REJECTED]: 'red',
};

// Default colors for annotation shapes
export const DEFAULT_SHAPE_COLORS = [
  '#FF5733', // Red-orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Pink
  '#F5FF33', // Yellow
  '#33FFF5', // Cyan
  '#FF9933', // Orange
  '#9933FF', // Purple
  '#33FF99', // Mint
  '#FF3333', // Red
];

// Tool types for annotation canvas
export const TOOLS = {
  SELECT: 'select',
  BOUNDING_BOX: 'bounding_box',
  POLYGON: 'polygon',
  POLYLINE: 'polyline',
  KEYPOINT: 'keypoint',
  BRUSH: 'brush',
  ERASER: 'eraser',
  PAN: 'pan',
  ZOOM: 'zoom',
};

// Tool icons (Material Icons or similar)
export const TOOL_ICONS = {
  [TOOLS.SELECT]: 'cursor-pointer',
  [TOOLS.BOUNDING_BOX]: 'rectangle-outline',
  [TOOLS.POLYGON]: 'vector-polygon',
  [TOOLS.POLYLINE]: 'vector-polyline',
  [TOOLS.KEYPOINT]: 'map-marker',
  [TOOLS.BRUSH]: 'brush',
  [TOOLS.ERASER]: 'eraser',
  [TOOLS.PAN]: 'pan-tool',
  [TOOLS.ZOOM]: 'magnify',
};

// Canvas defaults
export const CANVAS_DEFAULTS = {
  MIN_SCALE: 0.1,
  MAX_SCALE: 10,
  SCALE_STEP: 0.1,
  GRID_SIZE: 20,
  SNAP_TO_GRID: false,
  SHOW_GRID: false,
};

// Bounding box defaults
export const BBOX_DEFAULTS = {
  MIN_WIDTH: 10,
  MIN_HEIGHT: 10,
  STROKE_WIDTH: 2,
  CORNER_RADIUS: 0,
};

// Polygon defaults
export const POLYGON_DEFAULTS = {
  MIN_POINTS: 3,
  STROKE_WIDTH: 2,
  FILL_OPACITY: 0.3,
  CLOSE_THRESHOLD: 10, // Distance to auto-close polygon
};

// Keypoint defaults
export const KEYPOINT_DEFAULTS = {
  RADIUS: 6,
  STROKE_WIDTH: 2,
  HIT_AREA_RADIUS: 12,
};

// Brush defaults for segmentation
export const BRUSH_DEFAULTS = {
  MIN_RADIUS: 1,
  MAX_RADIUS: 100,
  DEFAULT_RADIUS: 20,
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  DELETE: 'delete',
  DESELECT: 'escape',
  SELECT_ALL: 'ctrl+a',
  ZOOM_IN: 'ctrl+=',
  ZOOM_OUT: 'ctrl+-',
  FIT_TO_SCREEN: 'ctrl+0',
  PAN_UP: 'arrowup',
  PAN_DOWN: 'arrowdown',
  PAN_LEFT: 'arrowleft',
  PAN_RIGHT: 'arrowright',
};

// File upload constraints
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'],
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export default {
  ANNOTATION_SUB_TYPES,
  ANNOTATION_TYPE_LABELS,
  ANNOTATION_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  DEFAULT_SHAPE_COLORS,
  TOOLS,
  TOOL_ICONS,
  CANVAS_DEFAULTS,
  BBOX_DEFAULTS,
  POLYGON_DEFAULTS,
  KEYPOINT_DEFAULTS,
  BRUSH_DEFAULTS,
  KEYBOARD_SHORTCUTS,
  UPLOAD_CONSTRAINTS,
  PAGINATION_DEFAULTS,
};