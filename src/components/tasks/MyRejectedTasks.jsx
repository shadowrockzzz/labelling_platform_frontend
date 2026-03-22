/**
 * MyRejectedTasks Component
 * 
 * Shows annotators their rejected tasks that need correction.
 * Allows them to resume or skip (move to backlog).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  Play, 
  SkipForward, 
  Clock, 
  MessageSquare,
  FileText,
  Image,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import annotationTaskService from '../../services/annotationTaskService.js';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export const MyRejectedTasks = ({ projectId, projectType = 'text', project }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [rejectedTasks, setRejectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRejectedTasks = async () => {
    try {
      setLoading(true);
      const tasks = await annotationTaskService.getMyRejectedTasks(projectId, projectType);
      setRejectedTasks(tasks || []);
    } catch (error) {
      console.error('Failed to fetch rejected tasks:', error);
      toast.error('Failed to load rejected tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && user) {
      fetchRejectedTasks();
    }
  }, [projectId, projectType, user]);

  const handleResume = async (task) => {
    try {
      setActionLoading(task.id);
      const resumedTask = await annotationTaskService.resumeRejectedTask(task.id, projectId, projectType);
      toast.success('Task resumed! Redirecting...');
      // Navigate to the task workspace
      navigate(`/projects/${projectId}/tasks?taskId=${task.id}`);
    } catch (error) {
      console.error('Failed to resume task:', error);
      toast.error('Failed to resume task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (task) => {
    if (!confirm('Skip this rejected task? It will be moved to your backlog and can be resumed later. An admin must release it from backlog.')) {
      return;
    }
    
    try {
      setActionLoading(task.id);
      await annotationTaskService.skipRejectedTask(task.id, projectId, projectType);
      toast.success('Task moved to backlog');
      fetchRejectedTasks(); // Refresh the list
    } catch (error) {
      console.error('Failed to skip task:', error);
      toast.error('Failed to skip task');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResourceName = (task) => {
    return task.resource?.name || `Resource #${task.resource_id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (rejectedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Tasks</h3>
        <p className="text-gray-600">You don't have any rejected tasks that need correction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Rejected Tasks ({rejectedTasks.length})
          </h3>
        </div>
        <button
          onClick={fetchRejectedTasks}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {rejectedTasks.map((task) => (
          <div 
            key={task.id}
            className="bg-white border border-amber-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Resource Icon */}
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {projectType === 'image' ? (
                    <Image className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {getResourceName(task)}
                  </h4>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Updated {formatDate(task.updated_at)}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Rejected
                    </span>
                  </div>
                  
                  {/* Rejection Comment Preview */}
                  {task.resource?.annotation?.review_comment && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 line-clamp-2">
                          {task.resource.annotation.review_comment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleResume(task)}
                  disabled={actionLoading === task.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
                <button
                  onClick={() => handleSkip(task)}
                  disabled={actionLoading === task.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
              </div>
            </div>
            
            {/* Task ID */}
            <div className="mt-2 text-xs text-gray-500">
              Task ID: {task.short_id || task.id?.substring(0, 8)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRejectedTasks;