import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Shield, Save } from 'lucide-react';
import { supabase, supabaseAdmin, type User as UserType } from '../../lib/supabase';
import type { UserRole, UserPermission } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface EditUserFormProps {
  isOpen: boolean;
  user: UserType | null;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  permissions: UserPermission[];
}

export function EditUserForm({ isOpen, user: userToEdit, onClose, onSuccess, currentUserRole }: EditUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>();

  useEffect(() => {
    if (userToEdit && isOpen) {
      setValue('email', userToEdit.email);
      setValue('first_name', userToEdit.first_name);
      setValue('last_name', userToEdit.last_name);
      setValue('role', userToEdit.role);
      setValue('is_active', userToEdit.is_active);
      setValue('permissions', userToEdit.permissions || []);
    }
  }, [userToEdit, isOpen, setValue]);

  const getAvailableRoles = (): { value: UserRole; label: string; description: string }[] => {
    const allRoles = [
      {
        value: 'super_admin' as UserRole,
        label: 'Super Admin',
        description: 'Full system access, can create any user type'
      },
      {
        value: 'admin' as UserRole,
        label: 'Admin',
        description: 'Can create training/equipment staff, manage data'
      },
      {
        value: 'training_person' as UserRole,
        label: 'Training Person',
        description: 'Can only manage training schedules and sessions'
      },
      {
        value: 'equipment_person' as UserRole,
        label: 'Equipment Person',
        description: 'Can only manage box installation and equipment distribution'
      },
      {
        value: 'vendor' as UserRole,
        label: 'Vendor',
        description: 'Can only access box installation portal and update status'
      }
    ];

    // Super Admin can edit any role
    if (currentUserRole === 'super_admin') {
      return allRoles;
    }
    
    // Admin can only edit training_person and equipment_person
    if (currentUserRole === 'admin') {
      return allRoles.filter(role => 
        role.value === 'training_person' || role.value === 'equipment_person' || role.value === 'vendor'
      );
    }

    // Other roles cannot edit users
    return [];
  };

  const availableRoles = getAvailableRoles();

  const allPermissions: { value: UserPermission; label: string }[] = [
    { value: 'installation', label: 'Installation' },
    { value: 'eligibility', label: 'Eligibility' },
    { value: 'training', label: 'Training' },
    { value: 'equipment', label: 'Equipment' },
  ];

  const selectedPermissions = watch('permissions', []);
  const togglePermission = (perm: UserPermission) => {
    const current = selectedPermissions || [];
    if (current.includes(perm)) {
      setValue('permissions', current.filter((p: UserPermission) => p !== perm));
    } else {
      setValue('permissions', [...current, perm]);
    }
  };

  // Ensure react-hook-form tracks permissions field
  React.useEffect(() => {
    // @ts-expect-error register side-effect for non-input field
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    (register as any)('permissions');
  }, [register]);

  const canEditThisUser = () => {
    if (!userToEdit) return false;
    
    if (currentUserRole === 'super_admin') return true;
    if (currentUserRole === 'admin') {
      return userToEdit.role === 'training_person' || userToEdit.role === 'equipment_person';
    }
    return false;
  };

  const onSubmit = async (data: UserFormData) => {
    if (!userToEdit) return;

    setIsSubmitting(true);
    try {
      // Update user profile in our users table
      const { error } = await supabase
        .from('users')
        .update({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: data.is_active,
          permissions: data.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userToEdit.id);

      if (error) throw error;

      // Update auth user metadata if email changed
      if (data.email !== userToEdit.email) {
        if (supabaseAdmin) {
          console.log('🔄 Updating auth user metadata for:', userToEdit.id);
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userToEdit.id,
            {
              email: data.email,
              user_metadata: {
                first_name: data.first_name,
                last_name: data.last_name,
                role: data.role,
                permissions: data.permissions
              }
            }
          );

          if (authError) {
            console.warn('Failed to update auth user metadata:', authError);
            toast.error('User profile updated, but email change may require manual verification');
            // Don't fail the entire operation for metadata update
          }
        } else {
          console.warn('Admin client not available for auth metadata update - email change skipped');
          toast.error('User profile updated, but email change requires admin privileges');
        }
      }

      toast.success('User updated successfully');
      reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !userToEdit) return null;

  if (!canEditThisUser()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Permissions</h3>
            <p className="text-gray-600 mb-4">
              You cannot edit this user. Your role ({currentUserRole?.replace('_', ' ')}) does not have permission to edit {userToEdit.role?.replace('_', ' ')} users.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current User Access Level */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Editing: {userToEdit.first_name} {userToEdit.last_name}</h4>
          <p className="text-sm text-blue-800">
            Current Role: {userToEdit.role?.replace('_', ' ').toUpperCase()}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                {...register('first_name', { 
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                {...register('last_name', { 
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select user role</option>
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Permissions Multiselect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map((perm) => (
                <label key={perm.value} className="flex items-center space-x-2 p-2 border rounded-md">
                  <input
                    type="checkbox"
                    checked={selectedPermissions?.includes(perm.value) || false}
                    onChange={() => togglePermission(perm.value)}
                  />
                  <span className="text-sm text-gray-800">{perm.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select multiple permissions as needed in addition to the main role.</p>
          </div>

          {/* User Status */}
          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active user (can sign in to the system)
            </label>
          </div>

          {/* Role Change Warning */}
          {currentUserRole === 'admin' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 text-sm mb-1">⚠️ Role Restrictions</h4>
              <p className="text-xs text-orange-700">
                As an Admin, you can only assign Training Person or Equipment Person roles. 
                Contact a Super Admin to assign Admin or Super Admin roles.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update User'}</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}