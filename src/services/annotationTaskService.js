/**
 * Annotation Task Service
 * 
 * API client for task-based annotation workflow.
 * Handles task claiming, skipping, submitting, and stats.
 * Supports both text and image annotation projects.
 */

import api from './api';

/**
 * Get the base path for task API based on project type
 * @param {string} projectType - 'text' or 'image'
 * @returns {string} Base API path
 */
const getBasePath = (projectType) => {
  return `/annotations/${projectType}/tasks`;
};

/**
 * Claim the next available annotation task
 * 
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object>} Claimed task with resource data
 */
export const claimTask = async (projectId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.post(`${basePath}/claim`, null, {
    params: { project_id: projectId }
  });
  return response.data;
};

/**
 * Get current user's active task in a project
 * 
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object|null>} Active task or null
 */
export const getMyActiveTask = async (projectId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.get(`${basePath}/my-active`, {
    params: { project_id: projectId }
  });
  return response.data;
};

/**
 * Get task statistics for a project
 * 
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object>} Task stats (total, available, locked, etc.)
 */
export const getTaskStats = async (projectId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.get(`${basePath}/stats`, {
    params: { project_id: projectId }
  });
  return response.data;
};

/**
 * Get a specific task by ID
 * 
 * @param {string} taskId - Task UUID
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object>} Task with resource data
 */
export const getTask = async (taskId, projectId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.get(`${basePath}/${taskId}`, {
    params: { project_id: projectId }
  });
  return response.data;
};

/**
 * Skip a task, returning it to the pool
 * 
 * @param {string} taskId - Task UUID
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object>} Skip confirmation
 */
export const skipTask = async (taskId, projectId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.post(`${basePath}/${taskId}/skip`, null, {
    params: { project_id: projectId }
  });
  return response.data;
};

/**
 * Submit a task after annotation is created
 * 
 * @param {string} taskId - Task UUID
 * @param {number} projectId - Project ID
 * @param {number} annotationId - Created annotation ID
 * @param {string} projectType - 'text' or 'image'
 * @returns {Promise<Object>} Submit confirmation
 */
export const submitTask = async (taskId, projectId, annotationId, projectType = 'text') => {
  const basePath = getBasePath(projectType);
  const response = await api.post(`${basePath}/${taskId}/submit`, null, {
    params: { 
      project_id: projectId,
      annotation_id: annotationId
    }
  });
  return response.data;
};

/**
 * Seed tasks from existing resources (admin only)
 * 
 * @param {number} projectId - Project ID
 * @param {string} projectType - 'text' or 'image'
 * @param {number[]} resourceIds - Optional specific resource IDs
 * @returns {Promise<Object>} Seed result with counts
 */
export const seedTasks = async (projectId, projectType = 'text', resourceIds = null) => {
  const basePath = getBasePath(projectType);
  const response = await api.post(`${basePath}/seed`, 
    resourceIds ? { resource_ids: resourceIds } : {},
    { params: { project_id: projectId } }
  );
  return response.data;
};

export default {
  claimTask,
  getMyActiveTask,
  getTaskStats,
  getTask,
  skipTask,
  submitTask,
  seedTasks
};