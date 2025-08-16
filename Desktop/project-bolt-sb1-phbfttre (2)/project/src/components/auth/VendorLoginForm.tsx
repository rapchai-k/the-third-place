import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface VendorLoginFormData {
  email: string;
  password: string;
}

interface VendorLoginFormProps {
  onLoginSuccess: () => void;
}

export function VendorLoginForm({ onLoginSuccess }: VendorLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorLoginFormData>();

  const onSubmit = async (data: VendorLoginFormData) => {
    setIsLoading(true);
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        toast.error('Invalid email or password');
        return;
      }

      // Verify this is a vendor account
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('vendor_email', data.email)
        .eq('can_login', true)
        .eq('is_active', true)
        .maybeSingle();

      if (vendorError || !vendorData) {
        await supabase.auth.signOut();
        toast.error('Access denied. This email is not registered as an active vendor.');
        return;
      }

      // Check if user profile exists, create if needed
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .eq('role', 'vendor')
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking user profile:', userError);
      }

      if (!userProfile) {
        // Create user profile for vendor
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: data.email,
            role: 'vendor',
            first_name: vendorData.vendor_name.split(' ')[0] || 'Vendor',
            last_name: vendorData.vendor_name.split(' ').slice(1).join(' ') || 'User',
            vendor_id: vendorData.vendor_id,
            is_active: true
          }]);

        if (createUserError) {
          console.error('Error creating user profile:', createUserError);
        }
      }
      // Update last login
      await supabase
        .from('vendors')
        .update({ last_login: new Date().toISOString() })
        .eq('id', vendorData.id);

      toast.success(`Welcome back, ${vendorData.vendor_name}!`);
      onLoginSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full mb-4">
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Vendor Portal</h2>
            <p className="text-gray-600 mt-2">Box Installation Management</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Enter your vendor email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In to Vendor Portal'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 text-sm mb-2">🚛 Vendor Portal Features:</h4>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• View assigned box installations</li>
              <li>• Update installation status and progress</li>
              <li>• Upload proof of completion photos</li>
              <li>• Receive automatic email notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}