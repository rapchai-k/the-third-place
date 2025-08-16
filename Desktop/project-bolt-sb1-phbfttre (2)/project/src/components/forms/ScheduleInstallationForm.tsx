import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, Truck, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';
import { useProjectData } from '../../hooks/useProjectSchema';
import { useVendors } from '../../hooks/useVendors';
import toast from 'react-hot-toast';

interface ScheduleInstallationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InstallationFormData {
  rider_id: string;
  scheduled_date: string;
  scheduled_time: string; // slot start time
  location: string;
  notes?: string;
  vendor_id: string;
}

export function ScheduleInstallationForm({ isOpen, onClose, onSuccess }: ScheduleInstallationFormProps) {
  const { user } = useAuth();
  const { selectedProject } = useProject();
  const { data: projectRiders } = useProjectData(selectedProject?.id || null, 'riders');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
  const { vendors, loading: vendorsLoading } = useVendors();
  const [slots, setSlots] = useState<Array<{ start: string; end: string; capacity: number; booked: number; available: number }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstallationFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchEligibleRiders();
    }
  }, [isOpen, projectRiders]);

  // Regenerate slots when vendor/date change
  useEffect(() => {
    const sub = () => {
      const vendorId = (document.getElementById('vendor_id_select') as HTMLSelectElement)?.value || '';
      const date = (document.getElementById('scheduled_date_input') as HTMLInputElement)?.value || '';
      if (vendorId && date) {
        generateSlots(vendorId, date);
      } else {
        setSlots([]);
      }
    };
    // naive: attempt once after open; react-hook-form watch would be cleaner but keep minimal changes
    setTimeout(sub, 0);
  }, [isOpen]);

  const fetchEligibleRiders = async () => {
    if (!selectedProject || !projectRiders.length) {
      setEligibleRiders([]);
      return;
    }

    try {
      console.log('=== INSTALLATION ELIGIBILITY DEBUG ===');
      console.log('Total project riders:', projectRiders.length);
      console.log('Sample rider data:', projectRiders[0]?.data);
      
      // Get all possible column names from the data
      const allColumns = new Set();
      projectRiders.forEach(rider => {
        Object.keys(rider.data).forEach(key => allColumns.add(key));
      });
      console.log('Available columns:', Array.from(allColumns));
      
      const eligible = projectRiders.filter(rider => {
        const data = rider.data;
        
        // Try multiple possible column names for audit status
        const auditStatus = data.audit_status || data.Audit_Status || data['Audit Status'] || 
                           data.audit_pass || data.Audit_Pass || data['Audit Pass'] ||
                           data.status || data.Status || '';
        
        // Try multiple possible column names for job status  
        const jobStatus = data.job_status || data.Job_Status || data['Job Status'] ||
                         data.employment_status || data.Employment_Status || data['Employment Status'] ||
                         data.work_status || data.Work_Status || data['Work Status'] || '';
        
        // Try multiple possible column names for delivery type
        const deliveryType = data.delivery_type || data.Delivery_Type || data['Delivery Type'] ||
                            data.vehicle_type || data.Vehicle_Type || data['Vehicle Type'] ||
                            data.transport_type || data.Transport_Type || data['Transport Type'] || '';
        
        console.log(`Rider ${data.rider_id || data.Rider_ID}: audit="${auditStatus}", job="${jobStatus}", delivery="${deliveryType}"`);
        
        const auditMatch = String(auditStatus).toLowerCase().includes('audit pass') || 
                          String(auditStatus).toLowerCase().includes('audit_pass') ||
                          String(auditStatus).toLowerCase().includes('pass');
        
        const jobMatch = String(jobStatus).toLowerCase().includes('on job') || 
                        String(jobStatus).toLowerCase().includes('on_job') ||
                        String(jobStatus).toLowerCase().includes('active') ||
                        String(jobStatus).toLowerCase().includes('working');
        
        const deliveryMatch = String(deliveryType).toLowerCase().includes('motorcycle') ||
                             String(deliveryType).toLowerCase().includes('bike') ||
                             String(deliveryType).toLowerCase().includes('two wheeler') ||
                             String(deliveryType).toLowerCase().includes('2 wheeler') ||
                             String(deliveryType).toLowerCase().includes('2w') ||
                             String(deliveryType).toLowerCase().includes('motorbike');
        
        const isEligible = auditMatch && jobMatch && deliveryMatch;
        if (isEligible) {
          console.log(`✅ ELIGIBLE: ${data.rider_id || data.Rider_ID}`);
        }
        
        return isEligible;
      });
      
      console.log('Installation eligible riders:', eligible.length);
      setEligibleRiders(eligible);
    } catch (error) {
      console.error('Error fetching eligible riders for installation:', error);
      setEligibleRiders([]);
    }
  };

  const parseTimeToMinutes = (time: string) => {
    const [h, m] = String(time).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const isWithinBreak = (minutes: number, vendor: any) => {
    if (!vendor?.break_start_time || !vendor?.break_end_time) return false;
    const bStart = parseTimeToMinutes(vendor.break_start_time);
    const bEnd = parseTimeToMinutes(vendor.break_end_time);
    return minutes >= bStart && minutes < bEnd;
  };

  const normalizeServiceableDays = (raw: any): string[] => {
    if (!raw || (Array.isArray(raw) && raw.length === 0)) return [];
    const list: string[] = Array.isArray(raw)
      ? raw as string[]
      : typeof raw === 'string'
        ? (raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean))
        : [];
    const map: Record<string, string> = {
      sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday',
      '0': 'sunday', '1': 'monday', '2': 'tuesday', '3': 'wednesday', '4': 'thursday', '5': 'friday', '6': 'saturday'
    };
    return list.map(v => v.toString().toLowerCase())
      .map(v => map[v] || v)
      .map(v => v.replace(/\s+/g, ''))
      .map(v => ({
        sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
      }[v] || v.charAt(0).toUpperCase() + v.slice(1)));
  };

  const isServiceableDay = (date: string, vendor: any) => {
    const normalized = normalizeServiceableDays(vendor?.serviceable_days);
    if (!normalized || normalized.length === 0) return true;
    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    return normalized.some(d => d.toLowerCase() === dayName.toLowerCase());
  };

  const generateSlots = async (vendorId: string, date: string) => {
    const vendor = vendors?.find(v => v.id === vendorId);
    if (!vendor) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const startMins = parseTimeToMinutes(vendor.start_time || '08:00');
      const endMins = parseTimeToMinutes(vendor.end_time || '18:00');
      const slotDuration = 60;
      const boxesPerHour = Number(vendor.boxes_per_hour);
      const capacityPerSlot = !isFinite(boxesPerHour) ? 0 : Math.max(0, boxesPerHour);
      const workableDay = isServiceableDay(date, vendor);

      const { data: ridersData, error } = await supabase
        .from('riders')
        .select('data')
        .contains('data', { installation_scheduled_date: date })
        .contains('data', { installation_vendor_id: vendorId });

      const bookedByTime: Record<string, number> = {};
      if (!error && ridersData) {
        for (const r of ridersData) {
          const t = r.data?.installation_scheduled_time;
          if (typeof t === 'string') bookedByTime[t] = (bookedByTime[t] || 0) + 1;
        }
      }

      const newSlots: Array<{ start: string; end: string; capacity: number; booked: number; available: number }> = [];
      for (let m = startMins; m + slotDuration <= endMins; m += slotDuration) {
        if (isWithinBreak(m, vendor)) continue;
        const start = minutesToTime(m);
        const end = minutesToTime(m + slotDuration);
        const cap = workableDay ? capacityPerSlot : 0;
        const booked = bookedByTime[start] || 0;
        const available = Math.max(0, cap - booked);
        newSlots.push({ start, end, capacity: cap, booked, available });
      }
      setSlots(newSlots);
    } catch (e) {
      console.error('Error generating slots:', e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onSubmit = async (data: InstallationFormData) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setIsSubmitting(true);
    try {
      const slot = slots.find(s => s.start === data.scheduled_time);
      if (!slot || slot.available <= 0) {
        toast.error('Selected slot is not available');
        setIsSubmitting(false);
        return;
      }

      // Insert installation data into project_data table
      const installationData = {
        project_id: selectedProject.id,
        table_name: 'box_installations',
        data: {
          ...data,
          created_by: user?.id,
          scheduled_by: user?.email || user?.id,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          scheduled_time_end: slot.end
        }
      };

      const { error } = await supabase
        .from('project_data')
        .insert([installationData]);

      if (error) throw error;

      toast.success('Installation scheduled successfully');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule installation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Box Installation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Vendor *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                id="vendor_id_select"
                {...register('vendor_id', { required: 'Please select a vendor' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  const vendorId = e.target.value;
                  const date = (document.getElementById('scheduled_date_input') as HTMLInputElement)?.value || '';
                  if (vendorId && date) generateSlots(vendorId, date);
                }}
              >
                <option value="">{vendorsLoading ? 'Loading vendors...' : `Select vendor (${vendors?.length || 0} available)`}</option>
                {vendors?.map(v => (
                  <option key={v.id} value={v.id}>{v.vendor_name} - {v.location} (Max {v.max_boxes_per_day}/day, {v.boxes_per_hour}/hour)</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Rider *
            </label>
            <select
              {...register('rider_id', { required: 'Please select a rider' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an eligible rider ({eligibleRiders.length} available)</option>
              {eligibleRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.data.rider_id || rider.data.Rider_ID || 'N/A'} - {rider.data.rider_name || rider.data.Rider_Name || 'N/A'} ({rider.data.delivery_type || rider.data.Delivery_Type || 'N/A'})
                </option>
              ))}
            </select>
            {eligibleRiders.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No riders eligible for box installation. Riders must have "Audit Pass" status, "On Job" status, and use motorcycle/bike delivery.
              </p>
            )}
            {errors.rider_id && (
              <p className="text-red-600 text-sm mt-1">{errors.rider_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="scheduled_date_input"
                  {...register('scheduled_date', { required: 'Date is required' })}
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const date = e.target.value;
                    const vendorId = (document.getElementById('vendor_id_select') as HTMLSelectElement)?.value || '';
                    if (vendorId && date) generateSlots(vendorId, date);
                  }}
                />
              </div>
              {errors.scheduled_date && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slot *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  {...register('scheduled_time', { required: 'Please select a slot' })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={slots.length === 0}
                >
                  <option value="">{loadingSlots ? 'Loading slots...' : slots.length === 0 ? 'No slots' : `Select slot (${slots.length})`}</option>
                  {slots.map(s => (
                    <option key={s.start} value={s.start} disabled={s.available <= 0}>
                      {s.start} - {s.end} (available {s.available}/{s.capacity})
                    </option>
                  ))}
                </select>
              </div>
              {errors.scheduled_time && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduled_time.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('location', { required: 'Location is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter installation location"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes (optional)"
            />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Installation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}