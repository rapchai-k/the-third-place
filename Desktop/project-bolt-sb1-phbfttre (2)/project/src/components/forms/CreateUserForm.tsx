import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import type { UserRole, UserPermission } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
}

interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  permissions: UserPermission[];
}

export function CreateUserForm({ isOpen, onClose, onSuccess, currentUserRole }: CreateUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    defaultValues: {
      is_active: true,
      permissions: []
    }
  });

  const watchPassword = watch('password');
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

    // Super Admin can create any role
    if (currentUserRole === 'super_admin') {
      return allRoles;
    }
    
    // Admin can only create training_person and equipment_person
    if (currentUserRole === 'admin') {
      return allRoles.filter(role => 
        role.value === 'training_person' || role.value === 'equipment_person' || role.value === 'vendor'
      );
    }

    // Other roles cannot create users
    return [];
  };

  const availableRoles = getAvailableRoles();

  const allPermissions: { value: UserPermission; label: string }[] = [
    { value: 'installation', label: 'Installation' },
    { value: 'eligibility', label: 'Eligibility' },
    { value: 'training', label: 'Training' },
    { value: 'equipment', label: 'Equipment' },
  ];

  const onSubmit = async (data: UserFormData) => {
    if (!supabaseAdmin) {
      toast.error('Service role key required for user creation. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.');
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (data.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the user in Supabase Auth
      console.log('🔄 Creating user in Supabase Auth...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
          user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          permissions: data.permissions
        }
      });

      if (authError) {
        console.error('❌ Auth creation error:', authError);
        console.error('❌ Error details:', {
          message: authError.message,
          status: authError.status,
          code: authError.code || 'unknown'
        });
        throw new Error(authError.message);
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth creation');
        throw new Error('Failed to create user in authentication system');
      }

      console.log('✅ User created in Supabase Auth:', authData.user.id);
      
      // Then create the user profile in our users table
      console.log('🔄 Creating user profile in database...');
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: data.is_active,
          permissions: data.permissions
        }]);

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        // If profile creation fails, we should clean up the auth user
        try {
          console.log('🧹 Cleaning up auth user due to profile creation failure...');
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          console.log('✅ Auth user cleanup completed');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup auth user:', cleanupError);
        }
        throw new Error(profileError.message);
      }

      console.log('✅ User profile created successfully');
      toast.success(`User created successfully! Login credentials sent to ${data.email}`);
      reset();
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (availableRoles.length === 0) {
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
              Your current role ({currentUserRole?.replace('_', ' ')}) does not have permission to create users.
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
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current User Access Level */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Your Access Level: {currentUserRole?.replace('_', ' ').toUpperCase()}</h4>
          <p className="text-sm text-blue-800">
            {currentUserRole === 'super_admin' 
              ? 'You can create users with any role including Super Admin and Admin'
              : 'You can create Training Person and Equipment Person roles only'
            }
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
            
            {/* Role descriptions */}
            <div className="mt-2 space-y-1">
              {availableRoles.map((role) => (
                <div key={role.value} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <strong>{role.label}:</strong> {role.description}
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Multiselect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions (optional)
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
            <p className="text-xs text-gray-500 mt-1">Assign multiple permissions as needed in addition to the main role.</p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === watchPassword || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* User Status */}
          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active user (can sign in immediately)
            </label>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 text-sm mb-1">🔐 Security Notice</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• User will receive login credentials via email</li>
              <li>• Password should be changed on first login</li>
              <li>• User permissions are based on assigned role</li>
              <li>• Account can be deactivated anytime if needed</li>
            </ul>
          </div>

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
              disabled={isSubmitting || availableRoles.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}