import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Building, MapPin, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AddPartnerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PartnerFormData {
  partner_id: string;
  partner_name: string;
  name: string;
  partner_city_id: string;
  city: string;
  location: string;
  email?: string;
  phone?: string;
  cooperation_status: string;
  business_status: string;
  capacity_type: string;
  parent_partner_id?: string;
  partner_company_name_en: string;
  brand_name?: string;
  signer_email?: string;
  legal_email?: string;
  manager_mis_ids?: string;
  region: string;
  is_active: boolean;
}

export function AddPartnerForm({ isOpen, onClose, onSuccess }: AddPartnerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PartnerFormData>({
    defaultValues: {
      is_active: true
    }
  });

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('partners')
        .insert([data]);

      if (error) throw error;

      toast.success('Partner added successfully');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding partner:', error);
      toast.error(error.message || 'Failed to add partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Installation Partner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Partner ID *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('partner_id', { 
                  required: 'Partner ID is required'
                })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter partner ID"
              />
            </div>
            {errors.partner_id && (
              <p className="text-red-600 text-sm mt-1">{errors.partner_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Name *
              </label>
              <input
                {...register('partner_name', { 
                  required: 'Partner name is required',
                  minLength: { value: 2, message: 'Partner name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter partner company name"
              />
              {errors.partner_name && (
                <p className="text-red-600 text-sm mt-1">{errors.partner_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Company Name *
              </label>
              <input
                {...register('partner_company_name_en', { 
                  required: 'English company name is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter English company name"
              />
              {errors.partner_company_name_en && (
                <p className="text-red-600 text-sm mt-1">{errors.partner_company_name_en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City ID *
              </label>
              <input
                {...register('partner_city_id', { 
                  required: 'City ID is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter city ID"
              />
              {errors.partner_city_id && (
                <p className="text-red-600 text-sm mt-1">{errors.partner_city_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                {...register('city', { 
                  required: 'City is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter city name"
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <select
                {...register('region', { 
                  required: 'Region is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select region</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
              </select>
              {errors.region && (
                <p className="text-red-600 text-sm mt-1">{errors.region.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooperation Status *
              </label>
              <select
                {...register('cooperation_status', { 
                  required: 'Cooperation status is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
              {errors.cooperation_status && (
                <p className="text-red-600 text-sm mt-1">{errors.cooperation_status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Status *
              </label>
              <select
                {...register('business_status', { 
                  required: 'Business status is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="Close">Close</option>
                <option value="Open">Open</option>
              </select>
              {errors.business_status && (
                <p className="text-red-600 text-sm mt-1">{errors.business_status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity Type *
              </label>
              <select
                {...register('capacity_type', { 
                  required: 'Capacity type is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select capacity</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Variable">Variable</option>
              </select>
              {errors.capacity_type && (
                <p className="text-red-600 text-sm mt-1">{errors.capacity_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                {...register('brand_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter brand name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Partner ID
              </label>
              <input
                {...register('parent_partner_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter parent partner ID (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location/Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                {...register('location')}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Enter partner location/address (optional)"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signer Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('signer_email', {
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter signer email (optional)"
                />
              </div>
              {errors.signer_email && (
                <p className="text-red-600 text-sm mt-1">{errors.signer_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('legal_email', {
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter legal email (optional)"
                />
              </div>
              {errors.legal_email && (
                <p className="text-red-600 text-sm mt-1">{errors.legal_email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('email', {
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter general contact email (optional)"
              />
            </div>
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('phone', {
                  pattern: {
                    value: /^[0-9+\-\s()]+$/,
                    message: 'Please enter a valid phone number'
                  }
                })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter contact phone number (optional)"
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
            )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager MIS IDs
            </label>
            <input
              {...register('manager_mis_ids')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter manager MIS IDs (comma separated, optional)"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">🎯 Partner Capacity Targets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Target *
                </label>
                <input
                  {...register('car_target', { 
                    required: 'Car target is required',
                    min: { value: 1, message: 'Car target must be at least 1' },
                    max: { value: 1000, message: 'Car target cannot exceed 1000' }
                  })}
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
                {errors.car_target && (
                  <p className="text-red-600 text-sm mt-1">{errors.car_target.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Max car delivery riders</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bike Target *
                </label>
                <input
                  {...register('bike_target', { 
                    required: 'Bike target is required',
                    min: { value: 1, message: 'Bike target must be at least 1' },
                    max: { value: 1000, message: 'Bike target cannot exceed 1000' }
                  })}
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
                {errors.bike_target && (
                  <p className="text-red-600 text-sm mt-1">{errors.bike_target.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Max motorcycle delivery riders</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Target *
                </label>
                <input
                  {...register('total_target', { 
                    required: 'Total target is required',
                    min: { value: 1, message: 'Total target must be at least 1' },
                    max: { value: 2000, message: 'Total target cannot exceed 2000' }
                  })}
                  type="number"
                  min="1"
                  max="2000"
                  defaultValue={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
                {errors.total_target && (
                  <p className="text-red-600 text-sm mt-1">{errors.total_target.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Max total riders</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
              <p className="text-xs text-blue-800">
                <strong>📊 Target Logic:</strong> Scheduled + Completed riders count towards targets. 
                Partners cannot exceed these limits when scheduling training, installation, or equipment collection.
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active partner (available for installations)
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
              {isSubmitting ? 'Adding Partner...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}