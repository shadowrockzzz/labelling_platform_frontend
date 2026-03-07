/**
 * Review Task Service
 * API calls for multi-level review workflow with UUID tracking
 */

import api from './api';

/**
 * Start reviewing - get next available task for the reviewer's level
 * @param {string} annotationType - 'text' or 'image'
 * @param {number} projectId - Project ID
 * @param {number} reviewLevel - Review level (1, 2, 3, ...)
 * @returns {Promise<Object>} Review task with annotation and resource data
 */
export const startReview = async (annotationType, projectId, reviewLevel = 1) => {
  const response = await api.get(
    `/annotations/${annotationType}/projects/${projectId}/review-pool/start`,
    { params: { review_level: reviewLevel } }
  );
  return response.data;
};

/**
 * Perform a review action (approve, reject, edit)
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID
 * @param {Object} actionData - Action data
 * @param {string} actionData.action - 'approve', 'reject', or 'edit'
 * @param {string} [actionData.comment] - Optional comment
 * @param {Object} [actionData.annotation_data] - Required for edit action
 * @returns {Promise<Object>} Updated review task
 */
export const reviewAction = async (annotationType, taskId, actionData) => {
  const response = await api.post(
    `/annotations/${annotationType}/review-tasks/${taskId}/action`,
    actionData
  );
  return response.data;
};

/**
 * Approve an annotation
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID
 * @param {string} [comment] - Optional approval comment
 * @returns {Promise<Object>} Updated review task
 */
export const approveAnnotation = async (annotationType, taskId, comment = null) => {
  return reviewAction(annotationType, taskId, { action: 'approve', comment });
};

/**
 * Reject an annotation
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID
 * @param {string} comment - Rejection reason
 * @returns {Promise<Object>} Updated review task
 */
export const rejectAnnotation = async (annotationType, taskId, comment) => {
  return reviewAction(annotationType, taskId, { action: 'reject', comment });
};

/**
 * Edit an annotation (reviewer makes direct changes)
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID
 * @param {Object} annotationData - Updated annotation data
 * @param {string} [comment] - Optional edit comment
 * @returns {Promise<Object>} Updated review task
 */
export const editAnnotation = async (annotationType, taskId, annotationData, comment = null) => {
  return reviewAction(annotationType, taskId, { 
    action: 'edit', 
    annotation_data: annotationData,
    comment 
  });
};

/**
 * Skip a review task and get the next one
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID to skip
 * @returns {Promise<Object>} Next review task or message
 */
export const skipReview = async (annotationType, taskId) => {
  const response = await api.post(
    `/annotations/${annotationType}/review-tasks/${taskId}/skip`
  );
  return response.data;
};

/**
 * Get review pool statistics
 * @param {string} annotationType - 'text' or 'image'
 * @param {number} projectId - Project ID
 * @param {number} reviewLevel - Review level
 * @returns {Promise<Object>} Pool statistics
 */
export const getReviewPoolStats = async (annotationType, projectId, reviewLevel = 1) => {
  const response = await api.get(
    `/annotations/${annotationType}/projects/${projectId}/review-pool/stats`,
    { params: { review_level: reviewLevel } }
  );
  return response.data;
};

/**
 * Get review task details
 * @param {string} annotationType - 'text' or 'image'
 * @param {string} taskId - Review task UUID
 * @returns {Promise<Object>} Review task details
 */
export const getReviewTask = async (annotationType, taskId) => {
  const response = await api.get(
    `/annotations/${annotationType}/review-tasks/${taskId}`
  );
  return response.data;
};

/**
 * Get final output data for an approved annotation
 * @param {Object} annotation - Annotation object with final_output_data
 * @returns {Object|null} Final output data or null
 */
export const getFinalOutputData = (annotation) => {
  if (!annotation || !annotation.final_output_data) return null;
  return annotation.final_output_data;
};

/**
 * Get review chain from annotation
 * @param {Object} annotation - Annotation object with review_chain
 * @returns {Array} Review chain entries
 */
export const getReviewChain = (annotation) => {
  if (!annotation || !annotation.review_chain) return [];
  return annotation.review_chain;
};

/**
 * Format review chain for display
 * @param {Array} reviewChain - Review chain entries
 * @returns {Array} Formatted entries for display
 */
export const formatReviewChain = (reviewChain) => {
  if (!reviewChain || !Array.isArray(reviewChain)) return [];
  
  return reviewChain.map((entry, index) => ({
    level: entry.review_level,
    action: entry.action,
    reviewerId: entry.reviewer_id,
    taskId: entry.review_task_id,
    comment: entry.comment,
    actedAt: entry.acted_at ? new Date(entry.acted_at).toLocaleString() : 'N/A',
    stepNumber: index + 1
  }));
};

/**
 * Format final output for display/export
 * @param {Object} finalOutputData - Final output data
 * @returns {Object} Formatted output
 */
export const formatFinalOutput = (finalOutputData) => {
  if (!finalOutputData) return null;
  
  return {
    outputUuid: finalOutputData.final_output_uuid,
    annotatorTaskId: finalOutputData.annotator_task_id,
    annotationId: finalOutputData.annotation_id,
    resourceId: finalOutputData.resource_id,
    projectId: finalOutputData.project_id,
    participants: finalOutputData.participants,
    reviewChain: formatReviewChain(finalOutputData.review_chain),
    annotationData: finalOutputData.annotation_data,
    approvedAt: finalOutputData.approved_at ? new Date(finalOutputData.approved_at).toLocaleString() : 'N/A'
  };
};

export default {
  startReview,
  reviewAction,
  approveAnnotation,
  rejectAnnotation,
  editAnnotation,
  skipReview,
  getReviewPoolStats,
  getReviewTask,
  getFinalOutputData,
  getReviewChain,
  formatReviewChain,
  formatFinalOutput
};