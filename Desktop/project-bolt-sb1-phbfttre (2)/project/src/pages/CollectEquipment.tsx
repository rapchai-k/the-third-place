  import { useState, useEffect } from 'react';
  import { DataTable } from '../components/common/DataTable';
  import { FilterPanel } from '../components/common/FilterPanel';
  import { Package, Phone, CalendarPlus, CheckSquare, Square, Users, ClipboardList, Eye, X, Calendar, Clock, MapPin, Pencil } from 'lucide-react';
  import { supabase } from '../lib/supabase';
  import { useAuth } from '../hooks/useAuth';
  import { useRiders } from '../hooks/useRiders';
  import { usePartners } from '../hooks/usePartners';
  import { ScheduleEquipmentModal } from '../components/forms/ScheduleEquipmentModal';
  import toast from 'react-hot-toast';

  export function CollectEquipment() {
    const { riders, dynamicOptions, totalCount } = useRiders();
    const { user } = useAuth();
    const { partners } = usePartners();
    const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'eligible' | 'scheduled'>('eligible');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRiderDetails, setSelectedRiderDetails] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRider, setEditRider] = useState<any | null>(null);
    const [equipmentActive, setEquipmentActive] = useState<boolean | null>(null);

    useEffect(() => {
      // Check if any equipment items are active; if none, hide this module content
      (async () => {
        try {
          const { data, error } = await supabase
            .from('equipment_items')
            .select('id')
            .eq('is_active', true)
            .limit(1);
          if (error) throw error;
          setEquipmentActive((data || []).length > 0);
        } catch (err) {
          console.error('Failed to check equipment activity', err);
          setEquipmentActive(false);
        }
      })();
    }, []);

    useEffect(() => {
      processEquipmentEligibleRiders();
    }, [riders, partners, equipmentActive]);
    
    // Verification: Log equipment data
    useEffect(() => {
      if (riders && riders.length > 0) {
        console.log(`🔍 EQUIPMENT VERIFICATION: Processing ${riders.length} total riders for equipment eligibility`);
        if (riders.length < 5000) {
          console.warn(`⚠️ EQUIPMENT WARNING: Only ${riders.length} riders available, expected 5000+`);
        }
      }
    }, [riders]);

    const processEquipmentEligibleRiders = () => {
      if (equipmentActive === false) {
        setEligibleRiders([]);
        setLoading(false);
        return;
      }

      if (!riders || riders.length === 0) {
        setEligibleRiders([]);
        setLoading(false);
        return;
      }

      // Don't process if partners are still loading
      if (!partners) {
        console.log('⏳ Waiting for partners data to load...');
        return;
      }

      console.log('=== EQUIPMENT COLLECTION ELIGIBILITY PROCESSING ===');
      console.log('Processing ALL riders for equipment eligibility:', riders?.length || 0);
      
      if (riders && riders.length > 0) {
        console.log('Sample rider data:', riders[0].data);
        console.log('Available columns:', Object.keys(riders[0].data));
      }

      try {
        // Filter riders with equipment_status = 'Eligible' OR 'Completed', exclude resigned, AND partner business_status = 'Open'
        const equipmentRiders = riders.filter(rider => {
          const data = rider.data;
          const jobStatus = String(data.job_status || '').toLowerCase();
          if (jobStatus.startsWith('resign')) {
            return false;
          }
          const equipmentStatus = String(data.equipment_status || '').toLowerCase().trim();
          const isVisible = equipmentStatus === 'eligible' || equipmentStatus === 'completed';
          
          // Check partner business status
          if (isVisible) {
            const riderPartnerId = data.partner_id;
            if (riderPartnerId && partners.length > 0) {
              const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
              if (matchedPartner && matchedPartner.business_status !== 'Open') {
                console.log(`❌ Equipment rider ${data.rider_id} excluded - Partner business status: ${matchedPartner.business_status}`);
                return false;
              }
            } else if (riderPartnerId) {
              console.log(`⚠️ Equipment rider ${data.rider_id} - Partner ${riderPartnerId} not found in partners list`);
            }
          }
          
          if (isVisible) {
            console.log(`✅ Equipment visible rider: ${data.rider_id} - Status: ${data.equipment_status}`);
          }
          
          return isVisible;
        });

        console.log(`Equipment visible riders (Eligible + Scheduled + Open Partners): ${equipmentRiders.length} out of ${riders?.length || 0} total`);
        setEligibleRiders(equipmentRiders);
      } catch (error) {
        console.error('Error processing equipment eligible riders:', error);
        setEligibleRiders([]);
        toast.error('Failed to process equipment eligible riders');
      } finally {
        setLoading(false);
      }
    };

    // Separate riders by status
    const eligibleOnlyRiders = eligibleRiders.filter(rider => 
      rider.data.equipment_status === 'Eligible'
    );
    
    const scheduledOnlyRiders = eligibleRiders.filter(rider => 
      rider.data.equipment_status === 'Completed'
    );

    // Get current tab riders
    const getCurrentTabRiders = () => {
      return activeTab === 'eligible' ? eligibleOnlyRiders : scheduledOnlyRiders;
    };

    // Apply filters to current tab riders
    const filteredRiders = getCurrentTabRiders().filter(rider => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return rider.data[key] === value;
      });
    });

    // Reset selection when tab changes
    useEffect(() => {
      setSelectedRiderIds(new Set());
    }, [activeTab]);

    const showEquipmentDetails = (rider: any) => {
      setSelectedRiderDetails(rider);
      setShowDetailsModal(true);
    };

    const handleBulkScheduleEquipment = () => {
      const selectedEligibleRiders = filteredRiders.filter(rider => 
        selectedRiderIds.has(rider.rider_id) && rider.data.equipment_status === 'Eligible'
      );
      
      if (selectedEligibleRiders.length === 0) {
        toast.error('Please select eligible riders for scheduling');
        return;
      }
      
      setShowScheduleModal(true);
    };

    const handleSelectAll = () => {
      const eligibleRiderIds = (activeTab === 'eligible' ? filteredRiders : [])
        .filter(rider => rider.data.equipment_status === 'Eligible')
        .map(rider => rider.rider_id);
      
      if (selectedRiderIds.size === eligibleRiderIds.length) {
        // Deselect all
        setSelectedRiderIds(new Set());
      } else {
        // Select all eligible
        setSelectedRiderIds(new Set(eligibleRiderIds));
      }
    };

    const handleRowSelect = (riderId: string) => {
      const newSelected = new Set(selectedRiderIds);
      if (newSelected.has(riderId)) {
        newSelected.delete(riderId);
      } else {
        newSelected.add(riderId);
      }
      setSelectedRiderIds(newSelected);
    };

    const handleScheduleSuccess = async (scheduleData: any) => {
      const selectedRiders = filteredRiders.filter(rider => 
        selectedRiderIds.has(rider.rider_id) && rider.data.equipment_status === 'Eligible'
      );
      
      if (!selectedRiders.length) return;
      
      // Validate partner business status before scheduling
      const invalidRiders = selectedRiders.filter(rider => {
        const riderPartnerId = rider.data.partner_id;
        if (riderPartnerId && partners && partners.length > 0) {
          const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
          return matchedPartner && matchedPartner.business_status !== 'Open';
        }
        return false;
      });
      
      if (invalidRiders.length > 0) {
        toast.error(`Cannot complete equipment distribution: ${invalidRiders.length} riders have partners with closed business status`);
        return;
      }
      
      try {
        let successCount = 0;
        
        // Calculate IST time (KSA - 2.5 hours) for updated_at
        const now = new Date();
        const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // KSA time (GMT+3)
        const istTime = new Date(ksaTime.getTime() - (2.5 * 60 * 60 * 1000)); // IST time (KSA - 2.5 hours)
        
        // Update all selected riders as Completed
        for (const rider of selectedRiders) {
          try {
            // Update all equipment data at once
            const updatedData = {
              ...rider.data,
              equipment_status: 'Completed',
              equipment_completion_date: scheduleData.date,
              equipment_completion_time: scheduleData.time,
              equipment_distributed_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
              equipment_location: scheduleData.location,
              equipment_partner_id: scheduleData.partner_id,
              equipment_allocated_items: scheduleData.equipment || [],
              equipment_total_items: scheduleData.equipment ? 
                (scheduleData.equipment as Array<{ sizes: Record<string, number> }>).reduce((total: number, item: { sizes: Record<string, number> }) => 
                  total + Object.values(item.sizes as Record<string, number>).reduce((sum: number, qty: number) => sum + qty, 0), 0
                ) : 0,
              last_updated_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
              last_updated_at: istTime.toISOString() // Use IST time
            };

            const { error } = await supabase
              .from('riders')
              .update({ 
                data: updatedData,
                updated_at: istTime.toISOString() // Use IST time for updated_at
              })
              .eq('rider_id', rider.rider_id);

            if (error) {
              console.error('Error updating rider:', rider.rider_id, error);
            } else {
              console.log('✅ Successfully marked equipment distribution Completed for rider:', rider.rider_id);
              successCount++;
            }
          } catch (error) {
            console.error('Error processing rider:', rider.rider_id, error);
          }
        }
        
        if (successCount > 0) {
          toast.success(`Equipment distribution completed for ${successCount} rider(s)`);
          setSelectedRiderIds(new Set()); // Clear selection after successful scheduling
          
          // Refresh the riders data to show updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error('Failed to complete equipment distribution for any riders');
        }
          
        setShowScheduleModal(false);
      } catch (error) {
        console.error('Error completing equipment distribution:', error);
        toast.error('Failed to complete equipment distribution');
      }
    };

    const filterOptions = [
      {
        key: 'nationality_code',
        label: 'Nationality',
        type: 'select' as const,
        options: dynamicOptions.nationality_code || []
      },
      {
        key: 'delivery_type',
        label: 'Delivery Type',
        type: 'select' as const,
        options: dynamicOptions.delivery_type || []
      },
      {
        key: 'audit_status',
        label: 'Audit Status',
        type: 'select' as const,
        options: dynamicOptions.audit_status || []
      },
      {
        key: 'job_status',
        label: 'Job Status',
        type: 'select' as const,
        options: dynamicOptions.job_status || []
      },
      {
        key: 'equipment_status',
        label: 'Equipment Status',
        type: 'select' as const,
        options: [
          { value: 'Eligible', label: 'Eligible' },
          { value: 'Completed', label: 'Completed' },
        ],
      },
    ];

    // Transform rider data for display
    const displayData = filteredRiders.map(rider => ({
      id: rider.id,
      rider_id: rider.rider_id || 'N/A',
      rider_name: rider.data.rider_name || 'N/A',
      phone: rider.data.mobile || 'N/A',
      identity_card_number: rider.data.identity_card_number || 'N/A',
      audit_status: rider.data.audit_status || 'N/A',
      job_status: rider.data.job_status || 'N/A',
      delivery_type: rider.data.delivery_type || 'N/A',
      training_status: rider.data.training_status || 'N/A',
      equipment_status: rider.data.equipment_status || 'N/A',
      equipment_completion_date: rider.data.equipment_completion_date || rider.data.equipment_scheduled_date || null,
      equipment_completion_time: rider.data.equipment_completion_time || rider.data.equipment_scheduled_time || null,
      equipment_location: rider.data.equipment_location || null,
      last_updated_by: rider.data.last_updated_by || rider.data.equipment_distributed_by || null,
      originalRider: rider,
      isEligible: rider.data.equipment_status === 'Eligible'
    }));

    const eligibleCount = eligibleOnlyRiders.length;
    const scheduledCount = scheduledOnlyRiders.length;
    const selectedEligibleCount = displayData.filter(rider => 
      selectedRiderIds.has(rider.rider_id) && rider.isEligible
    ).length;

    const columns = [
      {
        key: 'select',
        label: (
          <div className="flex items-center space-x-2">
            {activeTab === 'eligible' && <button
              onClick={handleSelectAll}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedRiderIds.size === eligibleCount && eligibleCount > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>All</span>
            </button>}
          </div>
        ),
        render: (_value: any, row: any) => (
          <div className="flex items-center">
            {row.isEligible ? (
              <button
                onClick={() => handleRowSelect(row.rider_id)}
                className="text-blue-600 hover:text-blue-700"
              >
                {selectedRiderIds.has(row.rider_id) ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            ) : (
              <Square className="w-4 h-4 text-gray-300" />
            )}
          </div>
        ),
      },
      {
        key: 'rider_id',
        label: 'Rider',
        sortable: true,
        render: (value: string, row: any) => (
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{row.rider_name}</p>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        sortable: true,
        render: (value: string) => (
          <div className="flex items-center space-x-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-sm">{value}</span>
          </div>
        ),
      },
      {
        key: 'identity_card_number',
        label: 'Identity Card',
        sortable: true,
        render: (value: string) => (
          <span className="text-sm font-mono">{value || 'N/A'}</span>
        ),
      },
      {
        key: 'training_status',
        label: 'Training Status',
        sortable: true,
        render: (value: string) => (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            {value}
          </span>
        ),
      },
      {
        key: 'delivery_type',
        label: 'Delivery Type',
        sortable: true,
        render: (value: string) => (
          <span className="text-sm capitalize">{value}</span>
        ),
      },
      {
        key: 'equipment_status',
        label: 'Equipment Status',
        sortable: true,
        render: (value: string) => (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'Completed' ? 'bg-green-100 text-green-800' :
            value === 'Eligible' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {value}
          </span>
        ),
      },
      // Only show these columns when viewing completed riders
      ...(activeTab === 'scheduled' ? [
        {
          key: 'completed_by',
          label: 'Completed By',
          sortable: true,
          render: (_value: any, row: any) => {
            if (row.equipment_status === 'Completed' && row.last_updated_by) {
              return (
                <div className="text-xs">
                  <div className="font-medium text-green-700">{row.last_updated_by}</div>
                  <div className="text-gray-500">Equipment Person</div>
                </div>
              );
            }
            return <span className="text-xs text-gray-400">-</span>;
          },
        },
        {
          key: 'schedule_info',
          label: 'Completion Info',
          render: (_value: any, row: any) => {
            if (row.equipment_status === 'Completed' && row.equipment_completion_date) {
              const hasEquipmentDetails = row.originalRider.data.equipment_allocated_items && 
                                        row.originalRider.data.equipment_allocated_items.length > 0;
              const updatedBy = row.originalRider.data.last_updated_by || row.originalRider.data.equipment_distributed_by || 'Unknown';
              return (
                <div className="text-xs text-gray-600">
                  <div className="font-medium">Completed:</div>
                  <div>{row.equipment_completion_date} at {row.equipment_completion_time}</div>
                  {row.equipment_location && <div className="text-gray-500">{row.equipment_location}</div>}
                  <div className="text-purple-600 font-medium mt-1">
                    <span className="text-gray-500">By:</span> {updatedBy}
                  </div>
                  {hasEquipmentDetails && (
                    <button
                      onClick={() => showEquipmentDetails(row.originalRider)}
                      className="mt-1 flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Equipment Details</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditRider(row.originalRider);
                      setShowEditModal(true);
                    }}
                    className="mt-1 ml-0 flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-xs"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              );
            }
            return <span className="text-xs text-gray-500">Not completed</span>;
          },
        }
      ] : []),
    ];

    if (equipmentActive === false) {
      return (
        <div className="p-6 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-2xl font-semibold text-gray-900 mb-2">Equipment collection is not active</div>
            <p className="text-gray-600 mb-4">Enable equipment items in Equipment Stock to use this page. Items must be marked as Active.</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Equipment Data</h2>
            <p className="text-gray-600 mb-4">
              Processing {totalCount > 0 ? totalCount : 'all'} riders and {partners?.length || 0} partners for equipment eligibility...
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-purple-800">
                <strong>Filtering:</strong> Eligible and Scheduled riders (hiding Completed)
              </p>
              <p className="text-sm text-purple-800 mt-1">
                <strong>Partner Filter:</strong> Only showing riders with Open partner business status
              </p>
            </div>
            {!partners && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  <strong>Loading partners...</strong> Equipment eligibility requires partner data
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Equipment Details Modal Component
    const EquipmentDetailsModal = () => {
      if (!showDetailsModal || !selectedRiderDetails) return null;

      const equipmentItems = selectedRiderDetails.data.equipment_allocated_items || [];
      const totalItems = selectedRiderDetails.data.equipment_total_items || 0;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Equipment Allocation Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Rider Information */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-purple-900 mb-2">Rider Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Rider ID:</strong> {selectedRiderDetails.rider_id}</div>
                      <div><strong>Name:</strong> {selectedRiderDetails.data.rider_name || 'N/A'}</div>
                      <div><strong>Phone:</strong> {selectedRiderDetails.data.mobile || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900 mb-2">Schedule Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span><strong>Date:</strong> {selectedRiderDetails.data.equipment_scheduled_date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span><strong>Time:</strong> {selectedRiderDetails.data.equipment_scheduled_time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span><strong>Location:</strong> {selectedRiderDetails.data.equipment_location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Allocation Details */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Allocated Equipment</h3>
                  <div className="text-sm text-purple-600 font-medium">
                    Total Items: {totalItems}
                  </div>
                </div>

                {equipmentItems.length > 0 ? (
                  <div className="space-y-4">
                    {equipmentItems.map((item: { name: string; sizes: Record<string, number> }, index: number) => {
                      const itemTotal = Object.values(item.sizes as Record<string, number>).reduce((sum: number, qty: number) => sum + qty, 0);
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-purple-600" />
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <span className="text-sm text-purple-600 font-medium">
                                ({itemTotal} items)
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(item.sizes as Record<string, number>).map(([size, quantity]: [string, number]) => (
                              quantity > 0 && (
                                <div key={size} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                  <span className="text-sm font-medium text-gray-700">{size}:</span>
                                  <span className="text-sm font-semibold text-purple-600">{quantity}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No equipment allocation details available</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Collect Equipment</h1>
              <p className="text-gray-600 mt-1">Equipment collection management - Eligible and Scheduled riders (Completed riders are hidden)</p>
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>🏢 Partner Filter:</strong> Only showing riders whose partners have "Open" business status
              </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedEligibleCount > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedEligibleCount} selected
                </span>
              )}
              <button
                onClick={handleBulkScheduleEquipment}
                disabled={selectedEligibleCount === 0}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>
                  Complete Distribution {selectedEligibleCount > 0 && `(${selectedEligibleCount})`}
                </span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('eligible')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'eligible'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Eligible ({eligibleCount})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'scheduled'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Completed ({scheduledCount})</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          <div className="mb-4">
            <FilterPanel
              filters={filterOptions}
              activeFilters={filters}
              onFiltersChange={setFilters}
              data={displayData}
              filename="equipment_collection_riders"
            />
          </div>

          <DataTable
            columns={columns}
            data={displayData}
            searchable
            pagination
            pageSize={20}
          />
        </div>
        
        <EquipmentDetailsModal />
        <ScheduleEquipmentModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
          }}
          onSuccess={handleScheduleSuccess}
          riders={filteredRiders.filter(rider => 
            selectedRiderIds.has(rider.rider_id) && rider.data.equipment_status === 'Eligible'
          )}
        />
        <ScheduleEquipmentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditRider(null);
          }}
          onSuccess={async (scheduleData: any) => {
            if (!editRider) return;
            try {
              // Calculate IST time (KSA - 2.5 hours) for updated_at
              const now = new Date();
              const ksaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // KSA time (GMT+3)
              const istTime = new Date(ksaTime.getTime() - (2.5 * 60 * 60 * 1000)); // IST time (KSA - 2.5 hours)
              
              const updatedData = {
                ...editRider.data,
                equipment_status: 'Completed',
                equipment_completion_date: scheduleData.date,
                equipment_completion_time: scheduleData.time,
                equipment_distributed_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
                equipment_location: scheduleData.location,
                equipment_partner_id: scheduleData.partner_id,
                equipment_allocated_items: scheduleData.equipment || [],
                equipment_total_items: scheduleData.equipment ?
                  (scheduleData.equipment as Array<{ sizes: Record<string, number> }>).reduce((total: number, item: { sizes: Record<string, number> }) =>
                    total + (Object.values(item.sizes as Record<string, number>) as number[]).reduce((sum: number, qty: number) => sum + qty, 0), 0
                  ) : 0,
                last_updated_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
                last_updated_at: istTime.toISOString() // Use IST time
              };

              const { error } = await supabase
                .from('riders')
                .update({
                  data: updatedData,
                  updated_at: istTime.toISOString() // Use IST time for updated_at
                })
                .eq('rider_id', editRider.rider_id);

              if (error) {
                console.error('Error updating rider schedule:', editRider.rider_id, error);
                toast.error('Failed to update schedule');
              } else {
                toast.success('Completion saved');
                setShowEditModal(false);
                setEditRider(null);
                setTimeout(() => {
                  window.location.reload();
                }, 600);
              }
            } catch (err) {
              console.error('Error saving completion:', err);
              toast.error('Failed to save completion');
            }
          }}
          riders={editRider ? [editRider] : []}
        />
      </>
    );
  }