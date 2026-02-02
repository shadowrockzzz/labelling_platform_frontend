import React, { useState, useEffect, useContext } from 'react';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { QUEUE_TASK_STATUS } from '../../features/text-annotation/constants';
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
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColors[task.status] || statusColors.pending}`}>
                {task.status}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(task.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {task.task_type?.replace('_', ' ').toUpperCase()}
            </p>
            {task.error_message && (
              <p className="mt-1 text-xs text-red-600">{task.error_message}</p>
            )}
            {task.metadata && Object.keys(task.metadata).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-blue-600 cursor-pointer">View details</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(task.metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueStatus;