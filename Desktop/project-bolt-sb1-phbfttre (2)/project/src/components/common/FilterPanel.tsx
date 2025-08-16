import { X, Calendar, Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePartners } from '../../hooks/usePartners';
import { useVendors } from '../../hooks/useVendors';

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'multiselect';
  options?: { value: string; label: string }[];
}

interface FilterPanelProps {
  filters: FilterOption[];
  onFiltersChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
  data: any[];
  filename?: string;
}

export function FilterPanel({ filters, onFiltersChange, activeFilters, data, filename = 'export' }: FilterPanelProps) {
  const { partners } = usePartners();
  const { vendors } = useVendors();

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else if (Array.isArray(value) && value.length === 0) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (key: string, selectedValue: string) => {
    const currentValues = activeFilters[key] || [];
    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter((v: string) => v !== selectedValue)
      : [...currentValues, selectedValue];
    
    handleFilterChange(key, newValues);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  const exportToXLSX = async () => {
    try {
      if (data.length === 0) {
        alert('No data to export');
        return;
      }
      
      // Verification: Log export data count
      console.log(`📊 EXPORT VERIFICATION: Exporting ${data.length} records`);
      if (data.length < 5000) {
        console.warn(`⚠️ EXPORT WARNING: Only exporting ${data.length} records, expected 5000+`);
      }

      // Enhanced export data transformation for riders
      let exportData = data;
      
      if (filename === 'dynamic_riders' || filename === 'riders' || filename === 'training_riders' || filename === 'installation_riders' || filename === 'equipment_collection_riders') {
        console.log('🔄 Transforming rider data for comprehensive export...');
        
        exportData = data.map(row => {
          const originalRider = (row as any).originalRider || row;
          const riderData = (originalRider as any).data || originalRider;

          // Partner info
          const getPartnerInfo = (riderPayload: any) => {
            const riderPartnerId = riderPayload.partner_id;
            if (!riderPartnerId || !partners || partners.length === 0) {
              return {
                partner_id: riderPayload.partner_id || 'N/A',
                partner_name: riderPayload.partner_company_name_en || riderPayload.partner_name || 'N/A',
                business_status: 'N/A',
                manager_mis_ids: riderPayload.manager_mis_ids || 'N/A'
              };
            }
            const matchedPartner = partners.find(p => p.partner_id === riderPartnerId);
            if (matchedPartner) {
              return {
                partner_id: matchedPartner.partner_id || 'N/A',
                partner_name: matchedPartner.partner_name || matchedPartner.name || 'N/A',
                business_status: matchedPartner.business_status || 'N/A',
                manager_mis_ids: matchedPartner.manager_mis_ids || 'N/A'
              };
            }
            return {
              partner_id: riderPartnerId,
              partner_name: riderPayload.partner_company_name_en || riderPayload.partner_name || 'N/A',
              business_status: 'N/A',
              manager_mis_ids: riderPayload.manager_mis_ids || 'N/A'
            };
          };

          const partnerInfo = getPartnerInfo(riderData);

          // Include ALL rider data fields raw (flatten simple) first
          const allFields: Record<string, any> = {};
          Object.entries(riderData || {}).forEach(([key, value]) => {
            if (value === undefined) return;
            if (value !== null && typeof value === 'object') {
              try {
                allFields[key] = JSON.stringify(value);
              } catch {
                allFields[key] = String(value);
              }
            } else {
              allFields[key] = value;
            }
          });

          // Vendor info (only when box installation is Completed)
          const installationStatus = String(riderData.box_installation || '').toLowerCase();
          let vendorAugment: Record<string, any> = {};
          if (installationStatus === 'completed') {
            const installationVendorId = riderData.installation_vendor_id || riderData.vendor_id || '';
            const installationVendorName = riderData.installation_vendor_name || '';
            const matchedVendor = (vendors || []).find(v =>
              (installationVendorId && v.vendor_id === installationVendorId) ||
              (installationVendorName && v.vendor_name === installationVendorName)
            );
            vendorAugment = {
              'Installation Vendor ID': installationVendorId || matchedVendor?.vendor_id || '',
              'Installation Vendor Name': installationVendorName || matchedVendor?.vendor_name || '',
              'Installation Vendor Email': matchedVendor?.vendor_email || '',
              'Installation Vendor Location': matchedVendor?.location || '',
              'Installation Vendor Boxes Per Hour': matchedVendor?.boxes_per_hour ?? '',
              'Installation Vendor Max Boxes Per Day': matchedVendor?.max_boxes_per_day ?? ''
            };
          }

          // Compose final export row: all original fields + augmentations
          return {
            ...allFields,
            'Rider ID': (originalRider as any).rider_id || riderData.rider_id || 'N/A',
            'Partner ID': partnerInfo.partner_id,
            'Partner Name': partnerInfo.partner_name,
            'Partner Business Status': partnerInfo.business_status,
            'Manager MIS IDs (Partner)': partnerInfo.manager_mis_ids,
            ...vendorAugment,
            'Created At': (originalRider as any).created_at || '',
            'Updated At': (originalRider as any).updated_at || ''
          };
        });
        
        console.log(`✅ Transformed ${exportData.length} rider records for comprehensive export`);
      }

      const proceed = confirm(`⚠️ Large Export Warning!\n\nYou are about to export ${data.length} records.\n\nThis may take several minutes and could impact browser performance.\n\nFor datasets over 5000 records, consider using filters to reduce the export size.\n\nContinue?`);
      if (!proceed) return;
      
      // Show progress indicator for large exports
      const progressDiv = document.createElement('div');
      progressDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
                    z-index: 10000; text-align: center;">
          <div>📊 Exporting ${data.length} records...</div>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">Please wait, this may take a few minutes</div>
        </div>
      `;
      document.body.appendChild(progressDiv);
      
      try {
        // Create single workbook with all data in one sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        const timestamp = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, finalFilename);
        
      } finally {
        document.body.removeChild(progressDiv);
      }
      return;

      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `${filename}_${timestamp}.xlsx`;
      
      // Write the file
      XLSX.writeFile(wb, finalFilename);
    } catch (error) {
      console.error('Error exporting to XLSX:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const exportScheduledTrainings = async () => {
    try {
      // Helper function to get partner info for export
      const getPartnerInfo = (riderData: any) => {
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

        return {
          partner_id: riderPartnerId,
          partner_name: riderData.partner_company_name_en || riderData.partner_name || 'N/A',
          business_status: 'N/A',
          manager_mis_ids: riderData.manager_mis_ids || 'N/A'
        };
      };

      // Filter only scheduled trainings
      const scheduledTrainings = data.filter(item => 
        item.training_status === 'Scheduled' && 
        item.training_scheduled_date
      );

      if (scheduledTrainings.length === 0) {
        alert('No scheduled trainings to export');
        return;
      }

      // Transform data for training schedule export
      const exportData = scheduledTrainings.map(item => ({
        'Rider ID': item.rider_id || '',
        'Rider Name': item.rider_name || '',
        'Phone': item.phone || '',
        'Partner ID': item.partner_id || '',
        'Partner Name': item.partner_name || '',
        'Partner Business Status': item.originalRider?.data ? getPartnerInfo(item.originalRider.data).business_status : 'N/A',
        'Manager MIS IDs (Partner)': item.originalRider?.data ? getPartnerInfo(item.originalRider.data).manager_mis_ids : 'N/A',
       
        'Scheduled Date': item.training_scheduled_date || '',
        'Scheduled Time': item.training_scheduled_time || '',
        'Location': item.training_location || '',
        'Training Status': item.training_status || '',
        'Delivery Type': item.delivery_type || '',
        'Audit Status': item.audit_status || '',
        'Job Status': item.job_status || '',
        'Nationality': item.originalRider?.data?.nationality_code || 'N/A',
        'City ID': item.originalRider?.data?.city_id || 'N/A',
        'Vehicle Number': item.originalRider?.data?.vehicle_number || 'N/A',
        'Identity Card Number': item.originalRider?.data?.identity_card_number || 'N/A',
        'Resident Type': item.originalRider?.data?.resident_type || 'N/A',
        'Created At': item.originalRider?.created_at || '',
        'Updated At': item.originalRider?.updated_at || ''
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet
      XLSX.utils.book_append_sheet(wb, ws, 'Training Schedule');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `training_schedule_${timestamp}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, finalFilename);
      
      console.log(`Training schedule exported: ${scheduledTrainings.length} scheduled trainings`);
    } catch (error) {
      console.error('Error exporting training schedule:', error);
      alert('Failed to export training schedule. Please try again.');
    }
  };

  const exportScheduledEquipment = async () => {
    try {
      // Filter only scheduled equipment collections
      const scheduledEquipment = data.filter(item => 
        item.equipment_status === 'Scheduled' && 
        item.equipment_scheduled_date
      );

      if (scheduledEquipment.length === 0) {
        alert('No scheduled equipment collections to export');
        return;
      }

      // Transform data for equipment schedule export
      const exportData = scheduledEquipment.map(item => ({
        'Rider ID': item.rider_id || '',
        'Rider Name': item.rider_name || '',
        'Phone': item.phone || '',
        'Scheduled Date': item.equipment_scheduled_date || '',
        'Scheduled Time': item.equipment_scheduled_time || '',
        'Location': item.equipment_location || '',
        'Equipment Status': item.equipment_status || '',
        'Training Status': item.training_status || '',
        'Delivery Type': item.delivery_type || '',
        'Audit Status': item.audit_status || '',
        'Job Status': item.job_status || '',
        'Total Items': item.originalRider?.data?.equipment_total_items || 0
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment Schedule');
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `equipment_schedule_${timestamp}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, finalFilename);
      
      console.log(`Equipment schedule exported: ${scheduledEquipment.length} scheduled collections`);
    } catch (error) {
      console.error('Error exporting equipment schedule:', error);
      alert('Failed to export equipment schedule. Please try again.');
    }
  };

  const exportCompletedEquipment = async () => {
    try {
      // Helper to get partner info
      const getPartnerInfo = (riderData: any) => {
        const riderPartnerId = riderData.partner_id;
        if (!riderPartnerId || !partners || partners.length === 0) {
          return {
            partner_id: riderData.partner_id || 'N/A',
            partner_name: riderData.partner_company_name_en || riderData.partner_name || 'N/A',
            business_status: 'N/A',
            manager_mis_ids: riderData.manager_mis_ids || 'N/A'
          };
        }
        const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
        if (matchedPartner) {
          return {
            partner_id: matchedPartner.partner_id || 'N/A',
            partner_name: matchedPartner.partner_name || matchedPartner.name || 'N/A',
            business_status: matchedPartner.business_status || 'N/A',
            manager_mis_ids: matchedPartner.manager_mis_ids || riderData.manager_mis_ids || 'N/A'
          };
        }
        return {
          partner_id: riderPartnerId,
          partner_name: riderData.partner_company_name_en || riderData.partner_name || 'N/A',
          business_status: 'N/A',
          manager_mis_ids: riderData.manager_mis_ids || 'N/A'
        };
      };

      // Filter only completed equipment distributions
      const completed = data.filter(item => 
        item.equipment_status === 'Completed' && 
        (item.originalRider?.data?.equipment_allocated_items?.length || 0) > 0
      );

      if (completed.length === 0) {
        alert('No completed equipment distributions to export');
        return;
      }

      // Transform: flatten equipment items into dynamic columns per item/size; omit zeros
      const exportData = completed.map(item => {
        const rider = item.originalRider || item;
        const riderData = rider.data || {};
        const partnerInfo = getPartnerInfo(riderData);

        const equipmentColumns: Record<string, number> = {};
        const allocated = riderData.equipment_allocated_items || [];
        allocated.forEach((equip: any) => {
          const name: string = equip.name;
          const sizes: Record<string, number> = equip.sizes || {};
          Object.entries(sizes).forEach(([size, qty]) => {
            const quantity = Number(qty) || 0;
            if (quantity > 0) {
              const col = `${name} ${size}`; // e.g., "Branded T-Shirts XL"
              equipmentColumns[col] = quantity;
            }
          });
        });

        return {
          'Rider ID': rider.rider_id || riderData.rider_id || 'N/A',
          'Rider Name': riderData.rider_name || 'N/A',
          'Phone': riderData.mobile || 'N/A',
          'Partner ID': partnerInfo.partner_id,
          'Partner Name': partnerInfo.partner_name,
          'Partner Business Status': partnerInfo.business_status,
          'Manager MIS IDs (Partner)': partnerInfo.manager_mis_ids,
          'Completion Date': riderData.equipment_completion_date || item.equipment_completion_date || '',
          'Completion Time': riderData.equipment_completion_time || item.equipment_completion_time || '',
          'Location': riderData.equipment_location || item.equipment_location || '',
          'Equipment Status': 'Completed',
          'Total Items': riderData.equipment_total_items || 0,
          ...equipmentColumns,
          'Created At': rider.created_at || '',
          'Updated At': rider.updated_at || ''
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Completed Equipment');

      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = `equipment_completed_${timestamp}.xlsx`;
      XLSX.writeFile(wb, finalFilename);
      
      console.log(`Equipment completed exported: ${completed.length} records`);
    } catch (error) {
      console.error('Error exporting completed equipment:', error);
      alert('Failed to export completed equipment. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex items-center space-x-3">
        {/* General Export Button */}
        <button
          onClick={exportToXLSX}
          disabled={data.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
          
          {filename === 'training_riders' && (
            <button
              onClick={exportScheduledTrainings}
              disabled={data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export Training Schedule</span>
            </button>
          )}
          {filename === 'equipment_collection_riders' && (
            <button
              onClick={exportScheduledEquipment}
              disabled={data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export Equipment Schedule</span>
            </button>
          )}
          {filename === 'equipment_collection_riders' && (
            <button
              onClick={exportCompletedEquipment}
              disabled={data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export Completed Equipment</span>
            </button>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear all ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            
            {filter.type === 'select' && (
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All {filter.label}</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {filter.type === 'date' && (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}
            
            {filter.type === 'multiselect' && (
              <div className="relative">
                <div className="border border-gray-300 rounded-lg p-2 min-h-[40px] max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-500 mb-2">Select multiple options:</div>
                  {filter.options?.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 text-sm py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                      <input
                        type="checkbox"
                        checked={(activeFilters[filter.key] || []).includes(option.value)}
                        onChange={() => handleMultiSelectChange(filter.key, option.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                  {(!filter.options || filter.options.length === 0) && (
                    <div className="text-xs text-gray-400">No options available</div>
                  )}
                </div>
              </div>
            )}
            
            {filter.type === 'text' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={`Search ${filter.label.toLowerCase()}...`}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => {
              const filter = filters.find(f => f.key === key);
              let displayValue;
              if (filter?.type === 'select') {
                displayValue = filter.options?.find(opt => opt.value === value)?.label || value;
              } else if (filter?.type === 'multiselect' && Array.isArray(value)) {
                displayValue = value.length > 1 ? `${value.length} selected` : 
                  filter.options?.find(opt => opt.value === value[0])?.label || value[0];
              } else {
                displayValue = value;
              }
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter?.label}: {displayValue}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}