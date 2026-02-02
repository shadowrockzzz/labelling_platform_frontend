import React, { useState, useEffect, useContext } from 'react';
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

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await textAnnotationService.getQueueTasks(projectId);
      setTasks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch queue tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Poll every 10 seconds
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

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
        <h3 className="text-lg font-semibold">Queue Status</h3>
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="text-sm text-blue-600 hover:underline"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
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