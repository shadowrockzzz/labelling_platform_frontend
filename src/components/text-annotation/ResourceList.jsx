import React from 'react';
import { FileText, Lock, CheckCircle, SkipForward, Circle } from 'lucide-react';

// Helper to get pool status badge styling
const getPoolStatusBadge = (status) => {
  const statusConfig = {
    available: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: Circle,
      label: 'Available'
    },
    locked: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      icon: Lock,
      label: 'Locked'
    },
    completed: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: CheckCircle,
      label: 'Completed'
    },
    skipped: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: SkipForward,
      label: 'Skipped'
    }
  };
  
  return statusConfig[status] || statusConfig.available;
};

const ResourceList = ({ 
  resources, 
  loading, 
  onSelect, 
  onDelete,
  showPoolStatus = false,
  users = {} // Map of user_id -> user name for locked_by display
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Loading resources...</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">No resources added yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Resources</h3>
      <div className="space-y-4">
        {resources.map((resource) => {
          const poolStatus = resource.pool_status || 'available';
          const statusBadge = getPoolStatusBadge(poolStatus);
          const StatusIcon = statusBadge.icon;
          const lockedByName = resource.locked_by_user_id && users[resource.locked_by_user_id] 
            ? users[resource.locked_by_user_id] 
            : null;
          
          return (
            <div
              key={resource.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 cursor-pointer" onClick={() => onSelect(resource)}>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{resource.name}</h4>
                  {/* Pool status badge */}
                  {showPoolStatus && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusBadge.bg} ${statusBadge.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {resource.source_type === 'upload' ? 'File' : 'URL'}
                  </span>
                  {resource.file_size && (
                    <span>
                      {(resource.file_size / 1024).toFixed(2)} KB
                    </span>
                  )}
                  {resource.content_preview && (
                    <span className="truncate max-w-md">
                      {resource.content_preview.substring(0, 50)}...
                    </span>
                  )}
                </div>
                {/* Show locked by info */}
                {showPoolStatus && poolStatus === 'locked' && lockedByName && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Locked by: {lockedByName}
                  </p>
                )}
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(resource.id)}
                  className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceList;