import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { Plus, Calendar, User, Phone, Clock, CalendarPlus, CheckSquare, Square, Users, ClipboardList, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRiders } from '../hooks/useRiders';
import { usePartners } from '../hooks/usePartners';
import { ScheduleTrainingModal } from '../components/forms/ScheduleTrainingModal';
import toast from 'react-hot-toast';

export function Training() {
  const { riders, dynamicOptions, updateRider, totalCount } = useRiders();
  const { user } = useAuth();
  const { partners } = usePartners();
  const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'eligible' | 'scheduled'>('eligible');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const MAX_SELECTION_LIMIT = 50;

  useEffect(() => {
    processTrainingEligibleRiders();
  }, [riders]);
  
  // Verification: Log training data
  useEffect(() => {
    if (riders && riders.length > 0) {
      console.log(`🔍 TRAINING VERIFICATION: Processing ${riders.length} total riders for training eligibility`);
      if (riders.length < 5000) {
        console.warn(`⚠️ TRAINING WARNING: Only ${riders.length} riders available, expected 5000+`);
      }
    }
  }, [riders]);

  const getPartnerInfo = (riderId: string, riderData: any) => {
    const riderPartnerId = riderData.partner_id;
    if (!riderPartnerId || !partners || partners.length === 0) {
      return {
        partner_id: riderData.partner_id || 'N/A',
        partner_name: riderData.partner_company_name_en || riderData.partner_name || 'N/A',
        business_status: 'N/A',
        manager_mis_ids: riderData.manager_mis_ids || 'N/A'
      };
    }

    const matchedPartner = partners.find(partner => 
      partner.partner_id === riderPartnerId
    );

    if (matchedPartner) {
      return {
        partner_id: matchedPartner.partner_id || 'N/A',
        partner_name: matchedPartner.partner_name || matchedPartner.name || 'N/A',
        business_status: matchedPartner.business_status || 'N/A',
        manager_mis_ids: matchedPartner.manager_mis_ids || riderData.manager_mis_ids || 'N/A'
      };
    }

    // Fallback to rider data if no partner match found
    return {
      partner_id: riderPartnerId,
      partner_name: riderData.partner_company_name_en || riderData.partner_name || 'N/A',
      business_status: 'N/A',
      manager_mis_ids: riderData.manager_mis_ids || 'N/A'
    };
  };

  const getColumnValue = (data: any, possibleColumns: string[]) => {
    for (const col of possibleColumns) {
      if (data[col]) return String(data[col]);
    }
    return 'N/A';
  };

  const processTrainingEligibleRiders = () => {
    const ridersToProcess = riders;
    
    if (!ridersToProcess || !ridersToProcess.length) {
      setEligibleRiders([]);
      setLoading(false);
      return;
    }

    console.log('=== TRAINING ELIGIBILITY PROCESSING ===');
    console.log('Processing ALL riders for training eligibility:', ridersToProcess?.length || 0);
    
    if (ridersToProcess && ridersToProcess.length > 0) {
      console.log('Sample rider data:', ridersToProcess[0].data);
      console.log('Available columns:', Object.keys(ridersToProcess[0].data));
    }

    // Filter riders with training_status = 'Eligible' OR 'Scheduled', exclude resigned, AND partner business_status = 'Open'
    const trainingRiders = ridersToProcess.filter(rider => {
      const data = rider.data;
      const jobStatus = String(data.job_status || '').toLowerCase();
      if (jobStatus.startsWith('resign')) {
        return false;
      }
      const trainingStatus = String(data.training_status || '').toLowerCase().trim();
      const isVisible = trainingStatus === 'eligible' || trainingStatus === 'scheduled';
      
      // Check partner business status
      if (isVisible) {
        const riderPartnerId = data.partner_id;
        if (riderPartnerId && partners && partners.length > 0) {
          const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
          if (matchedPartner && matchedPartner.business_status !== 'Open') {
            console.log(`❌ Training rider ${data.rider_id} excluded - Partner business status: ${matchedPartner.business_status}`);
            return false;
          }
        }
      }
      
      if (isVisible) {
        console.log(`✅ Training visible rider: ${data.rider_id} - Status: ${data.training_status}`);
      }
      
      return isVisible;
    });

    console.log(`Training visible riders (Eligible + Scheduled + Open Partners): ${trainingRiders.length} out of ${ridersToProcess?.length || 0} total`);
    setEligibleRiders(trainingRiders);
    setLoading(false);
  };

  // Separate riders by status - use different variable names to avoid conflicts
  const eligibleOnlyRiders = eligibleRiders.filter(rider => 
    rider.data.training_status === 'Eligible'
  );
  
  const scheduledOnlyRiders = eligibleRiders.filter(rider => 
    rider.data.training_status === 'Scheduled'
  );

  // Get current tab riders
  const getCurrentTabRiders = () => {
    return activeTab === 'eligible' ? eligibleOnlyRiders : scheduledOnlyRiders;
  };

  // Apply filters to current tab riders
  const filteredRiders = getCurrentTabRiders().filter(rider => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (Array.isArray(value)) {
        return value.includes(rider.data[key]);
      }
      return rider.data[key] === value;
    });
  });

  // Pagination - only for Eligible tab, show all for Scheduled tab
  let paginatedRiders;
  let totalPages;
  
  if (activeTab === 'eligible') {
    // Limit to 50 per page for eligible riders
    totalPages = Math.ceil(filteredRiders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    paginatedRiders = filteredRiders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  } else {
    // Show all scheduled riders (no pagination limit)
    totalPages = 1;
    paginatedRiders = filteredRiders;
  }

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRiderIds(new Set());
  }, [activeTab]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleBulkScheduleTraining = () => {
    const selectedRiders = paginatedRiders.filter(rider => 
      selectedRiderIds.has(rider.rider_id)
    );
    
    const selectedEligibleRiders = selectedRiders.filter(rider => 
      rider.data.training_status === 'Eligible'
    );
    
    if (selectedEligibleRiders.length > MAX_SELECTION_LIMIT) {
      toast.error(`You can only schedule maximum ${MAX_SELECTION_LIMIT} riders at once. Please select fewer riders.`);
      return;
    }
    
    if (selectedRiders.length === 0) {
      toast.error('Please select riders for scheduling');
      return;
    }
    
    if (selectedEligibleRiders.length === 0) {
      toast.error('None of the selected riders are eligible for training. Only riders with "Eligible" status can be scheduled.');
      return;
    }
    
    setShowScheduleModal(true);
  };

  const handleSelectAll = () => {
    const allRiderIds = paginatedRiders.map(rider => rider.rider_id);
    
    if (selectedRiderIds.size === allRiderIds.length) {
      // Deselect all
      setSelectedRiderIds(new Set());
    } else {
      // Select all riders
      setSelectedRiderIds(new Set(allRiderIds));
    }
  };

  const handleSelectAllWithLimit = () => {
    const availableRiders = paginatedRiders.slice(0, MAX_SELECTION_LIMIT);
    const riderIds = availableRiders.map(rider => rider.rider_id);
    
    setSelectedRiderIds(new Set(riderIds));
    
    if (paginatedRiders.length > MAX_SELECTION_LIMIT) {
      toast(`Selected first ${MAX_SELECTION_LIMIT} riders (maximum limit)`);
    }
  };

  const handleRowSelect = (riderId: string) => {
    if (!selectedRiderIds.has(riderId) && selectedRiderIds.size >= MAX_SELECTION_LIMIT) {
      toast.error(`Maximum ${MAX_SELECTION_LIMIT} riders can be selected at once`);
      return;
    }
    
    const newSelected = new Set(selectedRiderIds);
    if (newSelected.has(riderId)) {
      newSelected.delete(riderId);
    } else {
      newSelected.add(riderId);
    }
    setSelectedRiderIds(newSelected);
  };

  const handleScheduleSuccess = async (scheduleData: any) => {
    // Use ridersToSchedule from modal if provided (capacity-filtered), otherwise use selected riders
    const ridersToSchedule = scheduleData.ridersToSchedule || paginatedRiders.filter(rider => 
      selectedRiderIds.has(rider.rider_id) && rider.data.training_status === 'Eligible'
    );
    
    if (!ridersToSchedule.length) {
      toast.error('No riders available for scheduling');
      return;
    }
    
    // Final validation: Check partner business status
  const invalidRiders = ridersToSchedule.filter((rider: any) => {
      const riderPartnerId = rider.data.partner_id;
      if (riderPartnerId && partners && partners.length > 0) {
        const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
        return matchedPartner && matchedPartner.business_status !== 'Open';
      }
      return false;
    });
    
    if (invalidRiders.length > 0) {
      toast.error(`Cannot schedule training: ${invalidRiders.length} riders have partners with closed business status`);
      return;
    }
    
    try {
      let successCount = 0;
      let blockedCount = 0;
      
      console.log(`🎯 TRAINING SCHEDULING: Attempting to schedule ${ridersToSchedule.length} riders (filtered by capacity)`);
      if (scheduleData.ridersToSchedule) {
        console.log(`📊 CAPACITY FILTERING: ${riders.filter(r => selectedRiderIds.has(r.rider_id)).length} originally selected, ${ridersToSchedule.length} allowed by capacity`);
      }
      
      // Update all selected riders
      for (const rider of ridersToSchedule) {
        try {
          // Update all training data at once
          const updatedData = {
            ...rider.data,
            training_status: 'Scheduled',
            training_scheduled_date: scheduleData.date,
            training_scheduled_time: scheduleData.time,
            training_location: scheduleData.location,
            training_scheduled_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
            last_updated_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
            last_updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('riders')
            .update({ 
              data: updatedData,
              updated_at: new Date().toISOString()
            })
            .eq('rider_id', rider.rider_id);

          if (error) {
            console.error('Error updating rider:', rider.rider_id, error);
            blockedCount++;
          } else {
            console.log('✅ Successfully scheduled training for rider:', rider.rider_id);
            successCount++;
          }
        } catch (error) {
          console.error('Error processing rider:', rider.rider_id, error);
        }
      }
      
      if (successCount > 0) {
        const originalSelectedCount = riders.filter(r => selectedRiderIds.has(r.rider_id)).length;
        if (ridersToSchedule.length < originalSelectedCount) {
          toast.success(`✅ Training scheduled for ${successCount} rider(s). ${originalSelectedCount - ridersToSchedule.length} riders kept in "Eligible" status due to partner capacity limits.`);
        } else {
          toast.success(`✅ Training scheduled for ${successCount} rider(s)`);
        }
        setSelectedRiderIds(new Set()); // Clear selection after successful scheduling
        
        // Refresh the riders data to show updates
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to schedule training for any riders');
      }
        
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error scheduling training:', error);
      toast.error('Failed to schedule training');
    }
  };

  const filterOptions = [
    {
      key: 'nationality_code',
      label: 'Nationality',
      type: 'multiselect' as const,
      options: (dynamicOptions.nationality_code || []).map(option => {
        // Count eligible riders for this nationality
        const eligibleCount = eligibleOnlyRiders.filter(rider => 
          rider.data.nationality_code === option.value
        ).length;
        return {
          ...option,
          label: `${option.label} (${eligibleCount} eligible)`
        };
      })
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
      key: 'training_status',
      label: 'Training Status',
      type: 'select' as const,
      options: [
        { value: 'Eligible', label: 'Eligible' },
        { value: 'Scheduled', label: 'Scheduled' },
      ],
    },
  ];

  // Transform rider data for display
  const displayData = paginatedRiders.map(rider => ({
    id: rider.id,
    rider_id: rider.rider_id || 'N/A',
    rider_name: rider.data.rider_name || 'N/A',
    phone: rider.data.mobile || 'N/A',
    identity_card_number: rider.data.identity_card_number || 'N/A',
    audit_status: rider.data.audit_status || 'N/A',
    job_status: rider.data.job_status || 'N/A',
    delivery_type: rider.data.delivery_type || 'N/A',
    partner_name: rider.data.partner_company_name_en || rider.data.partner_name || 'N/A',
    partner_id: getPartnerInfo(rider.rider_id, rider.data).partner_id,
    manager_mis_ids: getPartnerInfo(rider.rider_id, rider.data).manager_mis_ids,
    training_status: rider.data.training_status || 'N/A',
    training_scheduled_date: rider.data.training_scheduled_date || null,
    training_scheduled_time: rider.data.training_scheduled_time || null,
    training_location: rider.data.training_location || null,
    originalRider: rider,
    isEligible: rider.data.training_status === 'Eligible'
  }));

  const eligibleCount = eligibleOnlyRiders.length;
  const scheduledCount = scheduledOnlyRiders.length;
  const selectedCount = selectedRiderIds.size;
  const selectedEligibleCount = displayData.filter(rider => 
    selectedRiderIds.has(rider.rider_id) && rider.isEligible
  ).length;

  const columns = [
    {
      key: 'select',
      label: (
        <div className="flex items-center space-x-2">
          <button
            onClick={activeTab === 'eligible' ? handleSelectAllWithLimit : handleSelectAll}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {selectedRiderIds.size === paginatedRiders.length && paginatedRiders.length > 0 ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{activeTab === 'eligible' ? `All (Max ${MAX_SELECTION_LIMIT})` : 'All'}</span>
          </button>
        </div>
      ),
      render: (value: any, row: any) => (
        <div className="flex items-center">
          <button
            onClick={() => handleRowSelect(row.rider_id)}
            className="text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {selectedRiderIds.has(row.rider_id) ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
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
      key: 'audit_status',
      label: 'Audit Status',
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {value}
        </span>
      ),
    },
    {
      key: 'job_status',
      label: 'Job Status',
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
      key: 'partner_name',
      label: 'Partner Name',
      sortable: true,
      render: (value: string, row: any) => {
        const partnerInfo = getPartnerInfo(row.rider_id, row.originalRider.data);
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Building className="w-3 h-3 text-gray-400" />
              <span className="text-sm font-medium">{partnerInfo.partner_name}</span>
            </div>
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                partnerInfo.business_status === 'Open' ? 'bg-green-100 text-green-800' : 
                partnerInfo.business_status === 'Close' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {partnerInfo.business_status}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'partner_id',
      label: 'Partner ID',
      sortable: true,
      render: (value: string, row: any) => {
        const partnerInfo = getPartnerInfo(row.rider_id, row.originalRider.data);
        return (
          <div className="text-sm font-mono text-gray-900">
            {partnerInfo.partner_id}
          </div>
        );
      },
    },
    {
      key: 'manager_mis_ids',
      label: 'Manager MIS IDs',
      sortable: true,
      render: (value: string, row: any) => {
        const partnerInfo = getPartnerInfo(row.rider_id, row.originalRider.data);
        const partnerManagerIds = partnerInfo.manager_mis_ids;
        const riderManagerIds = row.originalRider.data.manager_mis_ids;
        
        // Use partner data first, fallback to rider data
        const displayValue = partnerManagerIds !== 'N/A' ? partnerManagerIds : riderManagerIds || 'N/A';
        const dataSource = partnerManagerIds !== 'N/A' ? 'partner' : 'rider';
        
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">
              {displayValue}
            </div>
            {displayValue !== 'N/A' && (
              <div className="text-xs text-blue-600">
                From {dataSource === 'partner' ? `Partner: ${partnerInfo.partner_name}` : 'Rider Data'}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'training_status',
      label: 'Training Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          value === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Eligible' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'schedule_info',
      label: 'Schedule Info',
      render: (value: any, row: any) => {
        if (row.training_status === 'Scheduled' && row.training_scheduled_date) {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium">Scheduled:</div>
              <div>{row.training_scheduled_date} at {row.training_scheduled_time}</div>
              {row.training_location && <div className="text-gray-500">{row.training_location}</div>}
            </div>
          );
        }
        return <span className="text-xs text-gray-500">Not scheduled</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Training Data</h2>
          <p className="text-gray-600 mb-4">Processing {totalCount > 0 ? totalCount : '5000+'} riders for training eligibility...</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Filtering:</strong> Eligible and Scheduled riders (hiding Completed)
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training</h1>
            <p className="text-gray-600 mt-1">Training management - Eligible and Scheduled riders (Completed riders are hidden)</p>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>🏢 Partner Filter:</strong> Only showing riders whose partners have "Open" business status
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {selectedCount > 0 && (
              <span className="text-sm text-gray-600">
                {selectedCount} selected {activeTab === 'eligible' && `(max ${MAX_SELECTION_LIMIT})`}
              </span>
            )}
            <button
              onClick={handleBulkScheduleTraining}
              disabled={selectedEligibleCount === 0 || activeTab !== 'eligible'}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>
                Schedule Training {selectedCount > 0 && `(${selectedCount})`}
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
                  <span>Scheduled ({scheduledCount})</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>{activeTab === 'eligible' ? 'Eligible' : 'Scheduled'} Riders:</strong> 
              {activeTab === 'eligible' ? (
                <>Showing {displayData.length} of {filteredRiders.length} riders 
                <span className="ml-2 font-medium">
                  (Max {MAX_SELECTION_LIMIT} can be scheduled at once)
                </span></>
              ) : (
                <>Showing all {filteredRiders.length} scheduled riders</>
              )}
            </div>
            {totalPages > 1 && activeTab === 'eligible' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-blue-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <FilterPanel
            filters={filterOptions}
            activeFilters={filters}
            onFiltersChange={setFilters}
            data={displayData}
            filename="training_riders"
          />
        </div>

        <DataTable
          columns={columns}
          data={displayData}
          searchable
          pagination={false}
        />
        
        <ScheduleTrainingModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
          }}
          onSuccess={handleScheduleSuccess}
          riders={paginatedRiders.filter(rider =>
            selectedRiderIds.has(rider.rider_id) && rider.data.training_status === 'Eligible'
          )}
        />
      </div>
    </div>
  );
}