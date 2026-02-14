/**
 * Image Annotation Feature
 * 
 * Export all components, services, and utilities for image annotation.
 */

// Components
export { default as ImageCanvas } from './components/ImageCanvas';
export { default as AnnotationToolbar } from './components/AnnotationToolbar';
export { default as ImageAnnotationWorkspace } from './components/ImageAnnotationWorkspace';
export { default as ImageResourceList } from './components/ImageResourceList';
export { default as ShapeList } from './components/ShapeList';

// Shape components
export { default as BoundingBoxShape } from './components/shapes/BoundingBoxShape';
export { default as PolygonShape } from './components/shapes/PolygonShape';
export { default as KeypointShape } from './components/shapes/KeypointShape';

// Constants
export * from './constants';