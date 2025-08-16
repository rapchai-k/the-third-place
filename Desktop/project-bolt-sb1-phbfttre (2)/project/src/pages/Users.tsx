import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { CreateUserForm } from '../components/forms/CreateUserForm';
import { EditUserForm } from '../components/forms/EditUserForm';
import { supabase, type User } from '../lib/supabase';
import { Plus, User as UserIcon, Shield, Calendar, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setShowEditForm(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Prevent self-deletion
    if (userId === user?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${userEmail}"?\n\nThis action cannot be undone and will permanently remove the user from the system.`;
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training_person':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'equipment_person':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'vendor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Full system access, user management, all operations';
      case 'admin':
        return 'User management (limited), data operations, reports';
      case 'training_person':
        return 'Training scheduling and management only';
      case 'equipment_person':
        return 'Box installation and equipment distribution only';
      case 'vendor':
        return 'Box installation portal access only';
      default:
        return 'No permissions defined';
    }
  };

  const renderUserPermissions = (row: User) => {
    const perms = row.permissions || [];
    if (perms.length === 0) return <span className="text-xs text-gray-500">No extra permissions</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {perms.map((p) => (
          <span key={p} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-gray-100 border border-gray-200 text-gray-700">
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        ))}
      </div>
    );
  };

  const canCreateUser = () => {
    return user?.role === 'super_admin' || user?.role === 'admin';
  };

  const canEditUser = (targetUser: User) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin') {
      // Admin can edit training_person and equipment_person, but not super_admin or other admins
      return targetUser.role === 'training_person' || targetUser.role === 'equipment_person' || targetUser.role === 'vendor';
    }
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    if (targetUser.id === user?.id) return false; // Cannot delete self
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin') {
      // Admin can delete training_person and equipment_person, but not super_admin or other admins
      return targetUser.role === 'training_person' || targetUser.role === 'equipment_person' || targetUser.role === 'vendor';
    }
    return false;
  };

  const columns = [
    {
      key: 'user_info',
      label: 'User Information',
      sortable: true,
      render: (value: string, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-sm text-gray-600">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role & Permissions',
      sortable: true,
      render: (value: string, row: User) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getRoleColor(value)}`}>
              {value.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-600 max-w-xs">
            {getRolePermissions(value)}
          </p>
          {renderUserPermissions(row)}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean, row: User) => (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
          {(user?.role === 'super_admin' || canEditUser(row)) && (
            <button
              onClick={() => handleToggleUserStatus(row.id, value)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={value ? 'Deactivate user' : 'Activate user'}
            >
              {value ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{new Date(value).toLocaleDateString()}</p>
            <p className="text-xs text-gray-600">{new Date(value).toLocaleTimeString()}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: User) => (
        <div className="flex items-center space-x-2">
          {canEditUser(row) && (
            <button
              onClick={() => handleEditUser(row)}
              className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
              title="Edit user"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDeleteUser(row) && (
            <button
              onClick={() => handleDeleteUser(row.id, row.email)}
              className="p-1 text-red-600 hover:text-red-700 transition-colors"
              title="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their role-based permissions</p>
          
          {/* Role-based access info */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔐 Your Access Level: {user?.role?.replace('_', ' ').toUpperCase()}</h4>
            <div className="text-sm text-blue-800">
              {user?.role === 'super_admin' && (
                <p><strong>Full Access:</strong> Create, edit, and delete all user types including admins</p>
              )}
              {user?.role === 'admin' && (
                <p><strong>Limited Access:</strong> Create and manage Training Person and Equipment Person roles only</p>
              )}
            </div>
          </div>
        </div>
        
        {canCreateUser() && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Training Staff</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'training_person').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Equipment Staff</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'equipment_person').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendors</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.filter(u => u.role === 'vendor').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Permission</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-purple-700">Super Admin</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-blue-700">Admin</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-green-700">Training Person</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-orange-700">Equipment Person</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Create Super Admin</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Create Admin</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Create Training/Equipment Staff</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Create Vendor Users</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Training Management</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Box Installation & Equipment</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3 text-gray-900">Box Installation Portal Only</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-gray-900">Data Upload & Reports</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-green-600">✓</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
                <td className="text-center py-2 px-3 text-red-600">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchable
        pagination
        pageSize={20}
      />

      <CreateUserForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          fetchUsers();
        }}
        currentUserRole={user?.role || 'admin'}
      />

      <EditUserForm
        isOpen={showEditForm}
        user={selectedUser}
        onClose={() => {
          setShowEditForm(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setSelectedUser(null);
          fetchUsers();
        }}
        currentUserRole={user?.role || 'admin'}
      />
    </div>
  );
}