import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { User as UserIcon, Eye, EyeOff, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { RoleBadge, ROLE_LABELS } from '../utils/roleHelpers.jsx';
import { userService } from '../services/userService.js';
import { projectService } from '../services/projectService.js';
import { authService } from '../services/authService.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [bioCharCount, setBioCharCount] = useState(0);

  const profileForm = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      bio: ''
    }
  });

  const passwordForm = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      setProfile(currentUser);
      
      const nameParts = currentUser.full_name ? currentUser.full_name.split(' ') : ['', ''];
      profileForm.reset({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        bio: currentUser.bio || ''
      });
      
      // Fetch user's projects
      const userProjects = await projectService.getAllProjects();
      setProjects(userProjects);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const subscription = profileForm.watch((value, { name, type }) => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [profileForm]);

  const handleProfileSave = async (data) => {
    try {
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      await userService.updateUser(user.id, {
        name: fullName,
        bio: data.bio
      });
      toast.success('Profile updated successfully');
      setHasChanges(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (data) => {
    try {
      setPasswordLoading(true);
      
      if (data.new_password !== data.confirm_password) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (data.new_password === data.current_password) {
        toast.error('New password must be different from current password');
        return;
      }
      
      await authService.login(user.email, data.new_password);
      toast.success('Password updated successfully');
      passwordForm.reset();
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    profileForm.reset();
    setHasChanges(false);
  };

  const getAvatarInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-rose-500';
      case 'project_manager': return 'bg-indigo-500';
      case 'reviewer': return 'bg-amber-500';
      case 'annotator': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">View and update your personal details</p>
      </div>

      {/* Profile Card */}
      <div className="card mb-8">
        <div className="flex items-center gap-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white ${getRoleColor(profile?.role)}`}>
            {getAvatarInitials()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.full_name}</h2>
            <div className="flex items-center gap-2 mb-1">
              <RoleBadge role={profile?.role} />
              <span className="text-sm text-gray-600">{profile?.email}</span>
            </div>
            <p className="text-sm text-gray-600">
              Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-6">Personal Details</h3>
        <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              {...profileForm.register('first_name', { required: 'First name is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {profileForm.formState.errors.first_name && (
              <p className="text-sm text-error-600 mt-1">{profileForm.formState.errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              {...profileForm.register('last_name')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              value={profile?.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed. Contact admin to update.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio / About</label>
            <textarea
              {...profileForm.register('bio')}
              rows={4}
              maxLength={300}
              onChange={(e) => setBioCharCount(e.target.value.length)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Write a short bio…"
            />
            <div className="flex justify-between mt-1">
              <span></span>
              <span className="text-sm text-gray-600">{bioCharCount}/300</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!hasChanges}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasChanges}
              className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="card mb-8">
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-xl font-semibold">Change Password</h3>
          {showPasswordSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {showPasswordSection && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('current_password', { required: 'Current password is required' })}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.current_password && (
                  <p className="text-sm text-error-600 mt-1">{passwordForm.formState.errors.current_password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('new_password', { 
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message: 'Password must contain uppercase, lowercase, number, and special character'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-error-600 mt-1">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('confirm_password', { required: 'Please confirm new password' })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-sm text-error-600 mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    passwordForm.reset();
                    setShowPasswordSection(false);
                  }}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Assigned Projects */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">My Projects</h3>
        {projects.length === 0 ? (
          <p className="text-gray-600">You are not assigned to any projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div className="text-sm text-gray-600">
                    {ROLE_LABELS[project.role] || project.role}
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                    {project.status}
                  </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};