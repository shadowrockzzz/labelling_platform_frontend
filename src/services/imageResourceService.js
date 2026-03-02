/**
 * Image Resource Service
 * 
 * API service for managing image resources in annotation projects.
 * Handles upload, listing, and management of images.
 */

import api from './api';

const BASE_PATH = '/annotations/image';

/**
 * Upload an image file to a project
 * @param {number} projectId - Project ID
 * @param {File} file - Image file to upload
 * @param {string} name - Optional name for the resource
 * @returns {Promise<Object>} Created resource with URLs
 */
export const uploadImage = async (projectId, file, name = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }
  
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Create an image resource from URL
 * @param {number} projectId - Project ID
 * @param {string} url - Image URL
 * @param {string} name - Resource name
 * @returns {Promise<Object>} Created resource with URLs
 */
export const createImageFromUrl = async (projectId, url, name) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/url`,
    {
      external_url: url,
      name,
    }
  );
  return response.data;
};

/**
 * Get list of image resources for a project
 * @param {number} projectId - Project ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {number} params.uploader_id - Filter by uploader
 * @returns {Promise<Object>} Paginated list of resources
 */
export const getImages = async (projectId, params = {}) => {
  const { page = 1, limit = 20, uploader_id } = params;
  const queryParams = new URLSearchParams({ page, limit });
  if (uploader_id) {
    queryParams.append('uploader_id', uploader_id);
  }
  
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/resources?${queryParams}`
  );
  return response.data;
};

/**
 * Get a single image resource
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} Resource with URLs
 */
export const getImage = async (projectId, resourceId) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}`
  );
  return response.data;
};

/**
 * Delete (archive) an image resource
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} Success response
 */
export const deleteImage = async (projectId, resourceId) => {
  const response = await api.delete(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}`
  );
  return response.data;
};

/**
 * Get unannotated resources for the current user
 * @param {number} projectId - Project ID
 * @param {number} limit - Max items to return (default: 50)
 * @returns {Promise<Object>} List of unannotated resources
 */
export const getUnannotatedImages = async (projectId, limit = 50) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/queue/unannotated?limit=${limit}`
  );
  return response.data;
};

/**
 * Bulk upload multiple images for PM-provided resource pool
 * @param {number} projectId - Project ID
 * @param {FileList|Array} files - Files to upload
 * @returns {Promise<Object>} Upload results
 */
export const bulkUploadResources = async (projectId, files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/bulk-upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Get the next available resource from the pool
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Next resource (locked to current user)
 */
export const getNextPoolResource = async (projectId) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/pool/next`
  );
  return response.data;
};

/**
 * Get pool status (counts by status, locked resources)
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Pool status data
 */
export const getPoolStatus = async (projectId) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/pool/status`
  );
  return response.data;
};

/**
 * Skip a resource and get the next one
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource to skip
 * @returns {Promise<Object>} Next resource or null
 */
export const skipResource = async (projectId, resourceId) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}/skip`
  );
  return response.data;
};

/**
 * Release a lock on a resource (PM only)
 * @param {number} projectId - Project ID
 * @param {number} resourceId - Resource to unlock
 * @returns {Promise<Object>} Success response
 */
export const releaseLock = async (projectId, resourceId) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/resources/${resourceId}/release-lock`
  );
  return response.data;
};

/**
 * Get next annotation for review at specified level
 * @param {number} projectId - Project ID
 * @param {number} level - Review level
 * @returns {Promise<Object>} Next annotation for review
 */
export const getNextReviewAnnotation = async (projectId, level = 1) => {
  const response = await api.get(
    `${BASE_PATH}/projects/${projectId}/review-pool/next?level=${level}`
  );
  return response.data;
};

/**
 * Skip a review and get the next annotation
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Annotation to skip
 * @param {number} level - Review level
 * @returns {Promise<Object>} Next annotation or null
 */
export const skipReview = async (projectId, annotationId, level = 1) => {
  const response = await api.post(
    `${BASE_PATH}/projects/${projectId}/annotations/${annotationId}/skip-review?level=${level}`
  );
  return response.data;
};

export default {
  uploadImage,
  createImageFromUrl,
  getImages,
  getImage,
  deleteImage,
  getUnannotatedImages,
  bulkUploadResources,
  getNextPoolResource,
  getPoolStatus,
  skipResource,
  releaseLock,
  getNextReviewAnnotation,
  skipReview,
};
