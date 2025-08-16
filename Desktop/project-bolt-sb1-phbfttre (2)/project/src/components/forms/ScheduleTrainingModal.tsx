import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, User, AlertTriangle, XCircle } from 'lucide-react';
import { usePartnerCapacity } from '../../hooks/usePartners';
import toast from 'react-hot-toast';

interface ScheduleTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scheduleData: any) => void;
  riders: any[];
}

interface ScheduleFormData {
  date: string;
  time: string;
  location: string;
}

export function ScheduleTrainingModal({ isOpen, onClose, onSuccess, riders }: ScheduleTrainingModalProps) {
  const { checkPartnerCapacity } = usePartnerCapacity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capacityWarnings, setCapacityWarnings] = useState<string[]>([]);
  const [capacityBlocked, setCapacityBlocked] = useState<string[]>([]);
  const [allowedRiders, setAllowedRiders] = useState<any[]>([]);
  const [checkingPartnerCapacity, setCheckingPartnerCapacity] = useState(false);
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScheduleFormData>();

  // Get current date in KSA timezone (GMT+3)
  const getKSADate = () => {
    const now = new Date();
    const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for KSA timezone
    return ksaTime.toISOString().split('T')[0];
  };

  // Get current time in KSA timezone
const getKSATime = () => {
  const now = new Date();
  const ksaTime = new Date(now.getTime() - (2.5 * 60 * 60 * 1000)); // Subtract 2.5 hours
  return ksaTime.toTimeString().slice(0, 5); // HH:MM
};


  // Check partner capacity when riders change
  useEffect(() => {
    if (riders && riders.length > 0) {
      checkRidersPartnerCapacity();
    }
  }, [riders]);

  const checkRidersPartnerCapacity = async () => {
    if (!riders || riders.length === 0) return;
    
    setCheckingPartnerCapacity(true);
    const warnings: string[] = [];
    const blocked: string[] = [];
    const allowed: any[] = [];
    
    try {
      console.log('🔍 TRAINING CAPACITY CHECK: Starting capacity validation for', riders.length, 'riders');
      
      // Group riders by partner and delivery type
      const partnerGroups: Record<string, { car: number; bike: number; total: number }> = {};
      
      riders.forEach(rider => {
        const partnerId = rider.data.partner_id;
        const deliveryType = rider.data.delivery_type;
        
        if (!partnerId) {
          console.warn('⚠️ Rider without partner_id:', rider.rider_id);
          return;
        }
        
        if (!partnerGroups[partnerId]) {
          partnerGroups[partnerId] = { car: 0, bike: 0, total: 0 };
        }
        
        partnerGroups[partnerId].total++;
        if (deliveryType === 'Car') {
          partnerGroups[partnerId].car++;
        } else if (deliveryType === 'Motorcycle' || deliveryType === 'Bike') {
          partnerGroups[partnerId].bike++;
        }
      });
      
      console.log('📊 PARTNER GROUPS:', partnerGroups);
      
      // Check capacity for each partner group
      for (const [partnerId, counts] of Object.entries(partnerGroups)) {
        const ridersInGroup = riders.filter(r => r.data.partner_id === partnerId);
        
        console.log(`🔍 Checking partner ${partnerId}:`, {
          ridersInGroup: ridersInGroup.length,
          carCount: counts.car,
          bikeCount: counts.bike,
          totalCount: counts.total
        });
        
        // Check car capacity (Car delivery type)
        if (counts.car > 0) {
          const carCapacity = await checkPartnerCapacity(partnerId, 'Car', counts.car);
          console.log('🚗 Car capacity result:', carCapacity);
          if (!carCapacity.can_schedule) {
            blocked.push(`🚗 ${carCapacity.partner_name}: ${carCapacity.error}`);
            // Remove car riders from this partner from allowed list
            const blockedCarRiders = ridersInGroup.filter(r => r.data.delivery_type === 'Car');
            console.log(`❌ BLOCKING ${blockedCarRiders.length} car riders from partner ${carCapacity.partner_name}`);
          } else {
            // Add car riders to allowed list
            const allowedCarRiders = ridersInGroup.filter(r => r.data.delivery_type === 'Car');
            console.log(`✅ ALLOWING ${allowedCarRiders.length} car riders from partner ${carCapacity.partner_name}`);
            allowed.push(...allowedCarRiders);
          }
        }
        
        // Check motorcycle capacity (Motorcycle delivery type)
        if (counts.bike > 0) {
          const bikeCapacity = await checkPartnerCapacity(partnerId, 'Motorcycle', counts.bike);
          console.log('🏍️ Motorcycle capacity result:', bikeCapacity);
          if (!bikeCapacity.can_schedule) {
            blocked.push(`🏍️ ${bikeCapacity.partner_name}: ${bikeCapacity.error}`);
            // Remove motorcycle riders from this partner from allowed list
            const blockedBikeRiders = ridersInGroup.filter(r => r.data.delivery_type === 'Motorcycle' || r.data.delivery_type === 'Bike');
            console.log(`❌ BLOCKING ${blockedBikeRiders.length} motorcycle riders from partner ${bikeCapacity.partner_name}`);
          } else {
            // Add motorcycle riders to allowed list
            const allowedBikeRiders = ridersInGroup.filter(r => r.data.delivery_type === 'Motorcycle' || r.data.delivery_type === 'Bike');
            console.log(`✅ ALLOWING ${allowedBikeRiders.length} motorcycle riders from partner ${bikeCapacity.partner_name}`);
            allowed.push(...allowedBikeRiders);
          }
        }
      }
      
      setCapacityWarnings(warnings);
      setCapacityBlocked(blocked);
      setAllowedRiders(allowed);
      
      console.log(`🎯 FINAL CAPACITY CHECK RESULTS:`, {
        totalRiders: riders.length,
        allowedRiders: allowed.length,
        blockedPartners: blocked.length,
        warnings: warnings.length,
        blockedMessages: blocked,
        allowedRiderIds: allowed.map(r => r.rider_id)
      });
      
    } catch (error) {
      console.error('Error checking partner capacity:', error);
    } finally {
      setCheckingPartnerCapacity(false);
    }
  };

  const onSubmit = async (data: ScheduleFormData) => {
    // Validate future date/time
    const selectedDateTime = new Date(`${data.date}T${data.time}:00`);
    const currentKSATime = new Date(Date.now() + (3 * 60 * 60 * 1000));
    
    if (selectedDateTime <= currentKSATime) {
      toast.error('Please select a future date and time (KSA timezone)');
      return;
    }

    // Block scheduling if any partners have capacity exceeded
    if (capacityBlocked.length > 0) {
      toast.error(`❌ Cannot schedule training: ${capacityBlocked.length} partner(s) have exceeded capacity. Only ${allowedRiders.length} out of ${riders.length} riders can be scheduled.`);
      return;
    }
    
    // Use only allowed riders for scheduling
    const ridersToSchedule = allowedRiders.length > 0 ? allowedRiders : riders;
    
    if (ridersToSchedule.length === 0) {
      toast.error('No riders can be scheduled due to partner capacity limits');
      return;
    }
    
    if (ridersToSchedule.length < riders.length) {
      const proceed = confirm(
        `⚠️ CAPACITY LIMIT REACHED!\n\nOnly ${ridersToSchedule.length} out of ${riders.length} riders can be scheduled due to partner capacity limits.\n\nThe remaining ${riders.length - ridersToSchedule.length} riders will stay in "Eligible" status.\n\nProceed with scheduling ${ridersToSchedule.length} riders?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess({
        date: data.date,
        time: data.time,
        location: data.location,
        ridersToSchedule: ridersToSchedule, // Pass only allowed riders
        timezone: 'GMT+3 (KSA)'
      });
      reset();
    } catch (error) {
      console.error('Error scheduling training:', error);
      toast.error('Failed to schedule training');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !riders || riders.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Bulk Training</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Riders Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Bulk Training Schedule</h3>
                <p className="text-sm text-blue-700">
                  Scheduling training for {riders.length} eligible rider(s)
                </p>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {riders.slice(0, 5).map((rider, index) => (
                  <div key={rider.rider_id} className="text-xs text-blue-700">
                    • {rider.data?.rider_name || 'Unknown'} ({rider.rider_id})
                  </div>
                ))}
                {riders.length > 5 && (
                  <div className="text-xs text-blue-600 font-medium">
                    ... and {riders.length - 5} more riders
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Capacity Warnings */}
          {checkingPartnerCapacity && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm text-yellow-800">Checking partner capacity...</span>
              </div>
            </div>
          )}
          
          {capacityBlocked.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900">❌ Cannot Schedule - Partner Capacity Exceeded</h4>
              </div>
              <div className="space-y-2">
                {capacityBlocked.map((warning, index) => (
                  <div key={index} className="text-sm text-red-800 bg-red-100 border border-red-300 rounded p-2">
                    {warning}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                <p className="text-sm text-red-800">
                  <strong>📊 Capacity Status:</strong><br/>
                  • <strong>Total riders selected:</strong> {riders.length}<br/>
                  • <strong>Can be scheduled:</strong> {allowedRiders.length}<br/>
                  • <strong>Blocked by capacity:</strong> {riders.length - allowedRiders.length}
                </p>
              </div>
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>💡 Solutions:</strong><br/>
                  • Reduce the number of riders selected<br/>
                  • Schedule in smaller batches over multiple days<br/>
                  • Contact partners to increase their capacity targets<br/>
                  • Blocked riders will remain in "Eligible" status
                </p>
              </div>
            </div>
          )}
          
          {allowedRiders.length > 0 && allowedRiders.length < riders.length && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">⚠️ Partial Scheduling Available</h4>
              </div>
              <p className="text-sm text-yellow-800">
                Only <strong>{allowedRiders.length}</strong> out of <strong>{riders.length}</strong> riders can be scheduled due to partner capacity limits.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                The remaining <strong>{riders.length - allowedRiders.length}</strong> riders will stay in "Eligible" status and can be scheduled later.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('date', { 
                    required: 'Training date is required',
                    min: { value: getKSADate(), message: 'Date must be today or in the future' }
                  })}
                  type="date"
                  min={getKSADate()}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Time * <span className="text-xs text-gray-500">(KSA Timezone GMT+3)</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('time', { required: 'Training time is required' })}
                  type="time"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.time && (
                <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>
              )}
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  {...register('location', { 
                    required: 'Training location is required',
                    minLength: { value: 10, message: 'Please provide a detailed location' }
                  })}
                  rows={3}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter training location address or paste Google Maps link..."
                />
              </div>
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: You can paste a Google Maps link or provide a detailed address
              </p>
            </div>

            {/* Timezone Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>⏰ Timezone:</strong> All times are in KSA timezone (GMT+3)<br/>
                <strong>👥 Bulk Action:</strong> This will schedule training for all {riders.length} eligible riders
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (capacityBlocked.length > 0 && allowedRiders.length === 0)}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  capacityBlocked.length > 0 && allowedRiders.length === 0
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : allowedRiders.length > 0 && allowedRiders.length < riders.length
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Scheduling...' : 
                 capacityBlocked.length > 0 && allowedRiders.length === 0 ? 
                 `❌ Cannot Schedule (Capacity Exceeded)` :
                 allowedRiders.length > 0 && allowedRiders.length < riders.length ?
                 `⚠️ Schedule ${allowedRiders.length} Riders (${riders.length - allowedRiders.length} Blocked)` :
                 `Schedule Training for ${riders.length} Riders`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}