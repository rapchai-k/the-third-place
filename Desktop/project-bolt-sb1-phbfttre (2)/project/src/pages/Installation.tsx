import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { Phone, Package, CalendarPlus, CheckSquare, Square, Users, ClipboardList, Building, Download, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRiders } from '../hooks/useRiders';
import { useAuth } from '../hooks/useAuth';
import { useVendors } from '../hooks/useVendors';
import { usePartners } from '../hooks/usePartners';
import { ScheduleInstallationModal } from '../components/forms/ScheduleInstallationModal';
import { AddVendorForm } from '../components/forms/AddVendorForm';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export function Installation() {
  const { riders, dynamicOptions, totalCount } = useRiders();
  const { user } = useAuth();
  const { vendors } = useVendors();
  const { partners } = usePartners();
  const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRiderIds, setSelectedRiderIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'eligible' | 'scheduled'>('eligible');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editScheduleForm, setEditScheduleForm] = useState<{ vendor_id: string; date: string }>({ vendor_id: '', date: '' });
  const [editTargetRiderIds, setEditTargetRiderIds] = useState<Set<string> | null>(null);
  const ITEMS_PER_PAGE = 50;
  const MAX_SELECTION_LIMIT = 50;

  useEffect(() => {
    processInstallationEligibleRiders();
  }, [riders]);
  
  // Verification: Log installation data
  useEffect(() => {
    if (riders && riders.length > 0) {
      console.log(`🔍 INSTALLATION VERIFICATION: Processing ${riders.length} total riders for installation eligibility`);
      if (riders.length < 5000) {
        console.warn(`⚠️ INSTALLATION WARNING: Only ${riders.length} riders available, expected 5000+`);
      }
    }
  }, [riders, vendors]);

  // removed unused helper getColumnValue

  const getPartnerInfo = (_riderId: string, riderData: any) => {
    const riderPartnerId = riderData.partner_id;
    if (riderPartnerId && partners && partners.length > 0) {
      const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
      if (matchedPartner) {
        return {
          partner_id: matchedPartner.partner_id,
          partner_name: matchedPartner.partner_name,
          business_status: matchedPartner.business_status,
          manager_mis_ids: matchedPartner.manager_mis_ids
        };
      }
    }
    return {
      partner_id: 'N/A',
      partner_name: 'N/A',
      business_status: 'N/A',
      manager_mis_ids: 'N/A'
    };
  };

  const processInstallationEligibleRiders = () => {
    if (!riders || !riders.length) {
      setEligibleRiders([]);
      setLoading(false);
      return;
    }

    console.log('=== INSTALLATION ELIGIBILITY PROCESSING ===');
    console.log('Processing ALL riders for installation eligibility:', riders?.length || 0);
    
    if (riders && riders.length > 0) {
      console.log('Sample rider data:', riders[0].data);
      console.log('Available columns:', Object.keys(riders[0].data));
    }

    // Filter riders with box_installation = 'Eligible' OR 'Scheduled', exclude resigned, AND partner business_status = 'Open'
    const installationRiders = riders.filter(rider => {
      const data = rider.data;
      const jobStatus = String(data.job_status || '').toLowerCase();
      if (jobStatus.startsWith('resign')) {
        return false;
      }
      const installationStatus = String(data.box_installation || '').toLowerCase().trim();
      const isVisible = installationStatus === 'eligible' || installationStatus === 'scheduled';
      
      // Check partner business status
      if (isVisible) {
        const riderPartnerId = data.partner_id;
        if (riderPartnerId && partners && partners.length > 0) {
          const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
          if (matchedPartner && matchedPartner.business_status !== 'Open') {
            console.log(`❌ Installation rider ${data.rider_id} excluded - Partner business status: ${matchedPartner.business_status}`);
            return false;
          }
        }
      }
      
      if (isVisible) {
        console.log(`✅ Installation visible rider: ${data.rider_id} - Status: ${data.box_installation}`);
      }
      
      return isVisible;
    });

    console.log(`Installation visible riders (Eligible + Scheduled + Open Partners): ${installationRiders.length} out of ${riders?.length || 0} total`);
    setEligibleRiders(installationRiders);
    setLoading(false);
  };

  // Separate riders by status - use different variable names to avoid conflicts
  const eligibleOnlyRiders = eligibleRiders.filter(rider => 
    rider.data.box_installation === 'Eligible'
  );
  
  const scheduledOnlyRiders = eligibleRiders.filter(rider => 
    rider.data.box_installation === 'Scheduled'
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

  const handleBulkScheduleInstallation = () => {
    const selectedRiders = paginatedRiders.filter(rider => 
      selectedRiderIds.has(rider.rider_id)
    );
    
    const selectedEligibleRiders = selectedRiders.filter(rider => 
      rider.data.box_installation === 'Eligible'
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
      toast.error('None of the selected riders are eligible for installation. Only riders with "Eligible" status can be scheduled.');
      return;
    }
    
    setShowScheduleModal(true);
  };

  // Helpers for scheduled tab selection
  const getSelectedScheduledRiders = () => {
    const selected = paginatedRiders.filter(rider => selectedRiderIds.has(rider.rider_id));
    return selected.filter(rider => rider.data.box_installation === 'Scheduled');
  };

  const openEditScheduleModal = () => {
    const selectedScheduled = getSelectedScheduledRiders();
    if (selectedScheduled.length === 0) {
      toast.error('Please select at least one scheduled rider to edit');
      return;
    }

    setEditTargetRiderIds(new Set(selectedScheduled.map(r => r.rider_id)));
    // Pre-fill if all selected have the same vendor/date
    const first = selectedScheduled[0];
    const sameVendor = selectedScheduled.every(r => r.data.installation_vendor_id === first.data.installation_vendor_id);
    const sameDate = selectedScheduled.every(r => r.data.installation_scheduled_date === first.data.installation_scheduled_date);
    setEditScheduleForm({
      vendor_id: sameVendor ? (first.data.installation_vendor_id || '') : '',
      date: sameDate ? (first.data.installation_scheduled_date || '') : ''
    });
    setShowEditScheduleModal(true);
  };

  const openEditScheduleForRider = (rider: any) => {
    setEditTargetRiderIds(new Set([rider.rider_id]));
    setEditScheduleForm({
      vendor_id: rider.data.installation_vendor_id || '',
      date: rider.data.installation_scheduled_date || ''
    });
    setShowEditScheduleModal(true);
  };

  const handleEditScheduleSave = async () => {
    // Determine targets: explicit edit targets if present, otherwise selected scheduled
    let targetRiders: any[] = [];
    if (editTargetRiderIds && editTargetRiderIds.size > 0) {
      targetRiders = eligibleRiders.filter(r => editTargetRiderIds.has(r.rider_id));
    } else {
      targetRiders = getSelectedScheduledRiders();
    }
    const selectedScheduled = targetRiders.filter(r => r.data.box_installation === 'Scheduled');

    if (selectedScheduled.length === 0) {
      toast.error('No scheduled riders selected');
      return;
    }

    if (!editScheduleForm.vendor_id && !editScheduleForm.date) {
      toast.error('Choose a vendor or a date to update');
      return;
    }

    try {
      const selectedVendor = editScheduleForm.vendor_id ? vendors.find(v => v.id === editScheduleForm.vendor_id) : undefined;
      let successCount = 0;
      for (const rider of selectedScheduled) {
        try {
          const updatedData: any = { ...rider.data };
          if (editScheduleForm.date) {
            updatedData.installation_scheduled_date = editScheduleForm.date;
          }
          if (selectedVendor) {
            updatedData.installation_vendor_id = selectedVendor.id;
            updatedData.installation_vendor_name = selectedVendor.vendor_name;
            updatedData.installation_vendor_email = selectedVendor.vendor_email;
          }

          const { error } = await supabase
            .from('riders')
            .update({ data: updatedData, updated_at: new Date().toISOString() })
            .eq('rider_id', rider.rider_id);

          if (error) {
            console.error('Error updating scheduled rider:', rider.rider_id, error);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Error processing scheduled rider:', rider.rider_id, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Updated ${successCount} scheduled rider(s)`);
        setSelectedRiderIds(new Set());
        setEditTargetRiderIds(null);
        setShowEditScheduleModal(false);
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error('Failed to update any selected riders');
      }
    } catch (err) {
      console.error('Error editing schedule:', err);
      toast.error('Failed to save changes');
    }
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

  const handleToggleSelectAllWithLimit = () => {
    const availableRiders = paginatedRiders.slice(0, MAX_SELECTION_LIMIT);
    const riderIds = availableRiders.map(rider => rider.rider_id);
    const areAllLimitedSelected = riderIds.length > 0 && riderIds.every(id => selectedRiderIds.has(id));

    if (areAllLimitedSelected) {
      // Deselect the limited set
      const newSelected = new Set(selectedRiderIds);
      riderIds.forEach(id => newSelected.delete(id));
      setSelectedRiderIds(newSelected);
    } else {
      // Select up to the limit
      setSelectedRiderIds(new Set(riderIds));
      if (paginatedRiders.length > MAX_SELECTION_LIMIT) {
        toast(`Selected first ${MAX_SELECTION_LIMIT} riders (maximum limit)`);
      }
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
    const selectedRiders = paginatedRiders.filter(rider => 
      selectedRiderIds.has(rider.rider_id) && rider.data.box_installation === 'Eligible'
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
      toast.error(`Cannot schedule installation: ${invalidRiders.length} riders have partners with closed business status`);
      return;
    }
    
    try {
      let successCount = 0;
      const selectedVendor = vendors.find(v => v.id === scheduleData.vendor_id);
      
      // Distribute riders across selected slots
      // scheduleData.allocations: [{ start, end, count }]
      const allocations: Array<{ start: string; end: string; count: number }> = scheduleData.allocations || [];
      const ridersQueue = [...selectedRiders];
      const installationDetailsToEmail: Array<{ rider_id: string; rider_name: string; rider_phone: string; installation_date: string; installation_time: string; installation_time_end: string; location: string; }> = [];
      for (const slot of allocations) {
        for (let i = 0; i < slot.count && ridersQueue.length > 0; i++) {
          const rider = ridersQueue.shift()!;
          try {
            const updatedData = {
              ...rider.data,
              box_installation: 'Scheduled',
              installation_scheduled_date: scheduleData.date,
              installation_scheduled_time: slot.start,
              installation_location: scheduleData.location,
              installation_vendor_id: scheduleData.vendor_id,
              installation_vendor_name: selectedVendor?.vendor_name,
              installation_vendor_email: selectedVendor?.vendor_email,
              installation_scheduled_time_end: slot.end,
              installation_scheduled_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
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
            } else {
              console.log('✅ Scheduled installation for rider:', rider.rider_id, 'at', slot.start, '-', slot.end);
              successCount++;
              installationDetailsToEmail.push({
                rider_id: rider.rider_id,
                rider_name: rider.data.rider_name || 'Unknown',
                rider_phone: rider.data.mobile || 'N/A',
                installation_date: scheduleData.date,
                installation_time: slot.start,
                installation_time_end: slot.end,
                location: scheduleData.location
              });
            }
          } catch (error) {
            console.error('Error processing rider:', rider.rider_id, error);
          }
        }
      }
      
      if (successCount > 0) {
        // Send email notification to vendor
        if (selectedVendor && selectedVendor.vendor_email && selectedVendor.can_login) {
          try {
            const installationDetails = installationDetailsToEmail;

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-installation-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                vendor_email: selectedVendor.vendor_email,
                vendor_name: selectedVendor.vendor_name,
                vendor_id: selectedVendor.vendor_id,
                installations: installationDetails,
                system_url: `${window.location.origin}/installation`
              })
            });

            if (response.ok) {
              console.log('✅ Installation notification sent to vendor:', selectedVendor.vendor_email);
              toast.success(`Installation scheduled and notification sent to ${selectedVendor.vendor_name}`);
            } else {
              console.warn('⚠️ Failed to send vendor notification');
              toast.error('Installation scheduled but email notification failed');
            }
          } catch (emailError) {
            console.error('Error sending vendor notification:', emailError);
            toast.error('Installation scheduled but email notification failed');
          }
        } else {
          console.log('ℹ️ No email notification sent - vendor email not configured or login disabled');
        }

        if (!selectedVendor?.vendor_email) {
          toast.success(`Installation scheduled for ${successCount} rider(s)`);
        }
        setSelectedRiderIds(new Set()); // Clear selection after successful scheduling
        
        // Refresh the riders data to show updates
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to schedule installation for any riders');
      }
        
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error scheduling installation:', error);
      toast.error('Failed to schedule installation');
    }
  };

  const exportScheduledInstallations = () => {
    if (scheduledOnlyRiders.length === 0) {
      toast.error('No scheduled installations to export');
      return;
    }

    try {
      // Transform data for installation schedule export
      const exportData = scheduledOnlyRiders.map(rider => {
        const partnerInfo = getPartnerInfo(rider.rider_id, rider.data);
        const vendorInfo = vendors?.find(v => v.id === rider.data.installation_vendor_id);
        
        return {
          'Rider ID': rider.rider_id || '',
          'Rider Name': rider.data.rider_name || '',
          'Phone': rider.data.mobile || '',
          'Partner ID': partnerInfo.partner_id,
          'Partner Name': partnerInfo.partner_name,
          'Partner Business Status': partnerInfo.business_status,
          'Manager MIS IDs': partnerInfo.manager_mis_ids,
          'Scheduled Date': rider.data.installation_scheduled_date || '',
          'Scheduled Time': rider.data.installation_scheduled_time || '',
          'Scheduled End Time': rider.data.installation_scheduled_time_end || '',
          'Location': rider.data.installation_location || '',
          'Installation Status': rider.data.box_installation || '',
          'Vendor ID': vendorInfo?.vendor_id || '',
          'Vendor Name': vendorInfo?.vendor_name || '',
          'Vendor Email': vendorInfo?.vendor_email || '',
          'Vendor Location': vendorInfo?.location || '',
          'Vendor Capacity (boxes/hour)': vendorInfo?.boxes_per_hour || '',
          'Vendor Max Daily Capacity': vendorInfo?.max_boxes_per_day || '',
          'Vendor Working Hours': vendorInfo ? `${vendorInfo.start_time || '08:00'} - ${vendorInfo.end_time || '18:00'}` : '',
          'Vendor Working Days': vendorInfo?.serviceable_days && Array.isArray(vendorInfo.serviceable_days) ? vendorInfo.serviceable_days.join(', ') : '',
          'Vendor Break Time': vendorInfo?.break_start_time && vendorInfo?.break_end_time ? `${vendorInfo.break_start_time} - ${vendorInfo.break_end_time}` : '',
          'Vendor Timezone': vendorInfo?.timezone || '',
          'Vendor Weekend Availability': vendorInfo?.is_available_weekends ? 'Yes' : 'No',
          'Delivery Type': rider.data.delivery_type || '',
          'Audit Status': rider.data.audit_status || '',
          'Job Status': rider.data.job_status || '',
          'Nationality': rider.data.nationality_code || '',
          'City ID': rider.data.city_id || '',
          'Vehicle Number': rider.data.vehicle_number || '',
          'Identity Card Number': rider.data.identity_card_number || '',
          'Resident Type': rider.data.resident_type || '',
          'Installation Notes': rider.data.installation_notes || '',
          'Created At': rider.created_at || '',
          'Updated At': rider.updated_at || ''
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet
      XLSX.utils.book_append_sheet(wb, ws, 'Installation Schedule');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `installation_schedule_${timestamp}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, fileName);
      
      console.log(`Installation schedule exported: ${scheduledOnlyRiders.length} scheduled installations`);
      toast.success(`Exported ${scheduledOnlyRiders.length} scheduled installations with complete partner and vendor details`);
    } catch (error) {
      console.error('Error exporting installation schedule:', error);
      toast.error('Failed to export installation schedule. Please try again.');
    }
  };

  const filterOptions = [
    {
      key: 'partner_id',
      label: 'Partner',
      type: 'select' as const,
      options: (partners || [])
        .filter(p => Boolean(p.partner_id))
        .map(p => ({
          value: String(p.partner_id as string),
          label: String((p as any).partner_name || (p as any).name || p.partner_id)
        }))
    },
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
      key: 'box_installation',
      label: 'Box Installation Status',
      type: 'select' as const,
      options: [
        { value: 'Eligible', label: 'Eligible' },
        { value: 'Scheduled', label: 'Scheduled' },
      ],
    },
  ];

  const displayData = paginatedRiders.map(rider => ({
    rider_id: rider.rider_id,
    rider_name: rider.data.rider_name || 'N/A',
    phone: rider.data.mobile || 'N/A',
    identity_card_number: rider.data.identity_card_number || 'N/A',
    audit_status: rider.data.audit_status || 'N/A',
    job_status: rider.data.job_status || 'N/A',
    delivery_type: rider.data.delivery_type || 'N/A',
    box_installation: rider.data.box_installation || 'N/A',
    installation_scheduled_date: rider.data.installation_scheduled_date || null,
    installation_scheduled_time: rider.data.installation_scheduled_time || null,
    installation_location: rider.data.installation_location || null,
    originalRider: rider,
    isEligible: rider.data.box_installation === 'Eligible'
  }));

  const eligibleCount = eligibleOnlyRiders.length;
  const scheduledCount = scheduledOnlyRiders.length;
  const selectedCount = selectedRiderIds.size;
  const selectedEligibleCount = displayData.filter(rider => 
    selectedRiderIds.has(rider.rider_id) && rider.isEligible
  ).length;

  const columns: { key: string; label: React.ReactNode; sortable?: boolean; render?: (value: any, row: any) => React.ReactNode }[] = [
    {
      key: 'select',
      label: (
        <div className="flex items-center space-x-2">
          <button
            onClick={activeTab === 'eligible' ? handleToggleSelectAllWithLimit : handleSelectAll}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {(activeTab === 'eligible'
              ? (paginatedRiders.slice(0, MAX_SELECTION_LIMIT).map(r => r.rider_id).every(id => selectedRiderIds.has(id)) && paginatedRiders.length > 0)
              : (selectedRiderIds.size === paginatedRiders.length && paginatedRiders.length > 0)) ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>{activeTab === 'eligible' ? `All (Max ${MAX_SELECTION_LIMIT})` : 'All'}</span>
          </button>
        </div>
      ),
      render: (_value: any, row: any) => (
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
        <div className="flex items-center space-x-1">
          <Package className="w-3 h-3 text-purple-400" />
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
            {value}
          </span>
        </div>
      ),
    },
    {
      key: 'box_installation',
      label: 'Installation Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          value === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Eligible' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'schedule_info',
      label: 'Schedule Info',
      render: (_value: any, row: any) => {
        if (row.box_installation === 'Scheduled' && row.installation_scheduled_date) {
          const vendorInfo = vendors.find(v => v.id === row.originalRider.data.installation_vendor_id);
          return (
            <div className="text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <div className="font-medium">Scheduled:</div>
                <button
                  onClick={() => openEditScheduleForRider(row.originalRider)}
                  className="inline-flex items-center space-x-1 text-orange-600 hover:text-orange-700"
                  title="Edit vendor/date"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div>
                {row.installation_scheduled_date} at {row.installation_scheduled_time}
                {row.originalRider?.data?.installation_scheduled_time_end ? ` - ${row.originalRider.data.installation_scheduled_time_end}` : ''}
              </div>
              {row.installation_location && <div className="text-gray-500">{row.installation_location}</div>}
              {vendorInfo && (
                <div className="flex items-center space-x-1 mt-1">
                  <Building className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">{vendorInfo.vendor_name}</span>
                </div>
              )}
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Installation Data</h2>
          <p className="text-gray-600 mb-4">Processing {totalCount > 0 ? totalCount : '5000+'} riders for installation eligibility...</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-orange-800">
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
            <h1 className="text-2xl font-bold text-gray-900">Box Installation</h1>
            <p className="text-gray-600 mt-1">Box installation management - Eligible and Scheduled riders (Completed riders are hidden)</p>
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
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
            {activeTab === 'scheduled' && (
              <button
                onClick={exportScheduledInstallations}
                disabled={scheduledOnlyRiders.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export Scheduled ({scheduledOnlyRiders.length})</span>
              </button>
            )}
            {activeTab === 'scheduled' && (
              <button
                onClick={openEditScheduleModal}
                disabled={selectedCount === 0}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Vendor/Date{selectedCount > 0 ? ` (${selectedCount})` : ''}</span>
              </button>
            )}
            {activeTab === 'eligible' && (
              <button
                onClick={handleBulkScheduleInstallation}
                disabled={selectedEligibleCount === 0}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>
                  Schedule Installation {selectedCount > 0 && `(${selectedCount})`}
                </span>
              </button>
            )}
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
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-orange-800">
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
                  className="px-3 py-1 text-sm bg-white border border-orange-300 rounded hover:bg-orange-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-orange-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-orange-300 rounded hover:bg-orange-50 disabled:opacity-50"
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
            filename="installation_riders"
          />
        </div>

        <DataTable
          columns={columns}
          data={displayData}
          searchable
          pagination={false}
        />
        
        <ScheduleInstallationModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
          }}
          onSuccess={handleScheduleSuccess}
          riders={paginatedRiders.filter(rider => 
            selectedRiderIds.has(rider.rider_id) && rider.data.box_installation === 'Eligible'
          )}
        />
        
        <AddVendorForm
          isOpen={showAddVendorForm}
          onClose={() => setShowAddVendorForm(false)}
          onSuccess={() => setShowAddVendorForm(false)}
        />

        {showEditScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowEditScheduleModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Scheduled Installation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={editScheduleForm.vendor_id}
                    onChange={e => setEditScheduleForm(prev => ({ ...prev, vendor_id: e.target.value }))}
                  >
                    <option value="">Keep current</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={editScheduleForm.date}
                    onChange={e => setEditScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowEditScheduleModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditScheduleSave}
                  className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}