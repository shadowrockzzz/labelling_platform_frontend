import React, { useState, useEffect } from 'react';
import { textAnnotationService } from '../../services/textAnnotationService';
import { ANNOTATION_STATUSES } from '../../features/text-annotation/constants';
import { 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AllAnnotationsDashboard Component
 * Admin oversight view showing all annotations with filtering capabilities
 */
const AllAnnotationsDashboard = ({ projectId, projectLabels }) => {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    annotator_id: '',
    label: '',
  });
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotators, setAnnotators] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (projectId) {
      loadAnnotations();
    }
  }, [projectId, filters]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.annotator_id) params.annotator_id = filters.annotator_id;
      if (filters.label) params.label = filters.label;
      
      const response = await textAnnotationService.listAnnotations(projectId, params);
      const data = response.data || [];
      setAnnotations(data);
      
      // Calculate stats
      const newStats = {
        total: data.length,
        draft: data.filter(a => a.status === ANNOTATION_STATUSES.DRAFT).length,
        submitted: data.filter(a => a.status === ANNOTATION_STATUSES.SUBMITTED).length,
        approved: data.filter(a => a.status === ANNOTATION_STATUSES.APPROVED).length,
        rejected: data.filter(a => a.status === ANNOTATION_STATUSES.REJECTED).length,
      };
      setStats(newStats);
      
      // Extract unique annotators
      const uniqueAnnotators = [...new Set(data.map(a => a.annotator_id))];
      setAnnotators(uniqueAnnotators.map(id => {
        const annotation = data.find(a => a.annotator_id === id);
        return {
          id,
          name: annotation.annotator_name || annotation.annotator?.full_name || annotation.annotator?.email || `User ${id}`,
        };
      }));
    } catch (error) {
      console.error('Failed to load annotations:', error);
      toast.error('Failed to load annotations');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', annotator_id: '', label: '' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations_project_${projectId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Annotations exported');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case ANNOTATION_STATUSES.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case ANNOTATION_STATUSES.SUBMITTED:
        return 'bg-blue-100 text-blue-800';
      case ANNOTATION_STATUSES.APPROVED:
        return 'bg-green-100 text-green-800';
      case ANNOTATION_STATUSES.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ANNOTATION_STATUSES.DRAFT:
        return <FileText className="w-4 h-4" />;
      case ANNOTATION_STATUSES.SUBMITTED:
        return <Clock className="w-4 h-4" />;
      case ANNOTATION_STATUSES.APPROVED:
        return <CheckCircle className="w-4 h-4" />;
      case ANNOTATION_STATUSES.REJECTED:
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">Loading all annotations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Submitted</p>
          <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
            <button
              onClick={exportData}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Statuses</option>
              <option value={ANNOTATION_STATUSES.DRAFT}>Draft</option>
              <option value={ANNOTATION_STATUSES.SUBMITTED}>Submitted</option>
              <option value={ANNOTATION_STATUSES.APPROVED}>Approved</option>
              <option value={ANNOTATION_STATUSES.REJECTED}>Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annotator</label>
            <select
              value={filters.annotator_id}
              onChange={(e) => handleFilterChange('annotator_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Annotators</option>
              {annotators.map(annotator => (
                <option key={annotator.id} value={annotator.id}>
                  {annotator.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <select
              value={filters.label}
              onChange={(e) => handleFilterChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Labels</option>
              {projectLabels.map(label => (
                <option key={label.id} value={label.name}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Annotations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            All Annotations ({annotations.length})
          </h3>
        </div>

        {annotations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No annotations found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annotator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {annotations.map((annotation) => (
                  <AnnotationRow
                    key={annotation.id}
                    annotation={annotation}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getStatusIcon={getStatusIcon}
                    onView={() => setSelectedAnnotation(annotation)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Annotation Detail Modal */}
      {selectedAnnotation && (
        <AnnotationDetailModal
          annotation={selectedAnnotation}
          onClose={() => setSelectedAnnotation(null)}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
};

/* Sub-component for table rows */
const AnnotationRow = ({ annotation, getStatusBadgeClass, getStatusIcon, onView }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        #{annotation.id}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        Resource #{annotation.resource_id}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
        {annotation.annotator_name || annotation.annotator?.full_name || annotation.annotator?.email || 'Unknown'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(annotation.status)}`}>
          {getStatusIcon(annotation.status)}
          <span className="ml-1">{annotation.status}</span>
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {annotation.label || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {new Date(annotation.modified_at || annotation.updated_at || annotation.created_at).toLocaleString()}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <button
          onClick={onView}
          className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>
      </td>
    </tr>
  );
};

/* Sub-component for annotation detail modal */
const AnnotationDetailModal = ({ annotation, onClose, getStatusBadgeClass }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Annotation #{annotation.id}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(annotation.status)}`}>
                {annotation.status}
              </span>
            </div>

            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Annotator:</p>
                  <p className="font-medium">{annotation.annotator_name || annotation.annotator?.full_name || annotation.annotator?.email || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Resource ID:</p>
                  <p className="font-medium">{annotation.resource_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type:</p>
                  <p className="font-medium">{annotation.annotation_type || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Label:</p>
                  <p className="font-medium">{annotation.label || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created:</p>
                  <p className="font-medium">{new Date(annotation.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Updated:</p>
                  <p className="font-medium">{new Date(annotation.modified_at || annotation.updated_at || annotation.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Review comment if exists */}
              {annotation.review_comment && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-800 mb-1">Review Comment:</p>
                  <p className="text-orange-900">{annotation.review_comment}</p>
                </div>
              )}

              {/* Annotation data */}
              {annotation.annotation_data && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Annotation Data:</p>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {JSON.stringify(annotation.annotation_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAnnotationsDashboard;