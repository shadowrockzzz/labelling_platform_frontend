import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, User as UserIcon } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { userService } from '../../services/userService.js';
import { getSubTypeOptions } from '../../features/text-annotation/constants.js';

/**
 * ProjectForm Component
 * Handles creation and editing of projects with dynamic fields based on annotation type
 * 
 * @param {object} project - Project data for edit mode (null for create mode)
 * @param {function} onSubmit - Function to call when form is submitted
 * @param {function} onCancel - Function to call when form is cancelled
 * @param {boolean} isSubmitting - Whether form is currently submitting
 */
export const ProjectForm = ({ project, onSubmit, onCancel, isSubmitting }) => {
  const isEditMode = !!project;
  
  // Form state
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    annotation_type: project?.annotation_type || '',
    owner_id: project?.owner?.id || null,
    // Dynamic fields based on annotation type
    config: project?.config || {}
  });

  const [errors, setErrors] = useState({});
  const [availableManagers, setAvailableManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch available managers
  useEffect(() => {
    if (isEditMode) {
      fetchAvailableManagers();
    }
  }, [isEditMode]);

  // Update form state when project prop changes (for edit mode)
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        annotation_type: project.annotation_type || '',
        owner_id: project.owner?.id || null,
        config: project.config || {}
      });
      setShowAdvanced(false);
      setErrors({});
    }
  }, [project]);

  const fetchAvailableManagers = async () => {
    try {
      setLoadingManagers(true);
      const response = await userService.getAllUsers();
      // Filter for admins and project managers
      const managers = response.data.filter(user => 
        user.role === 'admin' || user.role === 'project_manager'
      );
      setAvailableManagers(managers);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setLoadingManagers(false);
    }
  };

  // Annotation type options
  const annotationTypes = [
    { value: '', label: 'None (General)' },
    { value: 'text', label: 'Text Annotation' },
    { value: 'image_classification', label: 'Image Classification' },
    { value: 'object_detection', label: 'Object Detection' },
    { value: 'video_annotation', label: 'Video Annotation' },
    { value: 'audio_annotation', label: 'Audio Annotation' },
    { value: 'custom', label: 'Custom' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' }
  ];

  // Use all 8 text annotation sub-types from constants
  const textSubTypes = getSubTypeOptions();

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle config field changes
  const handleConfigChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  // Form validation
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Validate custom JSON schema
    if (formData.annotation_type === 'custom' && formData.config.customSchema) {
      try {
        JSON.parse(formData.config.customSchema);
      } catch (e) {
        newErrors.customSchema = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      annotation_type: formData.annotation_type || null,
      config: formData.config
    };

    // Only include owner_id in edit mode or if specified
    if (isEditMode && formData.owner_id) {
      submitData.owner_id = formData.owner_id;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Fields */}
      <div className="space-y-4">
        {/* Project Manager Selection (Edit Mode Only) */}
        {isEditMode && (
          <div>
            <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">
              Project Manager
            </label>
            {loadingManagers ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                Loading managers...
              </div>
            ) : (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="owner_id"
                  name="owner_id"
                  value={formData.owner_id || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                  disabled={isSubmitting}
                >
                  <option value="">Select a manager...</option>
                  {availableManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.full_name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              The project manager will have full control over this project
            </p>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter project name"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter project description"
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Annotation Type */}
      <div>
        <label htmlFor="annotation_type" className="block text-sm font-medium text-gray-700 mb-1">
          Annotation Type
        </label>
        <select
          id="annotation_type"
          name="annotation_type"
          value={formData.annotation_type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isSubmitting}
        >
          {annotationTypes.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Fields Based on Annotation Type */}
      {formData.annotation_type && (
        <div className="border-t border-gray-200 pt-6">
          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Advanced Settings
          </button>

          {/* Text Annotation Settings */}
          {formData.annotation_type === 'text' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annotation Sub-Type
                </label>
                <select
                  value={formData.config.textSubType || textSubTypes[0]?.value || ''}
                  onChange={(e) => handleConfigChange('textSubType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  {textSubTypes.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formData.config.textSubType && (
                  <p className="mt-1 text-xs text-gray-500">
                    {textSubTypes.find(opt => opt.value === formData.config.textSubType)?.description}
                  </p>
                )}
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.config.autoSuggestion || false}
                        onChange={(e) => handleConfigChange('autoSuggestion', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={isSubmitting}
                      />
                      Enable Auto-Suggestion
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Character Limit
                    </label>
                    <input
                      type="number"
                      value={formData.config.charLimit || ''}
                      onChange={(e) => handleConfigChange('charLimit', parseInt(e.target.value) || null)}
                      placeholder="e.g., 1000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Image Classification Settings */}
          {formData.annotation_type === 'image_classification' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Classes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.config.numClasses || ''}
                  onChange={(e) => handleConfigChange('numClasses', parseInt(e.target.value) || null)}
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.config.multiSelect || false}
                        onChange={(e) => handleConfigChange('multiSelect', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={isSubmitting}
                      />
                      Allow Multi-Select
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label Names (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.config.labelNames || ''}
                      onChange={(e) => handleConfigChange('labelNames', e.target.value)}
                      placeholder="e.g., cat, dog, bird"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Object Detection Settings */}
          {formData.annotation_type === 'object_detection' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bounding Box Format
                </label>
                <select
                  value={formData.config.boxFormat || 'coco'}
                  onChange={(e) => handleConfigChange('boxFormat', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="coco">COCO</option>
                  <option value="pascal_voc">Pascal VOC</option>
                  <option value="yolo">YOLO</option>
                </select>
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Predefined Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.config.predefinedLabels || ''}
                      onChange={(e) => handleConfigChange('predefinedLabels', e.target.value)}
                      placeholder="e.g., person, car, building"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Object Size (pixels)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.config.minObjectSize || ''}
                      onChange={(e) => handleConfigChange('minObjectSize', parseInt(e.target.value) || null)}
                      placeholder="e.g., 32"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Video Annotation Settings */}
          {formData.annotation_type === 'video_annotation' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeline Format
                </label>
                <select
                  value={formData.config.timelineFormat || 'seconds'}
                  onChange={(e) => handleConfigChange('timelineFormat', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="seconds">Seconds</option>
                  <option value="frames">Frames</option>
                </select>
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annotation Granularity
                    </label>
                    <select
                      value={formData.config.granularity || 'second'}
                      onChange={(e) => handleConfigChange('granularity', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="clip">Clip</option>
                      <option value="frame">Frame</option>
                      <option value="second">Second</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.config.enableTrackIds || false}
                        onChange={(e) => handleConfigChange('enableTrackIds', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={isSubmitting}
                      />
                      Enable Track IDs
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Audio Annotation Settings */}
          {formData.annotation_type === 'audio_annotation' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.config.showWaveform || true}
                    onChange={(e) => handleConfigChange('showWaveform', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={isSubmitting}
                  />
                  Show Waveform Visualization
                </label>
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timestamp Precision
                    </label>
                    <select
                      value={formData.config.timestampPrecision || 'millisecond'}
                      onChange={(e) => handleConfigChange('timestampPrecision', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="second">Second</option>
                      <option value="millisecond">Millisecond</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Segment Duration Limit (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.config.segmentDuration || ''}
                      onChange={(e) => handleConfigChange('segmentDuration', parseFloat(e.target.value) || null)}
                      placeholder="e.g., 10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Custom Annotation Settings */}
          {formData.annotation_type === 'custom' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Schema (JSON)
                </label>
                <textarea
                  value={formData.config.customSchema || ''}
                  onChange={(e) => handleConfigChange('customSchema', e.target.value)}
                  placeholder='{"fields": [{"name": "label", "type": "string"}]}'
                  rows={8}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm ${
                    errors.customSchema ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.customSchema && (
                  <p className="mt-1 text-sm text-red-600">{errors.customSchema}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter a valid JSON schema for your custom annotation type
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          {showAdvanced && (
            <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                These advanced settings allow you to customize the annotation behavior for this specific project.
                You can modify these settings later from the project edit page.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
            </>
          ) : (
            <span>{isEditMode ? 'Update Project' : 'Create Project'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;