import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, MapPin, Truck, Building, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { useVendors } from '../../hooks/useVendors';
import { usePartnerCapacity } from '../../hooks/usePartners';
import { supabase } from '../../lib/supabase';
import { AddVendorForm } from './AddVendorForm';
import toast from 'react-hot-toast';

interface ScheduleInstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scheduleData: any) => void;
  riders: any[];
}

interface ScheduleFormData {
  date: string;
  location: string;
  vendor_id: string;
}

export function ScheduleInstallationModal({ isOpen, onClose, onSuccess, riders }: ScheduleInstallationModalProps) {
  const { vendors, loading: vendorsLoading, fetchVendors } = useVendors();
  const { checkPartnerCapacity } = usePartnerCapacity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [existingInstallations, setExistingInstallations] = useState(0);
  const [capacityStatus, setCapacityStatus] = useState<'safe' | 'warning' | 'exceeded'>('safe');
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [capacityWarnings, setCapacityWarnings] = useState<string[]>([]);
  const [checkingPartnerCapacity, setCheckingPartnerCapacity] = useState(false);
  // we keep only allocations list for UI and validation
  const [allocations, setAllocations] = useState<Array<{ start: string; end: string; capacity: number; booked: number; available: number; count: number }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotCapacityError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    clearErrors,
    setValue,
  } = useForm<ScheduleFormData>();

  const watchedVendorId = watch('vendor_id');
  const watchedDate = watch('date');

  // Set default date when modal opens
  useEffect(() => {
    if (isOpen && !watchedDate) {
      setValue('date', getKSADate());
    }
  }, [isOpen, watchedDate, setValue]);

  // IMMEDIATE capacity check when vendor changes (regardless of date)
  useEffect(() => {
    if (watchedVendorId && vendors && vendors.length > 0) {
      const vendor = vendors.find(v => v.id === watchedVendorId);
      if (vendor) {
        setSelectedVendor(vendor);
        // Autofill location from vendor when available
        if (vendor.location) {
          setValue('location', vendor.location, { shouldValidate: true, shouldDirty: true });
        }
        
        // IMMEDIATE basic capacity check
        if (riders.length > vendor.max_boxes_per_day) {
          console.log('🚨 IMMEDIATE CAPACITY EXCEEDED:', {
            vendor: vendor.vendor_name,
            ridersToSchedule: riders.length,
            vendorCapacity: vendor.max_boxes_per_day,
            excess: riders.length - vendor.max_boxes_per_day
          });
          
          setCapacityStatus('exceeded');
          setError('vendor_id', {
            type: 'manual',
            message: `🚨 CAPACITY EXCEEDED: This vendor can only handle ${vendor.max_boxes_per_day} installations per day. You're trying to schedule ${riders.length} installations (${riders.length - vendor.max_boxes_per_day} over limit).`
          });
        } else {
          setCapacityStatus('safe');
          clearErrors('vendor_id');
        }
      }
    } else {
      setSelectedVendor(null);
      setCapacityStatus('safe');
      clearErrors('vendor_id');
      // Clear autofilled location when vendor cleared (keep user-entered if any)
      // Only clear if current value equals previously autofilled vendor location
    }
  }, [watchedVendorId, vendors, riders.length, setError, clearErrors]);

  // DETAILED capacity check when both vendor and date are selected
  useEffect(() => {
    if (watchedVendorId && watchedDate && vendors && vendors.length > 0) {
      checkDetailedVendorCapacity(watchedVendorId, watchedDate);
      generateSlotsForSelection(watchedVendorId, watchedDate);
    } else {
      setAllocations([]);
    }
  }, [watchedVendorId, watchedDate, vendors]);

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.count || 0), 0);
  const remainingToAllocate = Math.max(0, riders.length - totalAllocated);

  const setClampedCount = (slotStart: string, desiredCount: number) => {
    setAllocations(prev => {
      const target = prev.find(s => s.start === slotStart);
      if (!target) return prev;
      const totalWithoutThis = prev.reduce((sum, s) => sum + (s.start === slotStart ? 0 : (s.count || 0)), 0);
      const maxAllowedForThis = Math.max(0, Math.min(target.available, riders.length - totalWithoutThis));
      const next = Math.max(0, Math.min(maxAllowedForThis, desiredCount));
      return prev.map(s => (s.start === slotStart ? { ...s, count: next } : s));
    });
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
    
    try {
      // Group riders by partner and delivery type
      const partnerGroups: Record<string, { car: number; bike: number; total: number }> = {};
      
      riders.forEach(rider => {
        const partnerId = rider.data.partner_id;
        const deliveryType = rider.data.delivery_type;
        
        if (!partnerId) return;
        
        if (!partnerGroups[partnerId]) {
          partnerGroups[partnerId] = { car: 0, bike: 0, total: 0 };
        }
        
        partnerGroups[partnerId].total++;
        if (deliveryType === 'Car') {
          partnerGroups[partnerId].car++;
        } else if (deliveryType === 'Motorcycle') {
          partnerGroups[partnerId].bike++;
        }
      });
      
      // Check capacity for each partner group
      for (const [partnerId, counts] of Object.entries(partnerGroups)) {
        // Check bike capacity (since this is installation, mainly for motorcycles)
        if (counts.bike > 0) {
          const bikeCapacity = await checkPartnerCapacity(partnerId, 'Motorcycle', counts.bike);
          if (!bikeCapacity.can_schedule) {
            warnings.push(`🏍️ ${bikeCapacity.partner_name}: ${bikeCapacity.error}`);
          }
        }
        
        // Check car capacity if any
        if (counts.car > 0) {
          const carCapacity = await checkPartnerCapacity(partnerId, 'Car', counts.car);
          if (!carCapacity.can_schedule) {
            warnings.push(`🚗 ${carCapacity.partner_name}: ${carCapacity.error}`);
          }
        }
      }
      
      setCapacityWarnings(warnings);
    } catch (error) {
      console.error('Error checking partner capacity:', error);
    } finally {
      setCheckingPartnerCapacity(false);
    }
  };

  const checkDetailedVendorCapacity = async (vendorId: string, date: string) => {
    setCheckingCapacity(true);
    try {
      const vendor = vendors?.find(v => v.id === vendorId);
      if (!vendor) {
        setCheckingCapacity(false);
        return;
      }
      
      // Count existing installations for this vendor on this date
      const { data: ridersData, error } = await supabase
        .from('riders')
        .select('data')
        .contains('data', { installation_scheduled_date: date })
        .contains('data', { installation_vendor_id: vendorId });

      let existingCount = 0;
      if (error) {
        console.warn('Error checking existing installations, using fallback method:', error);
        // Fallback: get all riders and filter client-side
        const { data: allRiders, error: altError } = await supabase
          .from('riders')
          .select('data');
        
        if (!altError && allRiders) {
          existingCount = allRiders.filter(rider => 
            rider.data.installation_scheduled_date === date &&
            rider.data.installation_vendor_id === vendorId
          ).length;
        }
      } else {
        existingCount = ridersData?.length || 0;
      }
      
      setExistingInstallations(existingCount);
      
      // Calculate total capacity needed
      const totalNeeded = existingCount + riders.length;
      const vendorCapacity = vendor.max_boxes_per_day;
      
      console.log('📊 DETAILED CAPACITY CHECK:', {
        vendor: vendor.vendor_name,
        date: date,
        existing: existingCount,
        newRiders: riders.length,
        total: totalNeeded,
        capacity: vendorCapacity,
        percentage: Math.round((totalNeeded / vendorCapacity) * 100)
      });
      
      // Update capacity status based on total needed
      if (totalNeeded > vendorCapacity) {
        setCapacityStatus('exceeded');
        setError('vendor_id', {
          type: 'manual',
          message: `🚨 CAPACITY EXCEEDED: Vendor can handle max ${vendorCapacity} installations/day. You're scheduling ${totalNeeded} (${existingCount} existing + ${riders.length} new). Please choose a different vendor or split into multiple days.`
        });
      } else if (totalNeeded >= vendorCapacity * 0.8) {
        setCapacityStatus('warning');
        clearErrors('vendor_id');
      } else {
        setCapacityStatus('safe');
        clearErrors('vendor_id');
      }
      
    } catch (error) {
      console.error('Error checking vendor capacity:', error);
      setExistingInstallations(0);
    } finally {
      setCheckingCapacity(false);
    }
  };

  // Utilities for slot generation
  const parseTimeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
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
    const input = Array.isArray(raw) ? raw.join(',') : String(raw);
    const tokens = input.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const idx: Record<string, number> = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
    const alias: Record<string,string> = { sun:'sunday', mon:'monday', tue:'tuesday', tues:'tuesday', wed:'wednesday', thu:'thursday', thur:'thursday', fri:'friday', sat:'saturday', '0':'sunday','1':'monday','2':'tuesday','3':'wednesday','4':'thursday','5':'friday','6':'saturday' };

    const expandRange = (start: string, end: string) => {
      const s = idx[start];
      const e = idx[end];
      if (s === undefined || e === undefined) return [];
      const result: string[] = [];
      let i = s;
      while (true) {
        result.push(days[i]);
        if (i === e) break;
        i = (i + 1) % 7;
        if (result.length > 7) break;
      }
      return result;
    };

    const out: Set<string> = new Set();
    for (let tok of tokens) {
      let t = tok.toLowerCase().replace(/\s+/g,'');
      if (['all','alldays','everyday','daily','7days','allweek'].includes(t)) return []; // treat as all days
      if (t === 'weekdays') { ['Monday','Tuesday','Wednesday','Thursday','Friday'].forEach(d=>out.add(d)); continue; }
      if (t === 'weekends' || t === 'weekend') { ['Saturday','Sunday'].forEach(d=>out.add(d)); continue; }
      // handle ranges like sun-thu or mon-fri
      if (t.includes('-')) {
        const [a,b] = t.split('-');
        const start = alias[a] || a;
        const end = alias[b] || b;
        expandRange(start, end).forEach(d=>out.add(d));
        continue;
      }
      const normalized = alias[t] || t;
      const cap = days[idx[normalized] ?? -1];
      if (cap) out.add(cap);
    }
    return Array.from(out);
  };

  const isServiceableDay = (date: string, vendor: any) => {
    const normalized = normalizeServiceableDays(vendor?.serviceable_days);
    if (!normalized || normalized.length === 0) return true; // treat empty as all days
    const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    return normalized.some(d => d.toLowerCase() === dayName.toLowerCase());
  };

  const generateSlotsForSelection = async (vendorId: string, date: string) => {
    try {
      const vendor = vendors?.find(v => v.id === vendorId);
      if (!vendor) return;

      setLoadingSlots(true);

      // If non-serviceable day, still show slots but mark 0 capacity to prevent scheduling
      const workableDay = isServiceableDay(date, vendor);

      const startMins = parseTimeToMinutes(vendor.start_time || '08:00');
      const endMins = parseTimeToMinutes(vendor.end_time || '18:00');

      const slotDuration = 60; // minutes per slot
      // Ensure numeric boxes_per_hour/max_boxes_per_day even if stored as strings
      const boxesPerHour = Number(vendor.boxes_per_hour);
      const capacityPerSlot = !isFinite(boxesPerHour) ? 0 : Math.max(0, boxesPerHour);

      // Fetch existing installations grouped by time
      const { data: ridersData, error } = await supabase
        .from('riders')
        .select('data')
        .contains('data', { installation_scheduled_date: date })
        .contains('data', { installation_vendor_id: vendorId });

      const bookedByTime: Record<string, number> = {};
      if (!error && ridersData) {
        for (const r of ridersData) {
          const t = r.data?.installation_scheduled_time;
          if (typeof t === 'string') {
            bookedByTime[t] = (bookedByTime[t] || 0) + 1;
          }
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

      setAllocations(newSlots.map(s => ({ ...s, count: 0 })));
    } catch (e) {
      console.error('Error generating slots:', e);
      setAllocations([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Get current date in KSA timezone (GMT+3)
  const getKSADate = () => {
    const now = new Date();
    const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return ksaTime.toISOString().split('T')[0];
  };

  const handleAddVendorSuccess = () => {
    setShowAddVendorForm(false);
    fetchVendors();
  };

  const onSubmit = async (data: ScheduleFormData) => {
    // Validate future date/time
    const firstSelectedSlot = allocations.find(a => a.count > 0);
    const selectedDateTime = firstSelectedSlot ? new Date(`${data.date}T${firstSelectedSlot.start}:00`) : new Date(`${data.date}T00:00:00`);
    const currentKSATime = new Date(Date.now() + (3 * 60 * 60 * 1000));
    
    if (selectedDateTime <= currentKSATime) {
      toast.error('Please select a future date and time (KSA timezone)');
      return;
    }

    // Validate allocations
    if (totalAllocated !== riders.length) {
      toast.error(`Please allocate all riders to slots (${totalAllocated}/${riders.length} assigned)`);
      return;
    }
    const overAllocated = allocations.find(a => a.count > a.available);
    if (overAllocated) {
      toast.error(`Slot ${overAllocated.start}-${overAllocated.end} exceeds availability (${overAllocated.count}/${overAllocated.available})`);
      return;
    }

    // Check capacity before submission
    if (capacityStatus === 'exceeded') {
      const vendor = vendors?.find(v => v.id === data.vendor_id);
      const totalNeeded = existingInstallations + riders.length;
      
      // Allow proceeding with high capacity - just show warning
      console.log('⚠️ High capacity usage but allowing to proceed:', {
        vendor: vendor?.vendor_name,
        totalNeeded,
        capacity: vendor?.max_boxes_per_day
      });
    }

    // Check if there are partner capacity warnings
    if (capacityWarnings.length > 0) {
      const proceed = confirm(
        `⚠️ PARTNER CAPACITY WARNING!\n\n${capacityWarnings.join('\n\n')}\n\nDo you want to proceed anyway? This will exceed partner targets.`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess({
        date: data.date,
        location: data.location,
        vendor_id: data.vendor_id,
        vendor_name: selectedVendor?.vendor_name || 'Unknown Vendor',
        vendor_email: selectedVendor?.vendor_email || null,
        timezone: 'GMT+3 (KSA)',
        allocations: allocations.filter(a => a.count > 0).map(a => ({ start: a.start, end: a.end, count: a.count }))
      });
      reset();
    } catch (error) {
      console.error('Error scheduling installation:', error);
      toast.error('Failed to schedule installation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !riders || riders.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Schedule Bulk Installation</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Riders Info */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Truck className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-900">Bulk Installation Schedule</h3>
                  <p className="text-sm text-orange-700">
                    Scheduling box installation for {riders.length} eligible rider(s)
                  </p>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <div className="space-y-1">
                  {riders.slice(0, 5).map((rider) => (
                    <div key={rider.rider_id} className="text-xs text-orange-700">
                      • {rider.data?.rider_name || 'Unknown'} ({rider.rider_id}) - {rider.data?.delivery_type || 'N/A'}
                    </div>
                  ))}
                  {riders.length > 5 && (
                    <div className="text-xs text-orange-600 font-medium">
                      ... and {riders.length - 5} more riders
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installation Vendor *
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    {...register('vendor_id', { required: 'Please select an installation vendor' })}
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      capacityStatus === 'exceeded' ? 'border-red-300 focus:ring-red-500' :
                      capacityStatus === 'warning' ? 'border-yellow-300 focus:ring-yellow-500' :
                      'border-gray-300 focus:ring-orange-500'
                    }`}
                    disabled={vendorsLoading}
                  >
                    <option value="">
                      {vendorsLoading ? 'Loading vendors...' : `Select vendor (${vendors?.length || 0} available)`}
                    </option>
                    {vendors?.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name} - {vendor.location} (Max: {vendor.max_boxes_per_day} boxes/day)
                      </option>
                    )) || []}
                  </select>
                  {checkingCapacity && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddVendorForm(true)}
                  className="px-3 py-3 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                  title="Add new vendor"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.vendor_id && (
                <p className="text-red-600 text-sm mt-1">{errors.vendor_id.message}</p>
              )}
              
              {/* IMMEDIATE Capacity Warning - Shows as soon as vendor is selected */}
              {selectedVendor && riders.length > selectedVendor.max_boxes_per_day && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-900">🚨 Cannot Schedule - Capacity Exceeded</h4>
                  </div>
                  <div className="text-sm text-red-800 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div><strong>Vendor:</strong> {selectedVendor.vendor_name}</div>
                        <div><strong>Daily Capacity:</strong> {selectedVendor.max_boxes_per_day} installations</div>
                        <div><strong>Hourly Rate:</strong> {selectedVendor.boxes_per_hour} boxes/hour</div>
                      </div>
                      <div>
                        <div><strong>You're scheduling:</strong> {riders.length} installations</div>
                        <div><strong>Excess:</strong> {riders.length - selectedVendor.max_boxes_per_day} over limit</div>
                        <div><strong>Capacity Usage:</strong> {Math.round((riders.length / selectedVendor.max_boxes_per_day) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Capacity Progress Bar */}
                  <div className="mt-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-700">Capacity Usage</span>
                      <span className="text-xs text-red-600">
                        {Math.round((riders.length / selectedVendor.max_boxes_per_day) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-red-500 transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (riders.length / selectedVendor.max_boxes_per_day) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-red-100 border border-red-300 rounded p-3">
                    <h5 className="font-medium text-red-900 mb-2">💡 Solutions:</h5>
                    <ul className="text-xs text-red-800 space-y-1">
                      <li>• <strong>Split into {Math.ceil(riders.length / selectedVendor.max_boxes_per_day)} days</strong> (max {selectedVendor.max_boxes_per_day} per day)</li>
                      <li>• Choose a vendor with higher daily capacity</li>
                      <li>• Reduce the number of riders in this batch</li>
                      <li>• Schedule across multiple vendors</li>
                      <li>• Consider the vendor's {selectedVendor.boxes_per_hour} boxes/hour installation rate</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Real-time Capacity Status for valid selections */}
              {selectedVendor && watchedDate && riders.length <= selectedVendor.max_boxes_per_day && (
                <div className={`mt-3 p-4 rounded-lg border ${
                  capacityStatus === 'exceeded' ? 'bg-red-50 border-red-200' :
                  capacityStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center space-x-3 mb-3">
                    {capacityStatus === 'exceeded' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : capacityStatus === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <h4 className={`font-medium ${
                        capacityStatus === 'exceeded' ? 'text-red-900' :
                        capacityStatus === 'warning' ? 'text-yellow-900' :
                        'text-green-900'
                      }`}>
                        {capacityStatus === 'exceeded' ? '🚨 Capacity Exceeded' :
                         capacityStatus === 'warning' ? '⚠️ High Capacity Usage' :
                         '✅ Capacity Available'}
                      </h4>
                      <p className={`text-sm ${
                        capacityStatus === 'exceeded' ? 'text-red-800' :
                        capacityStatus === 'warning' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        {selectedVendor.vendor_name} on {watchedDate}
                      </p>
                    </div>
                  </div>
                  
                  {/* Capacity Details */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Current Schedule:</div>
                      <div className="text-xs text-gray-600">
                        • Existing installations: {existingInstallations}
                      </div>
                      <div className="text-xs text-gray-600">
                        • New installations: {riders.length}
                      </div>
                      <div className="text-xs font-medium text-gray-800">
                        • Total: {existingInstallations + riders.length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Vendor Capacity:</div>
                      <div className="text-xs text-gray-600">
                        • Max per day: {selectedVendor.max_boxes_per_day}
                      </div>
                      <div className="text-xs text-gray-600">
                        • Rate: {selectedVendor.boxes_per_hour} boxes/hour
                      </div>
                      <div className="text-xs text-gray-600">
                        • Hours: {selectedVendor.start_time || '08:00'}-{selectedVendor.end_time || '18:00'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Capacity Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Capacity Usage</span>
                      <span className="text-xs text-gray-600">
                        {Math.round(((existingInstallations + riders.length) / selectedVendor.max_boxes_per_day) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          capacityStatus === 'exceeded' ? 'bg-red-500' :
                          capacityStatus === 'warning' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, ((existingInstallations + riders.length) / selectedVendor.max_boxes_per_day) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {(!vendors || vendors.length === 0) && !vendorsLoading && (
                <p className="text-sm text-gray-500 mt-1">
                  No vendors available. Click the + button to add a new installation vendor.
                </p>
              )}
            </div>

            {/* Partner Capacity Warnings */}
            {checkingPartnerCapacity && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <span className="text-sm text-yellow-800">Checking partner capacity...</span>
                </div>
              </div>
            )}
            
            {capacityWarnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">⚠️ Partner Capacity Warnings</h4>
                <div className="space-y-2">
                  {capacityWarnings.map((warning, index) => (
                    <div key={index} className="text-sm text-red-800 bg-red-100 border border-red-300 rounded p-2">
                      {warning}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-700 mt-2">
                  <strong>Note:</strong> You can still proceed, but this will exceed partner targets.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installation Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    {...register('date', { 
                      required: 'Installation date is required',
                      min: { value: getKSADate(), message: 'Date must be today or in the future' }
                    })}
                    type="date"
                    min={getKSADate()}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              {/* Multi-slot Allocation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installation Slots <span className="text-xs text-gray-500">(Rate: {selectedVendor?.boxes_per_hour || 0} boxes/hour)</span>
                </label>
                <div className="space-y-2">
                  {allocations.length === 0 && (
                    <div className="text-sm text-gray-500">{loadingSlots ? 'Loading slots...' : 'No slots available for this date/vendor'}</div>
                  )}
                  {allocations.map((a) => (
                    <div key={`${a.start}-${a.end}`} className={`flex items-center justify-between border rounded-lg p-2 ${a.available === 0 ? 'opacity-60' : ''}`}>
                      <div className="text-sm">
                        <div className="font-medium">{a.start} - {a.end}</div>
                        <div className="text-gray-600">available {a.available}/{a.capacity} (booked {a.booked})</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button type="button" className="px-2 py-1 bg-gray-100 rounded" onClick={() => setClampedCount(a.start, (a.count || 0) - 1)} disabled={a.count <= 0}>-</button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={String(a.count)}
                          onChange={e => {
                            const digits = e.target.value.replace(/[^0-9]/g, '');
                            const num = digits === '' ? 0 : parseInt(digits, 10);
                            const desired = isNaN(num) ? 0 : num;
                            setClampedCount(a.start, desired);
                          }}
                          className="w-16 text-center border rounded px-2 py-1"
                          disabled={a.available === 0}
                        />
                        <button type="button" className="px-2 py-1 bg-gray-100 rounded" onClick={() => setClampedCount(a.start, (a.count || 0) + 1)} disabled={a.count >= a.available || remainingToAllocate <= 0}>+</button>
                      </div>
                    </div>
                  ))}

                  {allocations.length > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm">
                        <span className="font-medium">Allocated:</span> {totalAllocated} / {riders.length}
                        {remainingToAllocate > 0 && <span className="ml-2 text-orange-700">({remainingToAllocate} remaining)</span>}
                      </div>
                      <button
                        type="button"
                        className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded"
                        onClick={() => {
                          // Autofill greedily from earliest slots
                          let remaining = riders.length;
                          const filled = allocations.map(s => ({ ...s, count: 0 }));
                          for (let i = 0; i < filled.length && remaining > 0; i++) {
                            const take = Math.min(filled[i].available, remaining);
                            filled[i].count = take;
                            remaining -= take;
                          }
                          setAllocations(filled);
                        }}
                        disabled={allocations.every(a => a.available === 0)}
                      >
                        Autofill
                      </button>
                    </div>
                  )}
                </div>
                {slotCapacityError && (
                  <p className="text-red-600 text-sm mt-1">{slotCapacityError}</p>
                )}
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installation Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    {...register('location', { 
                      required: 'Installation location is required',
                      minLength: { value: 10, message: 'Please provide a detailed location' }
                    })}
                    rows={3}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Enter installation location address or paste Google Maps link..."
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
                  <strong>📦 Bulk Action:</strong> This will schedule installation for all {riders.length} eligible riders
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
                  disabled={
                    isSubmitting ||
                    (selectedVendor && riders.length > selectedVendor.max_boxes_per_day) ||
                    !!slotCapacityError ||
                    allocations.length === 0 ||
                    totalAllocated !== riders.length ||
                    allocations.some(a => a.count > a.available)
                  }
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedVendor && riders.length > selectedVendor.max_boxes_per_day
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting ? 'Scheduling...' :
                   selectedVendor && riders.length > selectedVendor.max_boxes_per_day ?
                   `Cannot Schedule (${riders.length} > ${selectedVendor.max_boxes_per_day})` :
                   `Schedule ${riders.length} Riders`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <AddVendorForm
        isOpen={showAddVendorForm}
        onClose={() => setShowAddVendorForm(false)}
        onSuccess={handleAddVendorSuccess}
      />
    </>
  );
}