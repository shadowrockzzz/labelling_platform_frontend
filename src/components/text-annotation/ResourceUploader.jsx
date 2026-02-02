import React, { useState } from 'react';

const ResourceUploader = ({ onUpload, onAddUrl, loading }) => {
  const [mode, setMode] = useState('upload'); // 'upload' or 'url'
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (mode === 'upload' && file) {
      await onUpload(file, name);
      setFile(null);
      setName('');
    } else if (mode === 'url' && url && name) {
      await onAddUrl(url, name);
      setUrl('');
      setName('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add Resource</h3>
      
      {/* Mode toggle */}
      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-md transition-colors ${
            mode === 'upload'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-md transition-colors ${
            mode === 'url'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Add URL
        </button>
      </div>

      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter resource name"
            required
          />
        </div>

        {mode === 'upload' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Text File
            </label>
            <input
              type="file"
              accept=".txt,.csv,.json"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        )}

        {mode === 'url' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/resource.txt"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Adding...' : mode === 'upload' ? 'Upload File' : 'Add URL'}
        </button>
      </form>
    </div>
  );
};

export default ResourceUploader;