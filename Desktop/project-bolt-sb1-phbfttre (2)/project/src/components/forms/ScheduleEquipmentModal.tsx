import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, Package, Plus, Minus, ShoppingCart, Building } from 'lucide-react';
import { usePartners } from '../../hooks/usePartners';
import { usePartnerCapacity } from '../../hooks/usePartners';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface ScheduleEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scheduleData: any) => void;
  riders: any[];
}

interface ScheduleFormData {
  date: string;
  time: string;
  location: string;
  partner_id: string;
}

interface EquipmentItem {
  name: string;
  sizes: { [size: string]: number };
}

// Will be populated dynamically from DB (equipment_items)
const FALLBACK_CATALOG = [
  { name: 'Safety Helmets', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Branded T-Shirts', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Riding Pants', sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  { name: 'Gloves', sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
];

export function ScheduleEquipmentModal({ isOpen, onClose, onSuccess, riders }: ScheduleEquipmentModalProps) {
  const { partners, loading: partnersLoading } = usePartners();
  const { checkPartnerCapacity } = usePartnerCapacity();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem[]>([]);
  const [capacityWarnings, setCapacityWarnings] = useState<string[]>([]);
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [isPartnerFixed, setIsPartnerFixed] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalog, setCatalog] = useState<{ id: string; name: string; sizes: string[] }[]>([]);
  const [availableMap, setAvailableMap] = useState<Map<string, number>>(new Map()); // key: `${id}|${size}` => count
  const ridersCount = riders?.length || 0;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ScheduleFormData>();
  // Load equipment items and stock levels
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoadingCatalog(true);
      try {
        const [itemsRes, levelsRes] = await Promise.all([
          supabase.from('equipment_items').select('id,name,sizes,inactive_sizes,is_active').order('name'),
          supabase.from('equipment_stock_levels').select('*'),
        ]);
        const items = (itemsRes.data || []).filter((i: any) => i.is_active !== false);
        let mapped = items.map((i: any) => ({ id: i.id, name: i.name, sizes: Array.isArray(i.sizes) ? i.sizes : ['One Size'], inactive_sizes: Array.isArray(i.inactive_sizes) ? i.inactive_sizes : [] }));
        // Ensure XXXL exists for Riding Pants / Pants and Gloves in UI
        mapped = mapped.map((it: any) => {
          const name = String(it.name || '').toLowerCase();
          const needXXXL = name.includes('riding pants') || name === 'pants' || name.includes('gloves');
          if (needXXXL) {
            const sizes = Array.isArray(it.sizes) ? [...it.sizes] : ['One Size'];
            if (!sizes.includes('XXXL')) sizes.push('XXXL');
            return { ...it, sizes };
          }
          return it;
        });
        setCatalog(mapped.length ? mapped : FALLBACK_CATALOG.map((f, idx) => ({ id: `fallback-${idx}`, ...f })) as any);
        const m = new Map<string, number>();
        (levelsRes.data || []).forEach((lvl: any) => {
          m.set(`${lvl.equipment_item_id}|${lvl.size}`, Number(lvl.stock_count) || 0);
        });
        setAvailableMap(m);
      } catch (e) {
        console.error('Failed to load equipment catalog/levels', e);
        setCatalog(FALLBACK_CATALOG.map((f, idx) => ({ id: `fallback-${idx}`, ...f })) as any);
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, [isOpen]);

  const idByName = useMemo(() => {
    const map = new Map<string, string>();
    catalog.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [catalog]);

  const getAvailableFor = (name: string, size: string): number => {
    const id = idByName.get(name);
    if (!id) return 0;
    const key = `${id}|${size || 'N/A'}`;
    return availableMap.get(key) || 0;
  };

  const isSingleRider = !!(riders && riders.length === 1);
  const singleRider = isSingleRider ? riders[0] : null;
  const isEditMode = !!(
    isSingleRider &&
    (singleRider?.data?.equipment_scheduled_date || singleRider?.data?.equipment_allocated_items?.length > 0)
  );

  // Get current date in KSA timezone (GMT+3)
  const getKSADate = () => {
    const now = new Date();
    const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for KSA timezone
    return ksaTime.toISOString().split('T')[0];
  };

  // Get current time in KSA timezone (IST - 2.5 hours)
  const getKSATime = () => {
    const now = new Date();
    // System is already running in IST timezone
    // KSA is UTC+3:00, which is IST - 2.5 hours
    // So KSA = Current IST time - 2.5 hours
    const ksaTime = new Date(now.getTime() - (2.5 * 60 * 60 * 1000)); // KSA = IST - 2.5 hours
    return ksaTime.toTimeString().slice(0, 5);
  };

  // Set default values when modal opens (prefill in edit mode)
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && singleRider) {
      const existingDate = singleRider.data?.equipment_scheduled_date;
      const existingTime = singleRider.data?.equipment_scheduled_time;
      const existingLocation = singleRider.data?.equipment_location;

      if (existingDate) setValue('date', existingDate);
      else setValue('date', getKSADate());

      if (existingTime) setValue('time', existingTime);
      else setValue('time', getKSATime());

      if (existingLocation) setValue('location', existingLocation);
      else setValue('location', 'Equipment Distribution Center - Qatar');

      // Handle existing equipment data with proper structure validation
      const existingEquipment: EquipmentItem[] = [];
      if (singleRider.data?.equipment_allocated_items && Array.isArray(singleRider.data.equipment_allocated_items)) {
        singleRider.data.equipment_allocated_items.forEach((item: any) => {
          if (item && item.name) {
            // Handle different possible data structures
            let sizes: Record<string, number> = {};
            
            if (item.sizes && typeof item.sizes === 'object') {
              // If sizes is already an object with size:quantity mapping
              if (typeof item.sizes === 'object' && !Array.isArray(item.sizes)) {
                sizes = { ...item.sizes };
              } else if (Array.isArray(item.sizes)) {
                // If sizes is an array, convert to object with default quantity 1
                sizes = { [item.sizes[0] || 'One Size']: 1 };
              }
            } else if (item.size && item.quantity) {
              // If using size and quantity fields
              sizes = { [item.size]: item.quantity };
            } else if (item.size) {
              // If only size is available
              sizes = { [item.size]: 1 };
            }
            
            // Ensure we have at least one size with quantity >= 1
            if (Object.keys(sizes).length === 0) {
              sizes = { 'One Size': 1 };
            }
            
            // Ensure all quantities are at least 1
            Object.keys(sizes).forEach(size => {
              if (sizes[size] < 1) sizes[size] = 1;
            });
            
            existingEquipment.push({
              name: item.name,
              sizes: sizes
            });
          }
        });
      }
      
      if (existingEquipment.length > 0) {
        console.log('🔍 EDIT MODE: Loaded existing equipment:', existingEquipment);
        setSelectedEquipment(existingEquipment);
      } else {
        console.log('🔍 EDIT MODE: No existing equipment found, starting fresh');
        setSelectedEquipment([]);
      }
      
      // In edit mode, keep partner fixed if available
      setIsPartnerFixed(true);
    } else {
      // New schedule / bulk mode defaults
      setValue('date', getKSADate());
      setValue('time', getKSATime());
      setValue('location', 'Equipment Distribution Center - Qatar');
      setSelectedEquipment([]);
      setIsPartnerFixed(false);
    }
  }, [isOpen, isEditMode, singleRider, setValue]);

  // Auto-select partner from current rider(s) when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!riders || riders.length === 0) return;
    if (!partners || partnersLoading) return;

    // Build candidate partner ids in priority order: equipment_partner_id first, then partner_id
    const candidateIds = riders
      .flatMap((rider) => [rider?.data?.equipment_partner_id, rider?.data?.partner_id])
      .filter((id): id is string => Boolean(id));

    const uniqueCandidateIds = Array.from(new Set(candidateIds));

    const openPartners = new Set(
      partners
        ?.filter((p) => p.business_status === 'Open')
        .map((p) => p.partner_id) || []
    );

    const preferredPartnerId = uniqueCandidateIds.find((id) => openPartners.has(id));
    if (preferredPartnerId) {
      setValue('partner_id', preferredPartnerId);
      setIsPartnerFixed(true);
    } else {
      setIsPartnerFixed(false);
    }
  }, [isOpen, riders, partners, partnersLoading, setValue]);

  // Check partner capacity when riders change
  useEffect(() => {
    if (riders && riders.length > 0) {
      checkRidersCapacity();
    }
  }, [riders]);

  const checkRidersCapacity = async () => {
    if (!riders || riders.length === 0) return;
    
    setCheckingCapacity(true);
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
        // Check car capacity
        if (counts.car > 0) {
          const carCapacity = await checkPartnerCapacity(partnerId, 'Car', counts.car);
          if (!carCapacity.can_schedule) {
            warnings.push(`🚗 ${carCapacity.partner_name}: ${carCapacity.error}`);
          }
        }
        
        // Check bike capacity
        if (counts.bike > 0) {
          const bikeCapacity = await checkPartnerCapacity(partnerId, 'Motorcycle', counts.bike);
          if (!bikeCapacity.can_schedule) {
            warnings.push(`🏍️ ${bikeCapacity.partner_name}: ${bikeCapacity.error}`);
          }
        }
      }
      
      setCapacityWarnings(warnings);
    } catch (error) {
      console.error('Error checking partner capacity:', error);
    } finally {
      setCheckingCapacity(false);
    }
  };

  const addEquipmentItem = (equipmentName: string) => {
    const catalogItem = catalog.find(item => item.name === equipmentName);
    if (!catalogItem) return;

    const existingItem = selectedEquipment.find(item => item.name === equipmentName);
    if (existingItem) {
      toast.error('Equipment item already added');
      return;
    }

    // Initialize with only the first size selected and count 1 (mandatory)
    const firstSize = catalogItem.sizes[0] || 'One Size';
    const newItem: EquipmentItem = {
      name: equipmentName,
      sizes: { [firstSize]: 1 } // Start with 1 count for first size
    };

    setSelectedEquipment([...selectedEquipment, newItem]);
  };

  const removeEquipmentItem = (equipmentName: string) => {
    setSelectedEquipment(selectedEquipment.filter(item => item.name !== equipmentName));
  };

  const getMaxQuantityForItem = (equipmentName: string) => {
    const name = (equipmentName || '').trim().toLowerCase();
    if (name === 'branded t-shirts' || name === 'pants' || name === 'riding pants') {
      return 2;
    }
    return 1; // Maximum for all other items
  };

  const updateEquipmentQuantity = (equipmentName: string, size: string, quantity: number) => {
    const maxQuantity = getMaxQuantityForItem(equipmentName);
    // Stock-aware cap per rider
    const totalAvailable = getAvailableFor(equipmentName, size);
    const perRiderCap = ridersCount > 0 ? Math.floor(totalAvailable / ridersCount) : totalAvailable;
    const effectiveCap = Math.min(maxQuantity, Math.max(0, perRiderCap));
    
    // Ensure quantity is at least 1 (mandatory)
    const finalQuantity = Math.max(1, Math.min(effectiveCap, quantity));
    
    setSelectedEquipment(selectedEquipment.map(item => 
      item.name === equipmentName 
        ? { ...item, sizes: { [size]: finalQuantity } } // Only one size per equipment
        : item
    ));
  };

  // Add function to change size for an equipment item
  const changeEquipmentSize = (equipmentName: string, newSize: string) => {
    const catalogItem = catalog.find(item => item.name === equipmentName);
    if (!catalogItem) return;

    // Check if new size is available
    if (!catalogItem.sizes.includes(newSize)) return;

    // Get available stock for new size
    const totalAvailable = getAvailableFor(equipmentName, newSize);
    const perRiderCap = ridersCount > 0 ? Math.floor(totalAvailable / ridersCount) : totalAvailable;
    const maxQuantity = getMaxQuantityForItem(equipmentName);
    const effectiveCap = Math.min(maxQuantity, Math.max(1, perRiderCap));

    setSelectedEquipment(selectedEquipment.map(item => 
      item.name === equipmentName 
        ? { ...item, sizes: { [newSize]: Math.min(1, effectiveCap) } } // Reset to 1 for new size
        : item
    ));
  };

  const getTotalItemsForEquipment = (equipment: EquipmentItem) => {
    return Object.values(equipment.sizes).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalItemsOverall = () => {
    return selectedEquipment.reduce((total, equipment) => 
      total + getTotalItemsForEquipment(equipment), 0
    );
  };

  const onSubmit = async (data: ScheduleFormData) => {
    // Validate equipment allocation - ensure each equipment has exactly one size with count >= 1
    if (selectedEquipment.length === 0) {
      toast.error('Please allocate at least one equipment item');
      return;
    }

    // Check that each equipment has exactly one size with count >= 1
    const invalidEquipment = selectedEquipment.filter(eq => {
      const sizeCounts = Object.values(eq.sizes);
      const totalCount = sizeCounts.reduce((sum, qty) => sum + qty, 0);
      return totalCount < 1 || sizeCounts.length !== 1;
    });

    if (invalidEquipment.length > 0) {
      toast.error('Each equipment item must have exactly one size selected with a count of at least 1');
      return;
    }

    // Check that all selected equipment has available stock
    const outOfStockEquipment = selectedEquipment.filter(eq => {
      const size = Object.keys(eq.sizes)[0];
      const available = getAvailableFor(eq.name, size);
      return available <= 0;
    });

    if (outOfStockEquipment.length > 0) {
      toast.error(`Cannot proceed: ${outOfStockEquipment.map(eq => eq.name).join(', ')} are out of stock. Please remove these items or select different sizes.`);
      return;
    }

    // Verify stock availability for all selections
    const shortages: string[] = [];
    selectedEquipment.forEach((eq) => {
      Object.entries(eq.sizes).forEach(([size, qty]) => {
        const q = Number(qty) || 0;
        if (q <= 0) return;
        const totalNeed = q * ridersCount;
        const available = getAvailableFor(eq.name, size);
        if (available < totalNeed) {
          shortages.push(`${eq.name} ${size}: need ${totalNeed}, available ${available}`);
        }
      });
    });
    if (shortages.length) {
      toast.error(`Insufficient stock for:\n${shortages.join('\n')}`);
      return;
    }

    // Check if there are capacity warnings
    if (capacityWarnings.length > 0) {
      const proceed = confirm(
        `⚠️ PARTNER CAPACITY WARNING!\n\n${capacityWarnings.join('\n\n')}\n\nDo you want to proceed anyway? This will exceed partner targets.`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      // Calculate IST time (KSA - 2.5 hours)
      const now = new Date();
      const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // KSA time (GMT+3)
      const istTime = new Date(ksaTime.getTime() - (2.5 * 60 * 60 * 1000)); // IST time (KSA - 2.5 hours)

      // Deduct stock: create distribution transactions (negative quantity)
      const txPayload: any[] = [];
      selectedEquipment.forEach((eq) => {
        const itemId = idByName.get(eq.name);
        if (!itemId) return;
        Object.entries(eq.sizes).forEach(([size, qty]) => {
          const q = Number(qty) || 0;
          if (q <= 0) return;
          txPayload.push({
            equipment_item_id: itemId,
            size: size === 'N/A' ? null : size,
            transaction_type: 'distribution',
            quantity: -Math.abs(q * ridersCount),
            notes: `Auto deduction for ${ridersCount} rider(s)`,
            reference_type: 'distribution',
            created_at: istTime.toISOString(), // Use IST time
          });
        });
      });
      if (txPayload.length) {
        // Batch insert with chunks
        const batchSize = 200;
        for (let i = 0; i < txPayload.length; i += batchSize) {
          const slice = txPayload.slice(i, i + batchSize);
          const { error } = await supabase.from('equipment_stock_transactions').insert(slice as any);
          if (error) throw error;
        }
      }

      await onSuccess({
        date: data.date,
        time: data.time,
        location: data.location,
        partner_id: data.partner_id,
        equipment: selectedEquipment,
        timezone: 'IST (KSA - 2.5 hours)',
        collection_time: istTime.toISOString()
      });
      reset();
    } catch (error) {
      console.error('Error saving equipment completion:', error);
      toast.error('Failed to save equipment completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !riders || riders.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Equipment Distribution' : 'Complete Bulk Equipment Distribution'}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Riders Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-900">{isEditMode ? 'Edit Completion' : 'Bulk Equipment Distribution Completion'}</h3>
                <p className="text-sm text-purple-700">
                  {isEditMode
                    ? `Editing schedule for ${singleRider?.data?.rider_name || 'Unknown'} (${singleRider?.rider_id})`
                     : `Marking equipment distribution Completed for ${riders.length} eligible rider(s)`}
                </p>
              </div>
            </div>
            {!isEditMode && (
              <div className="max-h-32 overflow-y-auto">
                <div className="space-y-1">
                  {riders.slice(0, 5).map((rider) => (
                    <div key={rider.rider_id} className="text-xs text-purple-700">
                      • {rider.data?.rider_name || 'Unknown'} ({rider.rider_id}) - Training: {rider.data?.training_status || 'N/A'}
                    </div>
                  ))}
                  {riders.length > 5 && (
                    <div className="text-xs text-purple-600 font-medium">
                      ... and {riders.length - 5} more riders
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Partner Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Distribution Partner *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('partner_id', { required: 'Please select a distribution partner' })}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={partnersLoading || isPartnerFixed}
              >
                <option value="">
                  {partnersLoading ? 'Loading partners...' : `Select partner (${partners?.filter(p => p.business_status === 'Open').length || 0} available)`}
                </option>
                {partners?.filter(p => p.business_status === 'Open').map((partner) => (
                  <option key={partner.id} value={partner.partner_id}>
                    {partner.partner_name || partner.name} - {partner.city || partner.location}
                  </option>
                ))}
              </select>
            </div>
            {errors.partner_id && (
              <p className="text-red-600 text-sm mt-1">{errors.partner_id.message}</p>
            )}
            {isPartnerFixed && (
              <p className="text-xs text-gray-500 mt-1">Partner is fixed based on the selected rider(s).</p>
            )}
            {(!partners || partners.filter(p => p.business_status === 'Open').length === 0) && !partnersLoading && (
              <p className="text-sm text-gray-500 mt-1">
                No active partners available. Only partners with "Open" business status can distribute equipment.
              </p>
            )}
          </div>

          {/* Partner Capacity Warnings */}
          {checkingCapacity && (
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
            {/* Equipment Allocation Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Equipment Allocation</h3>
                <div className="text-sm text-purple-600 font-medium">
                  Total Items: {getTotalItemsOverall()}
                </div>
              </div>

              {/* Add Equipment Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Equipment Items
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(loadingCatalog ? FALLBACK_CATALOG : catalog).map((item) => {
                      const isSelected = selectedEquipment.find(selected => selected.name === item.name);
                      // Check if any size has stock
                      const hasStock = item.sizes.some(size => {
                        const available = getAvailableFor(item.name, size);
                        return available > 0;
                      });
                      
                      return (
                        <label key={item.name} className={`flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors ${
                          hasStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addEquipmentItem(item.name);
                              } else {
                                removeEquipmentItem(item.name);
                              }
                            }}
                            disabled={!hasStock}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${hasStock ? 'text-gray-900' : 'text-gray-500'}`}>
                              {item.name}
                              {!hasStock && <span className="text-red-600 ml-2">(Out of Stock)</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              Sizes: {item.sizes.join(', ')}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected Equipment Items */}
              {selectedEquipment.length > 0 && (
                <div className="space-y-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {selectedEquipment.map((equipment) => {
                    const currentSize = Object.keys(equipment.sizes)[0];
                    const currentQuantity = equipment.sizes[currentSize] || 0;
                    const catalogItem = catalog.find(c => c.name === equipment.name);
                    
                    return (
                      <div key={equipment.name} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-purple-600" />
                            <h4 className="font-medium text-gray-900">{equipment.name}</h4>
                            <span className="text-sm text-purple-600 font-medium">
                              ({currentQuantity} items)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEquipmentItem(equipment.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Size Selection */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Size *
                          </label>
                          <select
                            value={currentSize}
                            onChange={(e) => changeEquipmentSize(equipment.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            {catalogItem?.sizes.map((size) => {
                              const totalAvailable = getAvailableFor(equipment.name, size);
                              const perRiderCap = ridersCount > 0 ? Math.floor(totalAvailable / ridersCount) : totalAvailable;
                              const cap = Math.min(getMaxQuantityForItem(equipment.name), Math.max(1, perRiderCap));
                              const isAvailable = cap > 0;
                              
                              return (
                                <option 
                                  key={size} 
                                  value={size}
                                  disabled={!isAvailable}
                                >
                                  {size} {!isAvailable ? '(Out of stock)' : `(Max: ${cap} per rider)`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        {/* Quantity for Selected Size */}
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium w-16 flex-shrink-0">
                            <span className={getAvailableFor(equipment.name, currentSize) > 0 ? "text-gray-700" : "text-red-600"}>
                              Quantity:
                            </span>
                          </label>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => updateEquipmentQuantity(equipment.name, currentSize, currentQuantity - 1)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              disabled={currentQuantity <= 1 || getAvailableFor(equipment.name, currentSize) <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={getMaxQuantityForItem(equipment.name)}
                              value={currentQuantity}
                              onChange={(e) => updateEquipmentQuantity(equipment.name, currentSize, parseInt(e.target.value) || 1)}
                              className={`w-14 px-2 py-1 text-center border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                getAvailableFor(equipment.name, currentSize) <= 0 
                                  ? 'border-red-300 bg-red-50 text-red-600 cursor-not-allowed' 
                                  : 'border-gray-300'
                              }`}
                              disabled={getAvailableFor(equipment.name, currentSize) <= 0}
                            />
                            <button
                              type="button"
                              onClick={() => updateEquipmentQuantity(equipment.name, currentSize, currentQuantity + 1)}
                              className="p-1 text-gray-400 hover:text-gray-700"
                              disabled={currentQuantity >= getMaxQuantityForItem(equipment.name) || getAvailableFor(equipment.name, currentSize) <= 0}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className={`text-xs ${getAvailableFor(equipment.name, currentSize) > 0 ? "text-gray-500" : "text-red-600"}`}>
                            Max: {getMaxQuantityForItem(equipment.name)} per rider
                          </span>
                        </div>
                        
                        {/* Stock Info */}
                        <div className="mt-2">
                          {getAvailableFor(equipment.name, currentSize) > 0 ? (
                            <div className="text-xs text-gray-500">
                              Available: {getAvailableFor(equipment.name, currentSize)} total • 
                              Per rider max: {Math.min(getMaxQuantityForItem(equipment.name), Math.max(1, Math.floor(getAvailableFor(equipment.name, currentSize) / ridersCount)))}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                              ⚠️ This size is not available in stock. Please select a different size or remove this equipment item.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedEquipment.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No equipment items selected</p>
                  <p className="text-gray-500 text-xs">Use the dropdown above to add equipment items</p>
                </div>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('date', { 
                    required: 'Collection date is required',
                    min: { value: getKSADate(), message: 'Date must be today or in the future' }
                  })}
                  type="date"
                  min={getKSADate()}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Time * <span className="text-xs text-gray-500">(KSA Timezone - Auto-calculated from IST - 2.5 hours)</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('time', { required: 'Collection time is required' })}
                  type="time"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {errors.time && (
                <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>
              )}
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  {...register('location', { 
                    required: 'Collection location is required',
                    minLength: { value: 10, message: 'Please provide a detailed location' }
                  })}
                  rows={3}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Enter equipment collection location address or paste Google Maps link..."
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
                <strong>⏰ Timezone:</strong> Collection time is auto-calculated as IST - 2.5 hours (KSA timezone), system timestamps use IST<br/>
                <strong>📦 Bulk Action:</strong> This will mark equipment distribution as Completed for all {riders.length} eligible riders<br/>
                <strong>🎓 Prerequisite:</strong> Only riders who completed training are eligible for equipment collection<br/>
                <strong>📏 Size Selection:</strong> Each equipment item must have exactly one size selected with a minimum quantity of 1
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
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting
                  ? (isEditMode ? 'Saving...' : 'Completing...')
                  : (isEditMode ? 'Save Changes' : `Mark Completed for ${riders.length} Riders`)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}