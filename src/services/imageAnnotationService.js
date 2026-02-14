/**
 * Image Annotation Service
 * 
 * API service for managing image annotations.
 * Supports bounding boxes, polygons, segmentation, keypoints, and classification.
 */

import api from './api';

const BASE_PATH = '/annotations/image';

// ==================== Annotation CRUD ====================

/**
 * Create a new annotation
 * @param {number} projectId - Project ID
 * @param {Object} data - Annotation data
 * @param {number} data.resource_id - Resource ID
 * @param {string} data.annotation_sub_type - Type: bounding_box, polygon, segmentation, keypoint, classification
 * @param {Object} data.annotation_data - Annotation data object
 * @returns {Promise<Object>} Created annotation
 */
export const createAnnotation = async (projectId, data) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/annotations`,
    data
  );
  return response.data;
};

/**
 * Get annotations with optional filters
 * @param {number} projectId - Project ID
 * @param {Object} params - Query parameters
 * @param {number} params.resource_id - Filter by resource
 * @param {number} params.annotator_id - Filter by annotator
 * @param {string} params.status - Filter by status: draft, submitted, approved, rejected
 * @param {string} params.sub_type - Filter by sub-type
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} List of annotations
 */
export const getAnnotations = async (projectId, params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/annotations?${queryParams}`
  );
  return response.data;
};

/**
 * Get a single annotation
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @returns {Promise<Object>} Annotation with resource info
 */
export const getAnnotation = async (projectId, annotationId) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}`
  );
  return response.data;
};

/**
 * Get annotation for a resource by current user
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} User's annotation for the resource
 */
export const getResourceAnnotation = async (projectId, resourceId) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}/annotation`
  );
  return response.data;
};

/**
 * Update an annotation
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {Object} data - Update data
 * @param {Object} data.annotation_data - Updated annotation data
 * @param {string} data.annotation_sub_type - Updated sub-type
 * @returns {Promise<Object>} Updated annotation
 */
export const updateAnnotation = async (projectId, annotationId, data) => {
  const response = await api.put(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}`,
    data
  );
  return response.data;
};

/**
 * Delete an annotation
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @returns {Promise<Object>} Success response
 */
export const deleteAnnotation = async (projectId, annotationId) => {
  const response = await api.delete(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}`
  );
  return response.data;
};

/**
 * Submit annotation for review
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @returns {Promise<Object>} Updated annotation
 */
export const submitAnnotation = async (projectId, annotationId) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/submit`
  );
  return response.data;
};

/**
 * Review an annotation (approve or reject)
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} comment - Optional review comment
 * @returns {Promise<Object>} Updated annotation
 */
export const reviewAnnotation = async (projectId, annotationId, action, comment = null) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/review`,
    { action, comment }
  );
  return response.data;
};

// ==================== Shape Operations ====================

/**
 * Add a shape to annotation
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource ID
 * @param {Object} shapeData - Shape data (varies by type)
 * @param {string} annotationSubType - Type: bounding_box, polygon, segmentation, keypoint, classification
 * @returns {Promise<Object>} Updated annotation
 */
export const addShape = async (projectId, resourceId, shapeData, annotationSubType) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}/shapes?annotation_sub_type=${annotationSubType}`,
    { shape_data: shapeData }
  );
  return response.data;
};

/**
 * Update a specific shape
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {string} shapeId - Shape ID
 * @param {Object} shapeData - Updated shape data
 * @returns {Promise<Object>} Updated annotation
 */
export const updateShape = async (projectId, annotationId, shapeId, shapeData) => {
  const response = await api.put(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/shapes/${shapeId}`,
    { shape_data: shapeData }
  );
  return response.data;
};

/**
 * Delete a specific shape
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {string} shapeId - Shape ID
 * @returns {Promise<Object>} Updated annotation
 */
export const deleteShape = async (projectId, annotationId, shapeId) => {
  const response = await api.delete(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/shapes/${shapeId}`
  );
  return response.data;
};

// ==================== Review Corrections ====================

/**
 * Create a review correction
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {Object} correctedData - Corrected annotation data
 * @param {string} comment - Correction comment
 * @returns {Promise<Object>} Created correction
 */
export const createCorrection = async (projectId, annotationId, correctedData, comment = null) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/corrections`,
    { corrected_data: correctedData, comment }
  );
  return response.data;
};

/**
 * Get corrections for an annotation
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation ID
 * @param {string} status - Filter by status: pending, accepted, rejected
 * @returns {Promise<Object>} List of corrections
 */
export const getCorrections = async (projectId, annotationId, status = null) => {
  const queryParams = status ? `?status=${status}` : '';
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/corrections${queryParams}`
  );
  return response.data;
};

/**
 * Update correction status
 * @param {number} projectId - Project ID
 * @param {number} correctionId - Correction ID
 * @param {string} status - New status: accepted, rejected
 * @param {string} annotatorResponse - Annotator's response
 * @returns {Promise<Object>} Updated correction
 */
export const updateCorrection = async (projectId, correctionId, status, annotatorResponse = null) => {
  const response = await api.put(
    `${BASE_PATH}/projects/${projectId}/corrections/${correctionId}`,
    { status, annotator_response: annotatorResponse }
  );
  return response.data;
};

/**
 * Accept and apply a correction
 * @param {number} projectId - Project ID
 * @param {number} correctionId - Correction ID
 * @param {string} annotatorResponse - Annotator's response
 * @returns {Promise<Object>} Updated annotation
 */
export const acceptCorrection = async (projectId, correctionId, annotatorResponse = null) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/corrections/${correctionId}/accept`,
    null,
    { params: { annotator_response: annotatorResponse } }
  );
  return response.data;
};

// ==================== Queue Operations ====================

/**
 * Get queue tasks
 * @param {number} projectId - Project ID
 * @param {string} taskType - Task type filter
 * @returns {Promise<Object>} List of queue tasks
 */
export const getQueueTasks = async (projectId, taskType = null) => {
  const queryParams = taskType ? `?task_type=${taskType}` : '';
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/queue${queryParams}`
  );
  return response.data;
};

/**
 * Get pending review annotations
 * @param {number} projectId - Project ID
 * @param {number} limit - Max items
 * @returns {Promise<Object>} List of pending annotations
 */
export const getPendingReview = async (projectId, limit = 50) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/queue/pending-review?limit=${limit}`
  );
  return response.data;
};

export default {
  createAnnotation,
  getAnnotations,
  getAnnotation,
  getResourceAnnotation,
  updateAnnotation,
  deleteAnnotation,
  submitAnnotation,
  reviewAnnotation,
  addShape,
  updateShape,
  deleteShape,
  createCorrection,
  getCorrections,
  updateCorrection,
  acceptCorrection,
  getQueueTasks,
  getPendingReview,
};