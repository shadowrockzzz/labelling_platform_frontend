/**
 * ImageResourceList Component
 * 
 * Displays list of image resources for annotation.
 */

import React from 'react';
import { Image, Loader2 } from 'lucide-react';

const ImageResourceList = ({
  resources,
  selectedResource,
  onSelect,
  loading,
  showHeader = true,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (!resources || resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <Image className="w-8 h-8 mb-2" />
        <p className="text-sm text-center">No images uploaded</p>
        <p className="text-xs text-center mt-1">Upload images to start annotating</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {showHeader && (
        <div className="px-3 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Images ({resources.length})</h3>
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {resources.map((resource) => {
          const isSelected = selectedResource?.id === resource.id;
          
          return (
            <button
              key={resource.id}
              onClick={() => onSelect(resource)}
              className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {resource.thumbnail_url ? (
                  <img
                    src={resource.thumbnail_url}
                    alt={resource.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {resource.name}
                </p>
                <p className="text-xs text-gray-500">
                  {resource.width && resource.height 
                    ? `${resource.width}×${resource.height}` 
                    : 'Unknown size'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ImageResourceList;