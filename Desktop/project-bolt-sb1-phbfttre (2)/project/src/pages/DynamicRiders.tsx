import React, { useState } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { CreateRiderForm } from '../components/forms/CreateRiderForm';
import { EditableCell } from '../components/common/EditableCell';
import { Plus, Zap, RefreshCw, Building } from 'lucide-react';
import { Eye } from 'lucide-react';
import { useRiders } from '../hooks/useRiders';
import { usePartners } from '../hooks/usePartners';
import { useAuth } from '../hooks/useAuth';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export function DynamicRiders() {
  const { user } = useAuth();
  const { riders, loading, dynamicOptions, updateRider, applyBulkEligibilityLogic, totalCount } = useRiders();
  const { partners } = usePartners();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [applyingEligibility, setApplyingEligibility] = useState(false);
  const [selectedProofImage, setSelectedProofImage] = useState<{ url: string; rider: any } | null>(null);
  
  // Verification: Log actual data count
  React.useEffect(() => {
    if (riders && riders.length > 0) {
      console.log(`🔍 DYNAMIC RIDERS VERIFICATION: Loaded ${riders.length} riders in component`);
      if (riders.length < 5000) {
        console.warn(`⚠️ DYNAMIC RIDERS WARNING: Only ${riders.length} riders available, expected 5000+`);
      }
    }
  }, [riders]);

  const getPartnerInfo = (_riderId: string, riderData: any) => {
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

  const filterOptions = [
    {
      key: 'nationality_code',
      label: 'Nationality',
      type: 'select' as const,
      options: dynamicOptions.nationality_code || []
    },
    {
      key: 'manager_mis_ids',
      label: 'Manager MIS IDs',
      type: 'select' as const,
      options: Array.from(new Set(
        partners?.map(p => p.manager_mis_ids).filter(Boolean) || []
      )).map(id => ({ value: id!, label: id! }))
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
        { value: 'Completed', label: 'Completed' },
        { value: 'Not Eligible', label: 'Not Eligible' },
      ],
    },
    {
      key: 'box_installation',
      label: 'Box Installation',
      type: 'select' as const,
      options: [
        { value: 'Eligible', label: 'Eligible' },
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Not Eligible', label: 'Not Eligible' },
      ],
    },
    {
      key: 'equipment_status',
      label: 'Equipment Status',
      type: 'select' as const,
      options: [
        { value: 'Eligible', label: 'Eligible' },
        { value: 'Scheduled', label: 'Scheduled' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Not Eligible', label: 'Not Eligible' },
      ],
    },
  ];

  const filteredRiders = riders.filter(rider => {
    // First filter by partner business status
    const riderPartnerId = rider.data.partner_id;
    // Exclude resigned riders by default, unless user explicitly filters for Resign
    const job = String(rider.data.job_status || '').toLowerCase();
    const wantsResign = String((filters as any).job_status || '').toLowerCase().includes('resign');
    if (job.startsWith('resign') && !wantsResign) return false;
    if (riderPartnerId && partners && partners.length > 0) {
      const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
      if (matchedPartner && matchedPartner.business_status !== 'Open') {
        return false; // Exclude riders with non-Open partners
      }
    }
    
    // Then apply user filters (support derived fields like manager_mis_ids)
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'manager_mis_ids') {
        const partnerInfo = getPartnerInfo(rider.rider_id, rider.data);
        return String(partnerInfo.manager_mis_ids || '').trim() === String(value).trim();
      }
      return rider.data[key] === value;
    });
  });
  
  // Verification: Log filtering results
  React.useEffect(() => {
    console.log(`🔍 FILTERING VERIFICATION: ${filteredRiders.length} riders after partner business status + user filtering from ${riders.length} total`);
  }, [filteredRiders.length, riders.length]);

  // Transform rider data for display
  const displayData = filteredRiders.map(rider => ({
    id: rider.id,
    rider_id: rider.rider_id || 'N/A',
    rider_name: rider.data.rider_name || 'N/A',
    mobile: rider.data.mobile || 'N/A',
    identity_card_number: rider.data.identity_card_number || 'N/A',
    nationality_code: rider.data.nationality_code || 'N/A',
    manager_mis_ids: getPartnerInfo(rider.rider_id, rider.data).manager_mis_ids,
    delivery_type: rider.data.delivery_type || 'N/A',
    audit_status: rider.data.audit_status || 'N/A',
    job_status: rider.data.job_status || 'N/A',
    partner_name: rider.data.partner_company_name_en || rider.data.partner_name || 'N/A',
    training_status: rider.data.training_status || 'N/A',
    box_installation: rider.data.box_installation || 'N/A',
    equipment_status: rider.data.equipment_status || 'N/A',
    partner_id: getPartnerInfo(rider.rider_id, rider.data).partner_id,
    created_at: rider.created_at,
    originalRider: rider
  }));

  const handleApplyEligibilityLogic = async () => {
    if (totalCount === 0) {
      toast.error('No riders to process');
      return;
    }

    setApplyingEligibility(true);
    try {
      console.log(`🎯 Applying eligibility logic to ALL ${totalCount} riders...`);
      await applyBulkEligibilityLogic();
    } catch (error) {
      console.error('Error applying eligibility logic:', error);
      toast.error('Failed to apply eligibility logic');
    } finally {
      setApplyingEligibility(false);
    }
  };

  const handleCellUpdate = async (riderId: string, field: string, newValue: any, additionalData?: Record<string, any>) => {
    return await updateRider(riderId, field, newValue, additionalData);
  };

  const columns = [
    {
      key: 'rider_id',
      label: 'Rider ID',
      sortable: true,
      render: (_value: string, row: any) => (
        <div>
          <p className="font-medium text-gray-900">{row.rider_id}</p>
          <p className="text-sm text-gray-600">{row.rider_name}</p>
        </div>
      ),
    },
    {
      key: 'mobile',
      label: 'Mobile',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm font-mono">{value}</span>
      ),
    },
    {
      key: 'identity_card_number',
      label: 'Identity Card',
      sortable: true,
      render: (_value: string, row: any) => (
        <EditableCell
          value={row.identity_card_number}
          onSave={(newValue) => handleCellUpdate(row.rider_id, 'identity_card_number', newValue)}
          type="text"
        />
      ),
    },
    {
      key: 'nationality_code',
      label: 'Nationality',
      sortable: true,
      render: (_value: string, row: any) => (
        <EditableCell
          value={row.nationality_code}
          onSave={(newValue) => handleCellUpdate(row.rider_id, 'nationality_code', newValue)}
          type="select"
          options={dynamicOptions.nationality_code || []}
        />
      ),
    },
    {
      key: 'manager_mis_ids',
      label: 'Manager MIS IDs',
      sortable: true,
      render: (_value: string, row: any) => {
        return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-900">
            {row.manager_mis_ids}
          </div>
          <div className="text-xs text-blue-600">
            From Partner: {getPartnerInfo(row.rider_id, row.originalRider.data).partner_name}
          </div>
        </div>
        );
      },
    },
    {
      key: 'delivery_type',
      label: 'Delivery Type',
      sortable: true,
      render: (value: string, row: any) => (
        <EditableCell
          value={value}
          onSave={(newValue) => handleCellUpdate(row.rider_id, 'delivery_type', newValue)}
          type="select"
          options={[
            { value: 'Car', label: 'Car' },
            { value: 'Motorcycle', label: 'Motorcycle' }
          ]}
        />
      ),
    },
    {
      key: 'audit_status',
      label: 'Audit Status',
      sortable: true,
      render: (value: string, row: any) => (
        <EditableCell
          value={value}
          onSave={(newValue) => handleCellUpdate(row.rider_id, 'audit_status', newValue)}
          type="select"
          options={[
            { value: 'Audit Pass', label: 'Audit Pass' },
            { value: 'Audit Reject', label: 'Audit Reject' }
          ]}
        />
      ),
    },
    {
      key: 'job_status',
      label: 'Job Status',
      sortable: true,
      render: (value: string, row: any) => (
        <EditableCell
          value={value}
          onSave={(newValue) => handleCellUpdate(row.rider_id, 'job_status', newValue)}
          type="select"
          options={[
            { value: 'On Job', label: 'On Job' },
            { value: 'Resign', label: 'Resign' }
          ]}
        />
      ),
    },
    {
      key: 'partner_info',
      label: 'Partner Information',
      sortable: true,
      render: (_value: string, row: any) => {
        const partnerInfo = getPartnerInfo(row.rider_id, row.originalRider.data);
        return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Building className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium">{partnerInfo.partner_name}</span>
          </div>
          <div className="text-xs text-gray-600">
            ID: {partnerInfo.partner_id}
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
      render: (_value: string, row: any) => {
        const partnerInfo = getPartnerInfo(row.rider_id, row.originalRider.data);
        return (
          <div className="text-sm font-mono text-gray-900">
            {partnerInfo.partner_id}
          </div>
        );
      },
    },
    {
      key: 'training_status',
      label: 'Training',
      sortable: true,
      render: (value: string, row: any) => (
        <EditableCell
          value={value}
          onSave={(newValue, additionalData) => handleCellUpdate(row.rider_id, 'training_status', newValue, additionalData)}
          type="select"
          fieldName="training_status"
          riderId={row.rider_id}
          riderData={row.originalRider.data}
          options={[
            { value: 'Eligible', label: 'Eligible' },
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Not Eligible', label: 'Not Eligible' }
          ]}
        />
      ),
    },
    {
      key: 'training_info',
      label: 'Training Info',
      render: (_value: any, row: any) => {
        const trainingStatus = row.training_status;
        const data = row.originalRider.data;
        
        if (trainingStatus === 'Scheduled') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-blue-800">Scheduled:</div>
              {data.training_scheduled_date && (
                <div>{data.training_scheduled_date}</div>
              )}
              {data.training_scheduled_time && (
                <div>at {data.training_scheduled_time}</div>
              )}
              {data.training_location && (
                <div className="text-gray-500">{data.training_location}</div>
              )}
              {(data.training_scheduled_by || data.last_updated_by) && (
                <div className="text-gray-500">by {data.training_scheduled_by || data.last_updated_by}</div>
              )}
            </div>
          );
        } else if (trainingStatus === 'Completed') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-green-800">Completed:</div>
              {(data.training_completion_date || data.training_completed_date) && (
                <div>
                  {data.training_completion_date || data.training_completed_date}
                  {(data.training_completion_time || data.training_completed_time) && (
                    <span> at {data.training_completion_time || data.training_completed_time}</span>
                  )}
                </div>
              )}
              {(data.training_completed_by || data.training_trainer) && (
                <div>by {data.training_completed_by || data.training_trainer}</div>
              )}
              {(data.training_notes || data.training_completion_notes) && (
                <div className="text-gray-500">{data.training_notes || data.training_completion_notes}</div>
              )}
              {!data.training_completion_date && !data.training_completed_date && (
                <div className="text-green-600">Training completed</div>
              )}
            </div>
          );
        }
        return <span className="text-xs text-gray-500">No info available</span>;
      },
    },
    {
      key: 'box_installation',
      label: 'Box Installation',
      sortable: true,
      render: (_value: string, row: any) => (
        <EditableCell
          value={row.box_installation}
          onSave={(newValue, additionalData) => handleCellUpdate(row.rider_id, 'box_installation', newValue, additionalData)}
          type="select"
          fieldName="box_installation"
          riderId={row.rider_id}
          riderData={row.originalRider.data}
          options={[
            { value: 'Eligible', label: 'Eligible' },
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Not Eligible', label: 'Not Eligible' }
          ]}
        />
      ),
    },
    {
      key: 'installation_info',
      label: 'Installation Info',
      render: (_value: any, row: any) => {
        const installationStatus = row.box_installation;
        const data = row.originalRider.data;
        
        if (installationStatus === 'Scheduled') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-orange-800">Scheduled:</div>
              {data.installation_scheduled_date && (
                <div>{data.installation_scheduled_date}</div>
              )}
              {data.installation_scheduled_time && (
                <div>at {data.installation_scheduled_time}</div>
              )}
              {data.installation_location && (
                <div className="text-gray-500">{data.installation_location}</div>
              )}
              {(data.installation_scheduled_by || data.last_updated_by) && (
                <div className="text-gray-500">by {data.installation_scheduled_by || data.last_updated_by}</div>
              )}
            </div>
          );
        } else if (installationStatus === 'Completed') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-green-800">Completed:</div>
              {data.installation_completion_date && (
                <div>
                  {data.installation_completion_date}
                  {data.installation_completion_time && (
                    <span> at {data.installation_completion_time}</span>
                  )}
                </div>
              )}
              {data.installation_completed_by && (
                <div>by {data.installation_completed_by}</div>
              )}
              {(data.installation_proof_image || (data as any).proof_image_url) && (
                <button
                  onClick={() => setSelectedProofImage({ url: data.installation_proof_image || (data as any).proof_image_url, rider: row })}
                  className="mt-1 flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Proof Image</span>
                </button>
              )}
            </div>
          );
        }
        return <span className="text-xs text-gray-500">No info available</span>;
      },
    },
    {
      key: 'equipment_status',
      label: 'Equipment',
      sortable: true,
      render: (value: string, row: any) => (  
        <EditableCell
          value={value}
          onSave={(newValue, additionalData) => handleCellUpdate(row.rider_id, 'equipment_status', newValue, additionalData)}
          type="select"
          fieldName="equipment_status"
          riderId={row.rider_id}
          riderData={row.originalRider.data}
          options={[
            { value: 'Eligible', label: 'Eligible' },
            { value: 'Scheduled', label: 'Scheduled' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Not Eligible', label: 'Not Eligible' }
          ]}
        />
      ),
    },
    {
      key: 'equipment_info',
      label: 'Equipment Info',
      render: (_value: any, row: any) => {
        const equipmentStatus = row.equipment_status;
        const data = row.originalRider.data;
        
        if (equipmentStatus === 'Scheduled') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-purple-800">Scheduled:</div>
              {data.equipment_scheduled_date && (
                <div>{data.equipment_scheduled_date}</div>
              )}
              {data.equipment_scheduled_time && (
                <div>at {data.equipment_scheduled_time}</div>
              )}
              {data.equipment_location && (
                <div className="text-gray-500">{data.equipment_location}</div>
              )}
              {data.equipment_allocated_items && data.equipment_allocated_items.length > 0 && (
                <div className="mt-1">
                  <div className="font-medium text-purple-700">Allocated:</div>
                  {data.equipment_allocated_items.map((item: { name: string; sizes: Record<string, number> }, index: number) => {
                    const totalQty = Object.values(item.sizes).reduce((sum: number, qty: number) => sum + qty, 0);
                    return (
                      <div key={index} className="text-xs">
                        • {item.name}: {totalQty} items
                      </div>
                    );
                  })}
                  <div className="text-purple-600 font-medium">
                    Total: {data.equipment_total_items || 0} items
                  </div>
                </div>
              )}
              {(data.equipment_scheduled_by || data.last_updated_by) && (
                <div className="text-gray-500">by {data.equipment_scheduled_by || data.last_updated_by}</div>
              )}
            </div>
          );
        } else if (equipmentStatus === 'Completed') {
          return (
            <div className="text-xs text-gray-600">
              <div className="font-medium text-green-800">Completed:</div>
              {data.equipment_completion_date && (
                <div>
                  {data.equipment_completion_date}
                  {data.equipment_completion_time && (
                    <span> at {data.equipment_completion_time}</span>
                  )}
                </div>
              )}
              {data.equipment_distributed_by && (
                <div>by {data.equipment_distributed_by}</div>
              )}
              {data.equipment_allocated_items && data.equipment_allocated_items.length > 0 && (
                <div className="mt-1">
                  <div className="font-medium text-green-700">Distributed:</div>
                  {data.equipment_allocated_items.map((item: { name: string; sizes: Record<string, number> }, index: number) => {
                    const totalQty = Object.values(item.sizes).reduce((sum: number, qty: number) => sum + qty, 0);
                    const sizeBreakdown = Object.entries(item.sizes)
                      .filter(([_size, qty]: [string, number]) => qty > 0)
                      .map(([size, qty]: [string, number]) => `${size}:${qty}`)
                      .join(', ');
                    return (
                      <div key={index} className="text-xs">
                        • {item.name}: {totalQty} items
                        {sizeBreakdown && (
                          <div className="text-gray-400 ml-2">({sizeBreakdown})</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="text-green-600 font-medium">
                    Total: {data.equipment_total_items || 0} items distributed
                  </div>
                </div>
              )}
              {!data.equipment_allocated_items && (
                <div className="text-green-600">Equipment distributed</div>
              )}
            </div>
          );
        }
        return <span className="text-xs text-gray-500">No info available</span>;
      },
    },
    {
      key: 'last_updated',
      label: 'Last Updated',
      sortable: true,
      render: (_value: any, row: any) => (
        <div className="text-xs text-gray-700">
          <div>{row.originalRider.updated_at ? new Date(row.originalRider.updated_at).toLocaleString() : 'N/A'}</div>
          {(row.originalRider.data.last_updated_by || row.originalRider.data.updated_by) && (
            <div className="text-gray-500">by {row.originalRider.data.last_updated_by || row.originalRider.data.updated_by}</div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Riders</h2>
          <p className="text-gray-600 mb-4">Fetching {totalCount > 0 ? totalCount : '5000+'} riders from database...</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Please wait:</strong> Loading complete dataset with eligibility calculations
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Riders</h1>
          <p className="text-gray-600 mt-1">
            Manage rider data with inline editing and eligibility logic (Open Partners Only)
          </p>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🏢 Partner Filter:</strong> Only showing riders whose partners have "Open" business status
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-sm text-gray-500">
              📊 Total riders in database: <strong>{totalCount}</strong>
            </p>
            <p className="text-sm text-gray-500">
              👁️ Currently showing: <strong>{filteredRiders.length}</strong> riders (Open Partners)
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleApplyEligibilityLogic}
            disabled={applyingEligibility || riders.length === 0}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyingEligibility ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>
              {applyingEligibility ? 'Applying...' : `Apply Eligibility Logic (${totalCount} riders)`}
            </span>
          </button>
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rider</span>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <FilterPanel
          filters={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          data={displayData}
          filename="dynamic_riders"
        />
      </div>

      <DataTable
        columns={columns}
        data={displayData}
        searchable
        pagination
        pageSize={50}
      />

      <CreateRiderForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          // Refresh will happen automatically via the hook
        }}
      />

      {/* Proof Image Viewing Modal */}
      {selectedProofImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Installation Proof Image</h2>
                <button
                  onClick={() => setSelectedProofImage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Installation Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Completed Installation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                  <div>
                    <div><strong>Rider:</strong> {selectedProofImage.rider.rider_name}</div>
                    <div><strong>Rider ID:</strong> {selectedProofImage.rider.rider_id}</div>
                    <div><strong>Phone:</strong> {selectedProofImage.rider.mobile}</div>
                  </div>
                  <div>
                    <div><strong>Date:</strong> {selectedProofImage.rider.originalRider.data.installation_completion_date}</div>
                    <div><strong>Time:</strong> {selectedProofImage.rider.originalRider.data.installation_completion_time}</div>
                    <div><strong>Completed by:</strong> {selectedProofImage.rider.originalRider.data.installation_completed_by}</div>
                  </div>
                </div>
              </div>

              {/* Proof Image */}
              <div className="text-center">
                <img
                  src={selectedProofImage.url}
                  alt="Installation proof"
                  className="max-w-full max-h-96 object-contain mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('❌ Failed to load proof image');
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedProofImage(null)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}