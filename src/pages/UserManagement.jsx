import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Search, 
  Plus, 
  Edit, 
  MoreVertical, 
  Trash2, 
  User as UserIcon,
  X,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { RoleBadge, ROLE_OPTIONS } from '../utils/roleHelpers.jsx';
import { userService } from '../services/userService.js';
import { projectService } from '../services/projectService.js';
import { assignmentService } from '../services/assignmentService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        page,
        limit: 10
      };
      const response = await userService.getAllUsers(params);
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const projects = await projectService.getAllProjects();
      setAvailableProjects(projects);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, page]);

  useEffect(() => {
    if (showAssignModal) {
      fetchProjects();
    }
  }, [showAssignModal]);

  // Create User Form
  const createForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'annotator'
    }
  });

  const onCreateSubmit = async (data) => {
    try {
      if (data.password !== data.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      await userService.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });
      toast.success('User created successfully');
      setShowCreateModal(false);
      createForm.reset();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  // Edit User Form
  const editForm = useForm();

  useEffect(() => {
    if (selectedUser) {
      editForm.reset({
        name: selectedUser.full_name,
        email: selectedUser.email,
        role: selectedUser.role,
        is_active: selectedUser.is_active
      });
    }
  }, [selectedUser, editForm]);

  const onEditSubmit = async (data) => {
    try {
      await userService.updateUser(selectedUser.id, {
        name: data.name,
        role: data.role,
        is_active: data.is_active
      });
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Assign to Projects
  const handleAssignProjects = async () => {
    try {
      let count = 0;
      for (const [projectId, role] of Object.entries(selectedProjects)) {
        if (role && role !== '') {
          if (role === 'reviewer') {
            await assignmentService.addReviewer(parseInt(projectId), selectedUser.id);
          } else if (role === 'annotator') {
            await assignmentService.addAnnotator(parseInt(projectId), selectedUser.id);
          }
          count++;
        }
      }
      toast.success(`Assigned to ${count} project(s)`);
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedProjects({});
    } catch (error) {
      toast.error('Failed to assign projects');
    }
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => {
      if (prev[projectId]) {
        const { [projectId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [projectId]: 'annotator' };
    });
  };

  const getAvatarInitials = (name, email) => {
    const displayName = name || email;
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Create, manage, and assign users to projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">Showing {users.length} users</span>
        </div>
      </div>

      {/* User Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                      user.role === 'admin' ? 'bg-rose-500' :
                      user.role === 'project_manager' ? 'bg-indigo-500' :
                      user.role === 'reviewer' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {getAvatarInitials(user.full_name, user.email)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {user.assignments?.length || 0} project(s)
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAssignModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Assign to Project"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-error-600 hover:bg-error-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={users.length < 10}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};