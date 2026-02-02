import React, { useState, useEffect, useContext } from 'react';
import { RefreshCw, Eye, EyeOff, Layers } from 'lucide-react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { QUEUE_TASK_STATUS, getSubTypeConfig } from '../../features/text-annotation/constants';
import { AuthContext } from '../../contexts/AuthContext';

const QueueStatus = ({ projectId }) => {
  const { user } = useContext(AuthContext);
  
  // Only show QueueStatus to admins and project managers
  if (!user || (user.role !== 'admin' && user.role !== 'project_manager')) {
    return null;
  }
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true); // Toggle for automatic polling (default: ON)
  const [pollingActive, setPollingActive] = useState(false); // Show if polling is currently happening

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setPollingActive(true);
    try {
      const response = await textAnnotationService.getQueueTasks(projectId);
      setTasks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch queue tasks:', err);
    } finally {
      setLoading(false);
      setPollingActive(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Only set up polling if autoPoll is enabled
    let interval;
    if (autoPoll) {
      // Poll every 30 seconds (less aggressive than 10 seconds)
      interval = setInterval(fetchTasks, 30000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [projectId, autoPoll]);

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    processing: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  // Helper to get sub-type info from payload
  const getSubTypeInfo = (payload) => {
    if (!payload) return null;
    const subType = payload.annotation_sub_type;
    if (!subType) return null;
    
    const config = getSubTypeConfig(subType);
    return {
      subType,
      label: config?.shortLabel || subType.toUpperCase(),
      fullLabel: config?.label,
      color: config?.color || '#6366f1'
    };
  };

  // Helper to format task description
  const getTaskDescription = (task) => {
    const subTypeInfo = getSubTypeInfo(task.payload);
    
    switch (task.task_type) {
      case 'resource_uploaded':
        return 'A new text resource was uploaded to the project';
      
      case 'resource_url_added':
        return 'A URL resource was added to the project';
      
      case 'annotation_submitted':
        return subTypeInfo 
          ? `An ${subTypeInfo.fullLabel} annotation was submitted for review`
          : 'An annotation was submitted for review';
      
      case 'annotation_reviewed':
        return subTypeInfo
          ? `An ${subTypeInfo.fullLabel} annotation was reviewed`
          : 'An annotation was reviewed';
      
      default:
        return task.task_type?.replace('_', ' ') || 'Unknown task';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Queue Status</h3>
        <p className="text-center text-gray-500">No tasks in queue</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Queue Status</h3>
          {autoPoll && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <Eye className="w-3 h-3" />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-Poll Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPoll(!autoPoll)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${
                autoPoll 
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={autoPoll ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoPoll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Auto-refresh</span>
            </button>
            {pollingActive && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
          
          {/* Manual Refresh Button */}
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline"
            title="Refresh now"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {tasks.map((task) => {
          const subTypeInfo = getSubTypeInfo(task.payload);
          
          return (
            <div
              key={task.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Header: Status, Type, Timestamp */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Badge */}
                  <span 
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusColors[task.status] || statusColors.pending}`}
                  >
                    {task.status.toUpperCase()}
                  </span>
                  
                  {/* Annotation Type Badge */}
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {task.annotation_type?.toUpperCase() || 'TEXT'}
                  </span>
                  
                  {/* Sub-Type Badge (if available in payload) */}
                  {subTypeInfo && (
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: subTypeInfo.color, color: 'white' }}
                    >
                      <Layers size={12} className="mr-1" />
                      {subTypeInfo.label}
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>

              {/* Task Description */}
              <p className="text-sm font-medium text-gray-900 mb-2">
                {getTaskDescription(task)}
              </p>

              {/* Task Type */}
              <div className="mb-2">
                <span className="text-xs text-gray-500">Task Type:</span>
                <span className="ml-2 text-xs font-medium text-gray-700">
                  {task.task_type?.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              {/* IDs */}
              <div className="flex flex-wrap gap-4 mb-2 text-xs text-gray-600">
                {task.resource_id && (
                  <span>
                    <span className="text-gray-500">Resource:</span> {task.resource_id}
                  </span>
                )}
                {task.annotation_id && (
                  <span>
                    <span className="text-gray-500">Annotation:</span> {task.annotation_id}
                  </span>
                )}
              </div>

              {/* Error Message */}
              {task.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-700">
                    <strong>Error:</strong> {task.error_message}
                  </p>
                </div>
              )}

              {/* Processed At */}
              {task.processed_at && (
                <p className="mt-2 text-xs text-gray-500">
                  Processed: {new Date(task.processed_at).toLocaleString()}
                </p>
              )}

              {/* Payload Details */}
              {task.payload && Object.keys(task.payload).length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                    View payload ({Object.keys(task.payload).length} fields)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-left overflow-x-auto">
                    {JSON.stringify(task.payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total tasks: {tasks.length}</span>
          <span>
            Pending: {tasks.filter(t => t.status === 'pending').length} • 
            Processing: {tasks.filter(t => t.status === 'processing').length} • 
            Done: {tasks.filter(t => t.status === 'done').length} • 
            Failed: {tasks.filter(t => t.status === 'failed').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;