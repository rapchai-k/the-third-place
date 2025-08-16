import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Phone, Mail, Truck, MapPin, CreditCard, Building, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { cleanRiderData } from '../../utils/dataCleanup';
import { applyEligibilityLogic } from '../../utils/eligibilityLogic';
import toast from 'react-hot-toast';

interface CreateRiderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RiderFormData {
  rider_id: string;
  rider_name: string;
  mobile: string;
  city_id: string;
  partner_id: string;
  nationality_code: string;
  resident_type: string;
  partner_company_name_en: string;
  identity_card_number: string;
  vehicle_number: string;
  delivery_type: string;
  audit_status: string;
  job_status: string;
}

export function CreateRiderForm({ isOpen, onClose, onSuccess }: CreateRiderFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingRiderId, setCheckingRiderId] = useState(false);
  const [riderIdExists, setRiderIdExists] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm<RiderFormData>();

  const watchedRiderId = watch('rider_id');

  // Check if rider ID already exists
  const checkRiderIdUnique = async (riderId: string) => {
    if (!riderId || riderId.length < 3) return;
    
    setCheckingRiderId(true);
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('rider_id')
        .eq('rider_id', riderId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRiderIdExists(true);
        setError('rider_id', { 
          type: 'manual', 
          message: 'This Rider ID already exists. Please use a different ID.' 
        });
      } else {
        setRiderIdExists(false);
        clearErrors('rider_id');
      }
    } catch (error) {
      console.error('Error checking rider ID:', error);
      setRiderIdExists(false);
      clearErrors('rider_id');
    } finally {
      setCheckingRiderId(false);
    }
  };

  // Debounced rider ID check
  React.useEffect(() => {
    if (watchedRiderId) {
      const timeoutId = setTimeout(() => {
        checkRiderIdUnique(watchedRiderId);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [watchedRiderId]);

  const onSubmit = async (data: RiderFormData) => {
    if (riderIdExists) {
      toast.error('Please use a unique Rider ID');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare rider data with current timestamp and default values
      const cleanedFormData = cleanRiderData(data);
      
      const riderData = {
        rider_id: data.rider_id,
        data: {
          ...cleanedFormData,
          create_time: new Date().toISOString(),
          box_installation: 'Not Eligible',
          training_status: 'Not Eligible',
          equipment_status: 'Not Eligible',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('riders')
        .insert([riderData]);

      if (error) throw error;

      toast.success('Rider created successfully!');
      reset();
      
      // Auto-apply eligibility logic to the newly created rider
      console.log('🔄 Auto-applying eligibility logic to new rider...');
      setTimeout(async () => {
        try {
          // Fetch the newly created rider and apply eligibility logic
          const { data: newRider, error } = await supabase
            .from('riders')
            .select('*')
            .eq('rider_id', data.rider_id)
            .maybeSingle();

          if (!error && newRider) {
            // Apply eligibility logic to this single rider
            const eligibilityUpdates = applyEligibilityLogic(newRider.data);
            
            if (Object.keys(eligibilityUpdates).length > 0) {
              const updatedData = { ...newRider.data, ...eligibilityUpdates };
              
              const { error: updateError } = await supabase
                .from('riders')
                .update({ 
                  data: updatedData,
                  updated_at: new Date().toISOString()
                })
                .eq('rider_id', data.rider_id);

              if (!updateError) {
                console.log('✅ Eligibility logic applied to new rider:', data.rider_id);
                const eligibilityMessages = [];
                if (eligibilityUpdates.training_status) {
                  eligibilityMessages.push(`Training: ${eligibilityUpdates.training_status}`);
                }
                if (eligibilityUpdates.box_installation) {
                  eligibilityMessages.push(`Installation: ${eligibilityUpdates.box_installation}`);
                }
                if (eligibilityMessages.length > 0) {
                  toast.success(`Rider created with eligibility status: ${eligibilityMessages.join(', ')}`);
                }
                
                // Refresh the riders list to show updated status
                onSuccess();
              }
            }
          }
        } catch (error) {
          console.error('Error applying eligibility logic to new rider:', error);
        }
      }, 500);
      
      onClose();
    } catch (error: any) {
      console.error('Error creating rider:', error);
      toast.error(error.message || 'Failed to create rider');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Rider</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rider ID - Required and Unique */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rider ID * <span className="text-xs text-gray-500">(Must be unique)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('rider_id', { 
                    required: 'Rider ID is required',
                    minLength: { value: 3, message: 'Rider ID must be at least 3 characters' },
                    pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Only letters, numbers, hyphens and underscores allowed' }
                  })}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rider_id ? 'border-red-300' : riderIdExists ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter unique rider ID"
                />
                {checkingRiderId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {!checkingRiderId && watchedRiderId && !riderIdExists && !errors.rider_id && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    ✓
                  </div>
                )}
              </div>
              {errors.rider_id && (
                <p className="text-red-600 text-sm mt-1">{errors.rider_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rider Name *
              </label>
              <input
                {...register('rider_name', { required: 'Rider name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter rider full name"
              />
              {errors.rider_name && (
                <p className="text-red-600 text-sm mt-1">{errors.rider_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('mobile', { 
                    required: 'Mobile number is required',
                    pattern: { value: /^[0-9+\-\s()]+$/, message: 'Invalid mobile number format' }
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter mobile number"
                />
              </div>
              {errors.mobile && (
                <p className="text-red-600 text-sm mt-1">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identity Card Number *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('identity_card_number', { required: 'Identity card number is required' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter identity card number"
                />
              </div>
              {errors.identity_card_number && (
                <p className="text-red-600 text-sm mt-1">{errors.identity_card_number.message}</p>
              )}
            </div>
          </div>

          {/* Location and Partner Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City ID *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('city_id', { required: 'City ID is required' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city ID"
                />
              </div>
              {errors.city_id && (
                <p className="text-red-600 text-sm mt-1">{errors.city_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner ID *
              </label>
              <input
                {...register('partner_id', { required: 'Partner ID is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter partner ID"
              />
              {errors.partner_id && (
                <p className="text-red-600 text-sm mt-1">{errors.partner_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality Code *
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  {...register('nationality_code', { required: 'Nationality code is required' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select nationality</option>
                  <option value="AE">UAE</option>
                  <option value="IN">India</option>
                  <option value="PK">Pakistan</option>
                  <option value="BD">Bangladesh</option>
                  <option value="PH">Philippines</option>
                  <option value="EG">Egypt</option>
                  <option value="JO">Jordan</option>
                  <option value="LK">Sri Lanka</option>
                  <option value="NP">Nepal</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {errors.nationality_code && (
                <p className="text-red-600 text-sm mt-1">{errors.nationality_code.message}</p>
              )}
            </div>
          </div>

          {/* Resident Type and Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resident Type *
              </label>
              <select
                {...register('resident_type', { required: 'Resident type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select resident type</option>
                <option value="Resident">Resident</option>
                <option value="Visit Visa">Visit Visa</option>
                <option value="Employment Visa">Employment Visa</option>
                <option value="Student Visa">Student Visa</option>
                <option value="Investor Visa">Investor Visa</option>
              </select>
              {errors.resident_type && (
                <p className="text-red-600 text-sm mt-1">{errors.resident_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Company Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('partner_company_name_en', { required: 'Partner company name is required' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter partner company name"
                />
              </div>
              {errors.partner_company_name_en && (
                <p className="text-red-600 text-sm mt-1">{errors.partner_company_name_en.message}</p>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number *
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('vehicle_number', { required: 'Vehicle number is required' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vehicle number"
                />
              </div>
              {errors.vehicle_number && (
                <p className="text-red-600 text-sm mt-1">{errors.vehicle_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Type *
              </label>
              <select
                {...register('delivery_type', { required: 'Delivery type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select delivery type</option>
                <option value="Car">Car</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
              {errors.delivery_type && (
                <p className="text-red-600 text-sm mt-1">{errors.delivery_type.message}</p>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Status *
              </label>
              <select
                {...register('audit_status', { required: 'Audit status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select audit status</option>
                <option value="Audit Pass">Audit Pass</option>
                <option value="Audit Reject">Audit Reject</option>
              </select>
              {errors.audit_status && (
                <p className="text-red-600 text-sm mt-1">{errors.audit_status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Status *
              </label>
              <select
                {...register('job_status', { required: 'Job status is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select job status</option>
                <option value="On Job">On Job</option>
                <option value="Resign">Resign</option>
              </select>
              {errors.job_status && (
                <p className="text-red-600 text-sm mt-1">{errors.job_status.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || riderIdExists || checkingRiderId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Rider...' : 'Create Rider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}