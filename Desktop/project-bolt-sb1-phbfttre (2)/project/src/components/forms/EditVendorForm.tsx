import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Building, MapPin, Mail, Clock, Package, Save } from 'lucide-react';
import { supabase, type Vendor } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface EditVendorFormProps {
  isOpen: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface VendorFormData {
  vendor_name: string;
  vendor_email: string;
  location: string;
  boxes_per_hour: number;
  max_boxes_per_day: number;
  is_active: boolean;
  can_login: boolean;
  serviceable_days: string[];
  start_time: string;
  end_time: string;
  break_start_time: string;
  break_end_time: string;
  timezone: string;
  is_available_weekends: boolean;
  special_notes: string;
}

export function EditVendorForm({ isOpen, vendor, onClose, onSuccess }: EditVendorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<VendorFormData>();

  useEffect(() => {
    if (vendor && isOpen) {
      setValue('vendor_name', vendor.vendor_name);
      setValue('vendor_email', vendor.vendor_email || '');
      setValue('location', vendor.location);
      setValue('boxes_per_hour', vendor.boxes_per_hour);
      setValue('max_boxes_per_day', vendor.max_boxes_per_day);
      setValue('is_active', vendor.is_active);
      setValue('can_login', vendor.can_login);
      setValue('serviceable_days', vendor.serviceable_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
      setValue('start_time', (vendor.start_time || '08:00').slice(0, 5));
      setValue('end_time', (vendor.end_time || '18:00').slice(0, 5));
      setValue('break_start_time', (vendor.break_start_time || '12:00').slice(0, 5));
      setValue('break_end_time', (vendor.break_end_time || '13:00').slice(0, 5));
      setValue('timezone', vendor.timezone || 'Asia/Qatar');
      setValue('is_available_weekends', vendor.is_available_weekends || false);
      setValue('special_notes', vendor.special_notes || '');
    }
  }, [vendor, isOpen, setValue]);

  const onSubmit = async (data: VendorFormData) => {
    if (!vendor) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: data.vendor_name,
          vendor_email: data.vendor_email || null,
          location: data.location,
          boxes_per_hour: data.boxes_per_hour,
          max_boxes_per_day: data.max_boxes_per_day,
          is_active: data.is_active,
          can_login: data.can_login,
          serviceable_days: data.serviceable_days,
          start_time: data.start_time,
          end_time: data.end_time,
          break_start_time: data.break_start_time || null,
          break_end_time: data.break_end_time || null,
          timezone: data.timezone,
          is_available_weekends: data.is_available_weekends,
          special_notes: data.special_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast.success('Vendor updated successfully');
      reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      toast.error(error.message || 'Failed to update vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Vendor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Display auto-generated vendor ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor ID * <span className="text-xs text-gray-500">(Cannot be changed)</span>
            </label>
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded border">
                {vendor?.vendor_id || 'Not Set'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              {...register('vendor_name', { 
                required: 'Vendor name is required',
                minLength: { value: 2, message: 'Vendor name must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter vendor company name"
            />
            {errors.vendor_name && (
              <p className="text-red-600 text-sm mt-1">{errors.vendor_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Email * <span className="text-xs text-gray-500">(Primary identifier, cannot be changed)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('vendor_email', {
                  required: 'Vendor email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                disabled
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                placeholder="Vendor email (cannot be changed)"
              />
            </div>
            {errors.vendor_email && (
              <p className="text-red-600 text-sm mt-1">{errors.vendor_email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                {...register('location', { 
                  required: 'Location is required',
                  minLength: { value: 5, message: 'Please provide a detailed location' }
                })}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Enter vendor location/address"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boxes Per Hour *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('boxes_per_hour', { 
                    required: 'Boxes per hour is required',
                    min: { value: 1, message: 'Must be at least 1 box per hour' },
                    max: { value: 10, message: 'Maximum 10 boxes per hour' }
                  })}
                  type="number"
                  min="1"
                  max="10"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="2"
                />
              </div>
              {errors.boxes_per_hour && (
                <p className="text-red-600 text-sm mt-1">{errors.boxes_per_hour.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Installation rate per hour</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Boxes Per Day *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('max_boxes_per_day', { 
                    required: 'Max boxes per day is required',
                    min: { value: 1, message: 'Must be at least 1 box per day' },
                    max: { value: 200, message: 'Maximum 200 boxes per day' }
                  })}
                  type="number"
                  min="1"
                  max="200"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="16"
                />
              </div>
              {errors.max_boxes_per_day && (
                <p className="text-red-600 text-sm mt-1">{errors.max_boxes_per_day.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Maximum daily capacity</p>
            </div>
          </div>

          {/* Serviceable Timings Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-3">⏰ Service Hours & Availability</h3>
            
            {/* Working Days */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <label key={day} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      value={day}
                      {...register('serviceable_days')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  {...register('start_time', { required: 'Start time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.start_time && (
                  <p className="text-red-600 text-sm mt-1">{errors.start_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  {...register('end_time', { required: 'End time is required' })}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.end_time && (
                  <p className="text-red-600 text-sm mt-1">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            {/* Break Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Break Start Time
                </label>
                <input
                  {...register('break_start_time')}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Break End Time
                </label>
                <input
                  {...register('break_end_time')}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone *
              </label>
              <select
                {...register('timezone', { required: 'Timezone is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Asia/Qatar">Asia/Qatar (GMT+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                <option value="Asia/Kuwait">Asia/Kuwait (GMT+3)</option>
                <option value="Asia/Bahrain">Asia/Bahrain (GMT+3)</option>
              </select>
              {errors.timezone && (
                <p className="text-red-600 text-sm mt-1">{errors.timezone.message}</p>
              )}
            </div>

            {/* Special Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Notes
              </label>
              <textarea
                {...register('special_notes')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Any special timing notes or availability restrictions..."
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('is_available_weekends')}
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Available on weekends (Saturday & Sunday)
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active vendor (available for box installations)
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...register('can_login')}
              type="checkbox"
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Can login to vendor portal
            </label>
          </div>

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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Vendor'}</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}