import api from './api';

const API_BASE = '/annotations/text';

export const textAnnotationService = {
  // List annotations for a project
  listAnnotations: async (projectId, filters = {}) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/annotations`, {
      params: filters
    });
    return response.data;
  },

  // Get a specific annotation
  getAnnotation: async (projectId, annotationId) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/annotations/${annotationId}`);
    return response.data;
  },

  // Create a new annotation
  createAnnotation: async (projectId, data) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations`, data);
    return response.data;
  },

  // Update an annotation
  updateAnnotation: async (projectId, annotationId, data) => {
    try {
      console.log('=== API Call: updateAnnotation ===');
      console.log('URL:', `${API_BASE}/projects/${projectId}/annotations/${annotationId}`);
      console.log('Payload:', JSON.stringify(data, null, 2));
      
      const response = await api.put(`${API_BASE}/projects/${projectId}/annotations/${annotationId}`, data);
      console.log('Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('=== API Error ===');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Full Error:', error);
      throw error;
    }
  },

  // Submit an annotation for review
  submitAnnotation: async (projectId, annotationId) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations/${annotationId}/submit`);
    return response.data;
  },

  // Review an annotation (approve/reject)
  reviewAnnotation: async (projectId, annotationId, action, comment = null) => {
    const response = await api.post(`${API_BASE}/projects/${projectId}/annotations/${annotationId}/review`, {
      action,
      comment
    });
    return response.data;
  },

  // Get queue tasks for a project
  getQueueTasks: async (projectId) => {
    const response = await api.get(`${API_BASE}/projects/${projectId}/queue`);
    return response.data;
  },

  // ==================== Single-Annotation Model Endpoints (New) ====================

  // Add a span to an annotation for a resource
  addSpan: async (projectId, resourceId, spanData, annotationSubType = 'ner') => {
    const response = await api.post(
      `${API_BASE}/projects/${projectId}/resources/${resourceId}/spans`,
      spanData,
      { params: { annotation_sub_type: annotationSubType } }
    );
    return response.data;
  },

  // Get annotation with all spans for a resource
  getAnnotationWithSpans: async (projectId, resourceId, userId = null) => {
    const params = {};
    if (userId !== null) {
      params.user_id = userId;
    }
    const response = await api.get(
      `${API_BASE}/projects/${projectId}/resources/${resourceId}/annotation`,
      { params }
    );
    return response.data;
  },

  // Update a specific span within an annotation
  updateSpan: async (projectId, annotationId, spanId, spanData) => {
    const response = await api.put(
      `${API_BASE}/projects/${projectId}/annotations/${annotationId}/spans/${spanId}`,
      spanData
    );
    return response.data;
  },

  // Remove a specific span from an annotation
  deleteSpan: async (projectId, annotationId, spanId) => {
    const response = await api.delete(
      `${API_BASE}/projects/${projectId}/annotations/${annotationId}/spans/${spanId}`
    );
    return response.data;
  },

  // ==================== Review Correction Endpoints (New) ====================

  // Create a review correction
  createCorrection: async (projectId, annotationId, correctedData, comment = null) => {
    const response = await api.post(
      `${API_BASE}/projects/${projectId}/annotations/${annotationId}/corrections`,
      {
        annotation_id: annotationId,
        corrected_data: correctedData,
        comment: comment
      }
    );
    return response.data;
  },

  // List corrections for an annotation
  listCorrections: async (projectId, annotationId, status = null) => {
    const params = {};
    if (status !== null) {
      params.status = status;
    }
    const response = await api.get(
      `${API_BASE}/projects/${projectId}/annotations/${annotationId}/corrections`,
      { params }
    );
    return response.data;
  },

  // Get a specific correction
  getCorrection: async (projectId, correctionId) => {
    const response = await api.get(
      `${API_BASE}/projects/${projectId}/corrections/${correctionId}`
    );
    return response.data;
  },

  // Update a correction (accept/reject)
  updateCorrection: async (projectId, correctionId, status, annotatorResponse = null) => {
    const response = await api.put(
      `${API_BASE}/projects/${projectId}/corrections/${correctionId}`,
      {
        status: status,
        annotator_response: annotatorResponse
      }
    );
    return response.data;
  },

  // Accept a correction and apply to annotation
  acceptCorrection: async (projectId, correctionId, annotatorResponse = null) => {
    const params = {};
    if (annotatorResponse !== null) {
      params.annotator_response = annotatorResponse;
    }
    const response = await api.post(
      `${API_BASE}/projects/${projectId}/corrections/${correctionId}/accept`,
      null,
      { params }
    );
    return response.data;
  }
};
