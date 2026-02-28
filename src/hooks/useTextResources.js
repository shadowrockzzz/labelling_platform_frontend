import { useState, useEffect, useCallback } from 'react';
import { textResourceService } from '../services/textResourceService';

export const useTextResources = (projectId, options = {}) => {
  const { useQueue = false, autoFetch = true } = options;
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchResources = useCallback(async (page = 1) => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      let response;
      if (useQueue) {
        // Fetch only unannotated resources for queue-based workflow
        response = await textResourceService.getUnannotatedResources(projectId, 100);
      } else {
        // Fetch all resources
        response = await textResourceService.listResources(projectId, page);
      }
      setResources(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [projectId, useQueue]);

  const uploadResource = useCallback(async (file, name) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const resource = await textResourceService.uploadResource(projectId, file, name);
      await fetchResources(); // Refresh list
      return resource;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resource');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchResources]);

  const addUrlResource = useCallback(async (url, name) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const resource = await textResourceService.addUrlResource(projectId, url, name);
      await fetchResources(); // Refresh list
      return resource;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add URL resource');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchResources]);

  const deleteResource = useCallback(async (resourceId) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      await textResourceService.deleteResource(projectId, resourceId);
      await fetchResources(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete resource');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchResources]);

  const getResource = useCallback(async (resourceId) => {
    if (!projectId) throw new Error('Project ID is required');
    
    setLoading(true);
    try {
      const resource = await textResourceService.getResource(projectId, resourceId);
      return resource;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch resource');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (autoFetch) {
      fetchResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, autoFetch]);

  return {
    resources,
    loading,
    error,
    total,
    fetchResources,
    uploadResource,
    addUrlResource,
    deleteResource,
    getResource
  };
};