/**
 * BacklogManagement Component
 * 
 * Admin/PM view for managing skipped-rejected tasks in the backlog.
 * Allows releasing tasks back to pool or deleting them.
 */

import { useState, useEffect } from 'react';
import { 
  Archive, 
  Unlock, 
  Trash2, 
  Clock, 
  User,
  FileText,
  Image,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import annotationTaskService from '../../services/annotationTaskService.js';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export const BacklogManagement = ({ projectId, projectType = 'text' }) => {
  const { user } = useAuth();
  
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBacklog = async () => {
    try {
      setLoading(true);
      const tasks = await annotationTaskService.getBacklog(projectId, projectType);
      setBacklogTasks(tasks || []);
    } catch (error) {
      console.error('Failed to fetch backlog:', error);
      toast.error('Failed to load backlog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && user && (user.role === 'admin' || user.role === 'project_manager')) {
      fetchBacklog();
    }
  }, [projectId, projectType, user]);

  const handleRelease = async (task) => {
    if (!confirm(`Release task "${task.short_id}" back to the available pool? The assigned annotator will lose access.`)) {
      return;
    }
    
    try {
      setActionLoading(task.id);
      await annotationTaskService.releaseFromBacklog(task.id, projectId, projectType, 'release');
      toast.success('Task released to pool');
      fetchBacklog();
    } catch (error) {
      console.error('Failed to release task:', error);
      toast.error('Failed to release task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.short_id}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setActionLoading(task.id);
      await annotationTaskService.releaseFromBacklog(task.id, projectId, projectType, 'delete');
      toast.success('Task deleted');
      fetchBacklog();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSkipTypeLabel = (skipType) => {
    if (skipType === 1) return 'Skipped by Annotator';
    if (skipType === 2) return 'Skipped by Reviewer';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (backlogTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Archive className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Backlog Items</h3>
        <p className="text-gray-600">There are no tasks in the backlog right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Task Backlog ({backlogTasks.length})
          </h3>
        </div>
        <button
          onClick={fetchBacklog}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">About Backlog Tasks</p>
            <p className="mt-1">
              These tasks were skipped by annotators/reviewers after being rejected. 
              They remain assigned until manually released back to the pool.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skipped At
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skip Count
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {backlogTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {projectType === 'image' ? (
                        <Image className="w-4 h-4 text-gray-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.short_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Resource #{task.resource_id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{task.annotator_name}</p>
                      <p className="text-xs text-gray-500">{task.annotator_email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getSkipTypeLabel(task.is_skipped_rejected)}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(task.skipped_rejected_at)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {task.skipped_count || 0}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleRelease(task)}
                      disabled={actionLoading === task.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 disabled:opacity-50"
                      title="Release to pool"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Release
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      disabled={actionLoading === task.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BacklogManagement;