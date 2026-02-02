import { useState, useEffect, useCallback } from 'react';
import { textAnnotationService } from '../services/textAnnotationService';

export const useTextAnnotations = (projectId, filters = {}) => {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchAnnotations = useCallback(async (page = 1, newFilters = {}) => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const mergedFilters = { ...filters, ...newFilters };
      const response = await textAnnotationService.listAnnotations(projectId, mergedFilters);
      setAnnotations(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch annotations');
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  const createAnnotation = useCallback(async (data) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const annotation = await textAnnotationService.createAnnotation(projectId, data);
      await fetchAnnotations(); // Refresh list
      return annotation;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create annotation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAnnotations]);

  const updateAnnotation = useCallback(async (annotationId, data) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const annotation = await textAnnotationService.updateAnnotation(projectId, annotationId, data);
      await fetchAnnotations(); // Refresh list
      return annotation;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update annotation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAnnotations]);

  const submitAnnotation = useCallback(async (annotationId) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const annotation = await textAnnotationService.submitAnnotation(projectId, annotationId);
      await fetchAnnotations(); // Refresh list
      return annotation;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit annotation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAnnotations]);

  const reviewAnnotation = useCallback(async (annotationId, action, comment = null) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const annotation = await textAnnotationService.reviewAnnotation(projectId, annotationId, action, comment);
      await fetchAnnotations(); // Refresh list
      return annotation;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to review annotation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAnnotations]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return {
    annotations,
    loading,
    error,
    total,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    submitAnnotation,
    reviewAnnotation
  };
};