import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, User as UserIcon, Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { userService } from '../../services/userService.js';
import { getSubTypeOptions } from '../../features/text-annotation/constants.js';
import LabelEditor from './LabelEditor.jsx';
import { assignmentService } from '../../services/assignmentService.js';
import toast from 'react-hot-toast';

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
  
  // Multi-level reviewer chain state (now available in both create and edit modes)
  const [reviewerChain, setReviewerChain] = useState([]);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [savingReviewers, setSavingReviewers] = useState(false);

  // Fetch available managers and reviewers
  useEffect(() => {
    // Always fetch available reviewers (for both create and edit modes)
    fetchAvailableReviewersList();
    
    if (isEditMode) {
      fetchAvailableManagers();
      fetchExistingReviewers();
    }
  }, [isEditMode, project?.id]);
  
  // Fetch existing reviewers for this project (edit mode)
  const fetchExistingReviewers = async () => {
    if (!project?.id) return;
    try {
      setLoadingReviewers(true);
      const response = await assignmentService.getReviewerChain(project.id);
      // Sort by review_level
      const sorted = (response.data || []).sort((a, b) => a.review_level - b.review_level);
      setReviewerChain(sorted);
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
    } finally {
      setLoadingReviewers(false);
    }
  };
  
  // Fetch available reviewers (users who can be assigned as reviewers)
  const fetchAvailableReviewersList = async () => {
    try {
      const response = await userService.getAllUsers();
      // Filter for users who can be reviewers (reviewer role, admin, or project_manager)
      const reviewers = response.data.filter(user => 
        user.role === 'reviewer' || user.role === 'admin' || user.role === 'project_manager'
      );
      setAvailableReviewers(reviewers);
    } catch (error) {
      console.error('Failed to fetch available reviewers:', error);
    }
  };
  
  // Add a reviewer to the chain
  const handleAddReviewerToChain = () => {
    const newLevel = reviewerChain.length + 1;
    setReviewerChain([...reviewerChain, { user_id: null, review_level: newLevel, user: null }]);
  };
  
  // Remove a reviewer from the chain
  const handleRemoveReviewerFromChain = (index) => {
    const updated = reviewerChain.filter((_, i) => i !== index);
    // Re-index levels
    setReviewerChain(updated.map((r, i) => ({ ...r, review_level: i + 1 })));
  };
  
  // Update reviewer at a specific index
  const handleUpdateReviewerInChain = (index, userId) => {
    const user = availableReviewers.find(u => u.id === parseInt(userId));
    const updated = [...reviewerChain];
    updated[index] = {
      ...updated[index],
      user_id: parseInt(userId),
      user: user
    };
    setReviewerChain(updated);
  };
  
  // Move reviewer up in chain
  const handleMoveReviewerUp = (index) => {
    if (index === 0) return;
    const updated = [...reviewerChain];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Re-index levels
    setReviewerChain(updated.map((r, i) => ({ ...r, review_level: i + 1 })));
  };
  
  // Move reviewer down in chain
  const handleMoveReviewerDown = (index) => {
    if (index === reviewerChain.length - 1) return;
    const updated = [...reviewerChain];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Re-index levels
    setReviewerChain(updated.map((r, i) => ({ ...r, review_level: i + 1 })));
  };
  
  // Save reviewer chain
  const handleSaveReviewerChain = async () => {
    if (!project?.id) return;
    
    // Validate all reviewers are selected
    const hasEmptySlots = reviewerChain.some(r => !r.user_id);
    if (hasEmptySlots) {
      toast.error('Please select a reviewer for each level');
      return;
    }
    
    setSavingReviewers(true);
    try {
      await assignmentService.updateReviewerChain(project.id, reviewerChain);
      toast.success('Reviewer chain updated successfully');
      fetchExistingReviewers();
    } catch (error) {
      toast.error('Failed to update reviewer chain');
    } finally {
      setSavingReviewers(false);
    }
  };

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
    { value: 'image', label: 'Image Annotation' },
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
  const handleSubmit = async (e) => {
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

    // For create mode, pass the reviewer chain as well
    if (!isEditMode && reviewerChain.length > 0) {
      submitData.reviewer_chain = reviewerChain
        .filter(r => r.user_id) // Only include reviewers with selected users
        .map(r => ({
          user_id: r.user_id,
          review_level: r.review_level
        }));
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

        {/* Multi-Level Reviewer Chain (Available in both Create and Edit modes) */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Reviewer Chain (Multi-Level Review)
            </h4>
            <button
              type="button"
              onClick={handleAddReviewerToChain}
              disabled={isSubmitting || loadingReviewers}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Level
            </button>
          </div>
          
          {loadingReviewers && isEditMode ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Loading reviewers...</span>
            </div>
          ) : reviewerChain.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No reviewers assigned yet.</p>
              <p className="text-xs text-gray-400">Click "Add Level" to create a review chain.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewerChain.map((reviewer, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  {/* Level Badge */}
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {reviewer.review_level}
                  </div>
                  
                  {/* Grip Handle */}
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  
                  {/* User Dropdown */}
                  <select
                    value={reviewer.user_id || ''}
                    onChange={(e) => handleUpdateReviewerInChain(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a reviewer...</option>
                    {availableReviewers
                      .filter(u => {
                        // Allow if user is already selected for this slot
                        if (u.id === reviewer.user_id) return true;
                        // Exclude users already assigned to other levels
                        const assignedIds = reviewerChain
                          .filter((_, i) => i !== index)
                          .map(r => r.user_id);
                        return !assignedIds.includes(u.id);
                      })
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.role})
                        </option>
                      ))}
                  </select>
                  
                  {/* Up/Down Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveReviewerUp(index)}
                      disabled={index === 0 || isSubmitting}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveReviewerDown(index)}
                      disabled={index === reviewerChain.length - 1 || isSubmitting}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveReviewerFromChain(index)}
                    disabled={isSubmitting}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-30"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Save Button (only in edit mode) */}
              {isEditMode && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <p className="text-xs text-gray-500 flex-1">
                    <Info className="w-3 h-3 inline mr-1" />
                    Reviewers will review in order: Level 1 → Level 2 → ... → Final Approval
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveReviewerChain}
                    disabled={savingReviewers || reviewerChain.some(r => !r.user_id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingReviewers ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      'Save Reviewer Chain'
                    )}
                  </button>
                </div>
              )}
              
              {/* Info for create mode */}
              {!isEditMode && (
                <p className="text-xs text-gray-500 pt-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  Reviewers will be assigned after project creation. They will review in order: Level 1 → Level 2 → ... → Final Approval
                </p>
              )}
            </div>
          )}
          
          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> When an annotator submits work, it goes to Level 1 reviewer first. 
              After approval, it moves to Level 2, and so on. If any reviewer rejects, the work goes back to the previous level (or annotator if at Level 1).
            </p>
          </div>
        </div>

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

      {/* Resource Provider Setting - Show when annotation type is selected */}
      {formData.annotation_type && (
        <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who will provide the annotation resources?
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="resource_provider"
                value="annotator"
                checked={(formData.config.resource_provider || 'annotator') === 'annotator'}
                onChange={() => handleConfigChange('resource_provider', 'annotator')}
                className="mt-1 text-primary-600 focus:ring-primary-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Annotators upload their own</span>
                <p className="text-xs text-gray-500">Each annotator uploads their own files (text/images) to annotate</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="resource_provider"
                value="project_manager"
                checked={formData.config.resource_provider === 'project_manager'}
                onChange={() => handleConfigChange('resource_provider', 'project_manager')}
                className="mt-1 text-primary-600 focus:ring-primary-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Project Manager provides resources</span>
                <p className="text-xs text-gray-500">PM uploads resources to a shared pool. Annotators work from the pool (one at a time)</p>
              </div>
            </label>
          </div>
          <p className="mt-2 text-xs text-amber-700">
            <Info className="w-3 h-3 inline mr-1" />
            This setting cannot be changed after resources are added to the project
          </p>
        </div>
      )}

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
            <div className={showAdvanced ? 'space-y-6' : 'space-y-6'}>
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

              {/* Classification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification Type
                </label>
                <select
                  value={formData.config.classificationType || 'multi_class'}
                  onChange={(e) => handleConfigChange('classificationType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="binary">Binary (2 classes, mutually exclusive)</option>
                  <option value="multi_class">Multi-Class (3+ classes, mutually exclusive)</option>
                  <option value="multi_label">Multi-Label (3+ classes, can select multiple)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Determines how labels are selected during annotation
                </p>
              </div>

              {/* Label Configuration - Always visible for text annotation */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Label Palette Configuration
                </h4>
                <LabelEditor
                  textSubType={formData.config.textSubType}
                  config={formData.config}
                  onConfigChange={handleConfigChange}
                  isSubmitting={isSubmitting}
                />
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

          {/* Image Annotation Settings */}
          {formData.annotation_type === 'image' && (
            <div className={showAdvanced ? 'space-y-4' : 'space-y-4'}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annotation Tools
                </label>
                <div className="space-y-2">
                  {['bounding_box', 'polygon', 'keypoint'].map(tool => (
                    <label key={tool} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.config.enabledTools?.includes(tool) || false}
                        onChange={(e) => {
                          const tools = formData.config.enabledTools || [];
                          if (e.target.checked) {
                            handleConfigChange('enabledTools', [...tools, tool]);
                          } else {
                            handleConfigChange('enabledTools', tools.filter(t => t !== tool));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={isSubmitting}
                      />
                      {tool === 'bounding_box' ? 'Bounding Box' : 
                       tool === 'polygon' ? 'Polygon' : 'Keypoint'}
                    </label>
                  ))}
                </div>
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.config.labels || ''}
                      onChange={(e) => handleConfigChange('labels', e.target.value)}
                      placeholder="e.g., person, car, dog"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.config.allowMultipleShapes || true}
                        onChange={(e) => handleConfigChange('allowMultipleShapes', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={isSubmitting}
                      />
                      Allow Multiple Shapes per Image
                    </label>
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