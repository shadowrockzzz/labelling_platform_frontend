import React from 'react';

const ResourceList = ({ resources, loading, onSelect, onDelete }) => {
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
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 cursor-pointer" onClick={() => onSelect(resource)}>
              <h4 className="font-medium text-gray-900">{resource.name}</h4>
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
        ))}
      </div>
    </div>
  );
};

export default ResourceList;