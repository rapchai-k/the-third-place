import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { FileUpload } from '../components/common/FileUpload';
import { AddPartnerForm } from '../components/forms/AddPartnerForm';
import { EditPartnerForm } from '../components/forms/EditPartnerForm';
import { supabase, type Partner } from '../lib/supabase';
import { Plus, Building, Mail, Phone, MapPin, Edit, Trash2, Upload, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRiders } from '../hooks/useRiders';
import { cleanPartnerData, validatePartnerData } from '../utils/partnerDataCleanup';
import toast from 'react-hot-toast';

export function Partners() {
  const { user } = useAuth();
  const { riders } = useRiders();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const confirmMessage = `Are you sure you want to delete partner "${partner.name || partner.partner_name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Partner deleted successfully');
      await fetchPartners();
    } catch (error: any) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner: ' + error.message);
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowEditForm(true);
  };

  const handleDeleteAllPartners = async () => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete ALL ${partners.length} partners from the database.\n\nThis action cannot be undone!\n\nType "DELETE ALL PARTNERS" to confirm:`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE ALL PARTNERS') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    setDeleting(true);
    try {
      console.log('🗑️ Starting deletion of all partner data...');
      
      // Delete all partners
      const { error: partnersError } = await supabase
        .from('partners')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)

      if (partnersError) throw partnersError;

      console.log('✅ All partner data deleted successfully');
      toast.success('🗑️ All partner data deleted successfully!');
      
      // Refresh partners list
      await fetchPartners();
      
    } catch (error: any) {
      console.error('❌ Error deleting partner data:', error);
      toast.error('Failed to delete partner data: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleExpand = (partnerId: string) => {
    setExpandedPartner(expandedPartner === partnerId ? null : partnerId);
  };

  const getPartnersRiders = (partner: Partner) => {
    if (!riders || riders.length === 0) return [];
    
    const partnerIdentifier = partner.partner_id || partner.id;
    
    return riders.filter(rider => {
      const riderPartnerId = rider.data.partner_id || rider.data.Partner_ID;
      const riderPartnerName = rider.data.partner_company_name_en || rider.data.partner_name;
      
      // Match by partner_id first, then by name
      return riderPartnerId === partnerIdentifier || 
             riderPartnerName === (partner.partner_company_name_en || partner.name);
    });
  };

  const handleDataUpload = async (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast.error('No data found in file');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Processing partner upload:', {
        filename: fileName,
        totalRows: data.length,
        columns: Object.keys(data[0])
      });

      let partnersCreated = 0;
      let partnersUpdated = 0;
      let partnersNoChange = 0;

      // Process each partner
      for (const row of data) {
        try {
          // Clean and normalize the data
          const cleanedRow = cleanPartnerData(row);
          
          // Validate the cleaned data
          const validation = validatePartnerData(cleanedRow);
          if (!validation.isValid) {
            console.warn(`⚠️ Validation warnings for partner ${cleanedRow.partner_name || cleanedRow.name}:`, validation.errors);
          }

          // Check if partner exists by partner_id first, then by name
          let existingPartner = null;
          
          if (cleanedRow.partner_id) {
            const { data: partnerById, error: checkByIdError } = await supabase
              .from('partners')
              .select('*')
              .eq('partner_id', cleanedRow.partner_id)
              .maybeSingle();

            if (checkByIdError && checkByIdError.code !== 'PGRST116') {
              throw checkByIdError;
            }
            existingPartner = partnerById;
          }

          // If not found by partner_id, try by name
          if (!existingPartner && (cleanedRow.partner_name || cleanedRow.name)) {
            const { data: partnerByName, error: checkByNameError } = await supabase
              .from('partners')
              .select('*')
              .eq('name', cleanedRow.partner_name || cleanedRow.name)
              .maybeSingle();

            if (checkByNameError && checkByNameError.code !== 'PGRST116') {
              throw checkByNameError;
            }
            existingPartner = partnerByName;
          }

          if (existingPartner) {
            // Update existing partner
            const { error: updateError } = await supabase
              .from('partners')
              .update({
                partner_id: cleanedRow.partner_id,
                partner_name: cleanedRow.partner_name,
                name: cleanedRow.partner_name || cleanedRow.name || existingPartner.name,
                partner_city_id: cleanedRow.partner_city_id,
                city: cleanedRow.city,
                location: cleanedRow.city || cleanedRow.location || existingPartner.location,
                cooperation_status: cleanedRow.cooperation_status,
                business_status: cleanedRow.business_status,
                capacity_type: cleanedRow.capacity_type,
                parent_partner_id: cleanedRow.parent_partner_id,
                partner_company_name_en: cleanedRow.partner_company_name_en,
                brand_name: cleanedRow.brand_name,
                signer_email: cleanedRow.signer_email,
                legal_email: cleanedRow.legal_email,
                manager_mis_ids: cleanedRow.manager_mis_ids,
                region: cleanedRow.region,
                car_target: cleanedRow.car_target !== null ? cleanedRow.car_target : 50,
                bike_target: cleanedRow.bike_target !== null ? cleanedRow.bike_target : 50,
                total_target: cleanedRow.total_target !== null ? cleanedRow.total_target : 100,
                email: cleanedRow.signer_email || cleanedRow.legal_email || existingPartner.email,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPartner.id);

            if (updateError) throw updateError;
            partnersUpdated++;
            console.log(`✅ Updated partner: ${cleanedRow.partner_name || cleanedRow.name} - Targets: Car=${cleanedRow.car_target}, Bike=${cleanedRow.bike_target}, Total=${cleanedRow.total_target}`);
          } else {
            // Create new partner
            const { error: insertError } = await supabase
              .from('partners')
              .insert([{
                partner_id: cleanedRow.partner_id,
                partner_name: cleanedRow.partner_name,
                name: cleanedRow.partner_name || cleanedRow.name || 'Unknown Partner',
                partner_city_id: cleanedRow.partner_city_id,
                city: cleanedRow.city,
                location: cleanedRow.city || cleanedRow.location || 'Location not specified',
                cooperation_status: cleanedRow.cooperation_status,
                business_status: cleanedRow.business_status,
                capacity_type: cleanedRow.capacity_type,
                parent_partner_id: cleanedRow.parent_partner_id,
                partner_company_name_en: cleanedRow.partner_company_name_en,
                brand_name: cleanedRow.brand_name,
                signer_email: cleanedRow.signer_email,
                legal_email: cleanedRow.legal_email,
                manager_mis_ids: cleanedRow.manager_mis_ids,
                region: cleanedRow.region,
                car_target: cleanedRow.car_target !== null ? cleanedRow.car_target : 50,
                bike_target: cleanedRow.bike_target !== null ? cleanedRow.bike_target : 50,
                total_target: cleanedRow.total_target !== null ? cleanedRow.total_target : 100,
                email: cleanedRow.signer_email || cleanedRow.legal_email,
                is_active: true
              }]);

            if (insertError) throw insertError;
            partnersCreated++;
            console.log(`✅ Created partner: ${cleanedRow.partner_name || cleanedRow.name} - Targets: Car=${cleanedRow.car_target}, Bike=${cleanedRow.bike_target}, Total=${cleanedRow.total_target}`);
          }
        } catch (error) {
          console.error('Error processing partner:', row.partner_name || row.name || 'Unknown', error);
          partnersNoChange++;
        }
      }

      setUploadResult({
        filename: fileName,
        totalRows: data.length,
        partnersCreated,
        partnersUpdated,
        partnersNoChange
      });

      console.log('Partner upload completed successfully');
      toast.success(`Upload completed! Created: ${partnersCreated}, Updated: ${partnersUpdated}, Errors: ${partnersNoChange}`);
      
      // Refresh partners list
      await fetchPartners();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload partner data');
    } finally {
      setUploading(false);
    }
  };

  const filterOptions = [
    {
      key: 'partner',
      label: 'Partner',
      type: 'select' as const,
      options: partners.map(p => ({
        value: p.partner_id || p.id,
        label: `${p.partner_name || p.name} (${p.partner_id || p.id.slice(0, 8)})`
      }))
    },
    {
      key: 'region',
      label: 'Region',
      type: 'select' as const,
      options: Array.from(new Set(partners.map(p => p.region).filter(Boolean))).map(region => ({
        value: region!,
        label: region!
      }))
    },
    {
      key: 'cooperation_status',
      label: 'Cooperation Status',
      type: 'select' as const,
      options: Array.from(new Set(partners.map(p => p.cooperation_status).filter(Boolean))).map(status => ({
        value: status!,
        label: status!
      }))
    },
    {
      key: 'business_status',
      label: 'Business Status',
      type: 'select' as const,
      options: Array.from(new Set(partners.map(p => p.business_status).filter(Boolean))).map(status => ({
        value: status!,
        label: status!
      }))
    },
    {
      key: 'capacity_type',
      label: 'Capacity Type',
      type: 'select' as const,
      options: Array.from(new Set(partners.map(p => p.capacity_type).filter(Boolean))).map(type => ({
        value: type!,
        label: type!
      }))
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const filteredPartners = partners.filter(partner => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'partner') {
        const selected = String(value);
        return partner.id === selected || (partner.partner_id || '') === selected;
      }
      if (key === 'is_active') {
        return String(partner[key as keyof Partner]) === String(value);
      }
      return partner[key as keyof Partner] === value;
    });
  });

  const columns = [
    {
      key: 'expand',
      label: '',
      render: (value: any, row: Partner) => {
        const partnerRiders = getPartnersRiders(row);
        return (
          <button
            onClick={() => handleToggleExpand(row.id)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={`${partnerRiders.length} riders`}
          >
            {expandedPartner === row.id ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        );
      },
    },
    {
      key: 'partner_info',
      label: 'Partner Information',
      sortable: true,
      render: (value: string, row: Partner) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.partner_name || row.name}
            </p>
            <p className="text-sm text-gray-600">
              ID: {row.partner_id || row.id.slice(0, 8)}
            </p>
            {row.brand_name && (
              <p className="text-xs text-blue-600">Brand: {row.brand_name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'location_info',
      label: 'Location & Region',
      sortable: true,
      render: (value: string, row: Partner) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{row.city || row.location}</span>
          </div>
          {row.region && (
            <div className="text-xs text-gray-600">Region: {row.region}</div>
          )}
          {row.manager_mis_ids && (
            <div className="text-xs text-gray-600">Managers: {row.manager_mis_ids}</div>
          )}
          {row.partner_city_id && (
            <div className="text-xs text-gray-500">City ID: {row.partner_city_id}</div>
          )}
        </div>
      ),
    },
    {
      key: 'business_status',
      label: 'Business Status',
      sortable: true,
      render: (value: any, row: Partner) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.business_status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.business_status || 'N/A'}
        </span>
      ),
    },
    {
      key: 'contact_info',
      label: 'Contact Information',
      render: (value: string, row: Partner) => (
        <div className="space-y-1">
          {row.signer_email && (
            <div className="flex items-center space-x-1">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">Signer: {row.signer_email}</span>
            </div>
          )}
          {row.legal_email && (
            <div className="flex items-center space-x-1">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">Legal: {row.legal_email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{row.phone}</span>
            </div>
          )}
          {row.manager_mis_ids && (
            <div className="text-xs text-gray-500">Managers: {row.manager_mis_ids}</div>
          )}
        </div>
      ),
    },
    {
      key: 'riders_count',
      label: 'Riders',
      render: (value: any, row: Partner) => {
        const partnerRiders = getPartnersRiders(row);
        
        // Count only riders who are SCHEDULED or COMPLETED in any workflow
        const activeRiders = partnerRiders.filter(rider => {
          const data = rider.data;
          const trainingStatus = data.training_status;
          const installationStatus = data.box_installation;
          const equipmentStatus = data.equipment_status;
          
          // Check if rider is scheduled or completed in ANY workflow
          const isActiveInWorkflow = 
            (trainingStatus === 'Scheduled' || trainingStatus === 'Completed') ||
            (installationStatus === 'Scheduled' || installationStatus === 'Completed') ||
            (equipmentStatus === 'Scheduled' || equipmentStatus === 'Completed');
          
          return isActiveInWorkflow;
        });
        
        // Count by delivery type for active riders only
        const carRiders = activeRiders.filter(r => r.data.delivery_type === 'Car');
        const bikeRiders = activeRiders.filter(r => r.data.delivery_type === 'Motorcycle');
        
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {activeRiders.length}
              </span>
              <span className="text-xs text-gray-500">active in workflows</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">🚗 Car:</span>
                <span className="font-medium">{carRiders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🏍️ Motorcycle:</span>
                <span className="font-medium">{bikeRiders.length}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'targets',
      label: 'Targets & Capacity',
      render: (value: any, row: Partner) => {
        const partnerRiders = getPartnersRiders(row);
        
        // Count only riders who are SCHEDULED or COMPLETED in any workflow
        const activeRiders = partnerRiders.filter(rider => {
          const data = rider.data;
          const trainingStatus = data.training_status;
          const installationStatus = data.box_installation;
          const equipmentStatus = data.equipment_status;
          
          // Check if rider is scheduled or completed in ANY workflow
          const isActiveInWorkflow = 
            (trainingStatus === 'Scheduled' || trainingStatus === 'Completed') ||
            (installationStatus === 'Scheduled' || installationStatus === 'Completed') ||
            (equipmentStatus === 'Scheduled' || equipmentStatus === 'Completed');
          
          return isActiveInWorkflow;
        });
        
        // Count by delivery type for active riders only
        const carRiders = activeRiders.filter(r => r.data.delivery_type === 'Car');
        const bikeRiders = activeRiders.filter(r => r.data.delivery_type === 'Motorcycle');
        // Get targets from database - use defaults only if not set
        const carTarget = row.car_target !== null && row.car_target !== undefined ? row.car_target : 50;
        const bikeTarget = row.bike_target !== null && row.bike_target !== undefined ? row.bike_target : 50;
        const totalTarget = row.total_target !== null && row.total_target !== undefined ? row.total_target : 100;
        
        const carUsage = carTarget === 0 ? 0 : Math.round((carRiders.length / carTarget) * 100);
        const bikeUsage = bikeTarget === 0 ? 0 : Math.round((bikeRiders.length / bikeTarget) * 100);
        const totalUsage = totalTarget === 0 ? 0 : Math.round((activeRiders.length / totalTarget) * 100);
        
        console.log(`🎯 PARTNER CAPACITY DEBUG - ${row.partner_name || row.name}:`, {
          car_target_db: row.car_target,
          bike_target_db: row.bike_target,
          total_target_db: row.total_target,
          car_target_used: carTarget,
          bike_target_used: bikeTarget,
          total_target_used: totalTarget,
          active_car_riders: carRiders.length,
          active_bike_riders: bikeRiders.length,
          active_total_riders: activeRiders.length,
          total_riders_all_status: partnerRiders.length
        });
        
        return (
          <div className="space-y-3">
            {/* Car Target */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">🚗 Car Target</span>
                <span className="text-xs text-gray-600">{carRiders.length}/{carTarget}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    carTarget === 0 ? 'bg-gray-400' :
                    carUsage >= 100 ? 'bg-red-500' :
                    carUsage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${carTarget === 0 ? 100 : Math.min(100, carUsage)}%` }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${
                carTarget === 0 ? 'text-gray-600' :
                carUsage >= 100 ? 'text-red-600' :
                carUsage >= 80 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {carTarget === 0 ? 'No car target' : `${carUsage}%`}
              </span>
            </div>
            
            {/* Motorcycle Target */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">🏍️ Motorcycle Target</span>
                <span className="text-xs text-gray-600">{bikeRiders.length}/{bikeTarget}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    bikeTarget === 0 ? 'bg-gray-400' :
                    bikeUsage >= 100 ? 'bg-red-500' :
                    bikeUsage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${bikeTarget === 0 ? 100 : Math.min(100, bikeUsage)}%` }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${
                bikeTarget === 0 ? 'text-gray-600' :
                bikeUsage >= 100 ? 'text-red-600' :
                bikeUsage >= 80 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {bikeTarget === 0 ? 'No motorcycle target' : `${bikeUsage}%`}
              </span>
            </div>
            
            {/* Total Target */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">📊 Total Target</span>
                <span className="text-xs text-gray-600">{activeRiders.length}/{totalTarget}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    totalTarget === 0 ? 'bg-gray-400' :
                    totalUsage >= 100 ? 'bg-red-500' :
                    totalUsage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${totalTarget === 0 ? 100 : Math.min(100, totalUsage)}%` }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${
                totalTarget === 0 ? 'text-gray-600' :
                totalUsage >= 100 ? 'text-red-600' :
                totalUsage >= 80 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {totalTarget === 0 ? 'No total target' : `${totalUsage}%`}
              </span>
            </div>

          </div>
        );
      },
    },
    {
      key: 'workflow_summary',
      label: 'Workflow Summary',
      render: (value: any, row: Partner) => {
        const partnerRiders = getPartnersRiders(row);
        const trainingScheduled = partnerRiders.filter(r => (r.data.training_status || '') === 'Scheduled').length;
        const trainingCompleted = partnerRiders.filter(r => (r.data.training_status || '') === 'Completed').length;
        const equipmentScheduled = partnerRiders.filter(r => (r.data.equipment_status || '') === 'Scheduled').length;
        const equipmentCompleted = partnerRiders.filter(r => (r.data.equipment_status || '') === 'Completed').length;
        const boxScheduled = partnerRiders.filter(r => (r.data.box_installation || '') === 'Scheduled').length;
        const boxCompleted = partnerRiders.filter(r => (r.data.box_installation || '') === 'Completed').length;

        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Training (C/S)</span>
              <span className="font-semibold">{trainingCompleted}/{trainingScheduled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Equipment (C/S)</span>
              <span className="font-semibold">{equipmentCompleted}/{equipmentScheduled}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Box Install (C/S)</span>
              <span className="font-semibold">{boxCompleted}/{boxScheduled}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'cooperation_status',
      label: 'Cooperation Status',
      sortable: true,
      render: (value: string, row: Partner) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.cooperation_status === 'In Cooperation' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.cooperation_status || 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Partner) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditPartner(row)}
            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
            title="Edit partner"
          >
            <Edit className="w-4 h-4" />
          </button>
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <button
              onClick={() => handleDeletePartner(row.id)}
              className="p-1 text-red-600 hover:text-red-700 transition-colors"
              title="Delete partner"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600 mt-1">Manage installation partners and their associated riders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={async () => {
              try {
                setExporting(true);
                // Build export rows per partner with targets and status counts
                const rows = partners.map((p) => {
                  const partnerRiders = getPartnersRiders(p);
                  const totalRegistered = partnerRiders.length;
                  const activeCount = partnerRiders.filter(r => (r.data.job_status || '').toLowerCase() === 'on job').length;
                  const resignedCount = partnerRiders.filter(r => String(r.data.job_status || '').toLowerCase().startsWith('resign')).length;

                  const trainingScheduled = partnerRiders.filter(r => (r.data.training_status || '') === 'Scheduled').length;
                  const trainingCompleted = partnerRiders.filter(r => (r.data.training_status || '') === 'Completed').length;
                  const equipmentScheduled = partnerRiders.filter(r => (r.data.equipment_status || '') === 'Scheduled').length;
                  const equipmentCompleted = partnerRiders.filter(r => (r.data.equipment_status || '') === 'Completed').length;
                  const boxScheduled = partnerRiders.filter(r => (r.data.box_installation || '') === 'Scheduled').length;
                  const boxCompleted = partnerRiders.filter(r => (r.data.box_installation || '') === 'Completed').length;

                  const carTarget = p.car_target ?? 50;
                  const bikeTarget = p.bike_target ?? 50;
                  const totalTarget = p.total_target ?? 100;

                  return {
                    partner_id: p.partner_id || p.id,
                    partner_name: p.partner_name || p.name,
                    city: p.city || p.location || '',
                    region: p.region || '',
                    manager_mis_ids: p.manager_mis_ids || '',
                    cooperation_status: p.cooperation_status || '',
                    business_status: p.business_status || '',
                    car_target: carTarget,
                    bike_target: bikeTarget,
                    total_target: totalTarget,
                    registered: totalRegistered,
                    active: activeCount,
                    resigned: resignedCount,
                    training_scheduled: trainingScheduled,
                    training_completed: trainingCompleted,
                    equipment_scheduled: equipmentScheduled,
                    equipment_completed: equipmentCompleted,
                    box_scheduled: boxScheduled,
                    box_completed: boxCompleted,
                  };
                });

                // Convert to CSV
                const headers = Object.keys(rows[0] || {});
                const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
                  const v = (r as any)[h];
                  if (h === 'partner_id') {
                    // Force Excel to treat long numeric-like IDs as text and preserve full value
                    const id = v == null ? '' : String(v).replace(/"/g, '""');
                    return `="${id}"`;
                  }
                  const s = v == null ? '' : String(v).replace(/"/g, '""');
                  return /[",\n]/.test(s) ? `"${s}"` : s;
                }).join(','))].join('\n');

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `partners_export_${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('Export failed', e);
                toast.error('Failed to export partners');
              } finally {
                setExporting(false);
              }
            }}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Partners</span>
          </button>
          <button
            onClick={handleDeleteAllPartners}
            disabled={loading || partners.length === 0}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            <span>Remove All Partners</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* Partner Data Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Upload Partner Data</h2>
        </div>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Expected Excel Columns:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800">
            <div>• <strong>partner_id</strong> (unique identifier)</div>
            <div>• <strong>partner_name</strong> (company name)</div>
            <div>• <strong>partner_city_id</strong> (city ID)</div>
            <div>• <strong>city</strong> (city name)</div>
            <div>• <strong>cooperation_status</strong> (cooperation status)</div>
            <div>• <strong>business_status</strong> (business status)</div>
            <div>• <strong>capacity_type</strong> (capacity type)</div>
            <div>• <strong>parent_partner_id</strong> (parent partner)</div>
            <div>• <strong>partner_company_name_en</strong> (English name)</div>
            <div>• <strong>brand_name</strong> (brand)</div>
            <div>• <strong>signer_email</strong> (signer email)</div>
            <div>• <strong>legal_email</strong> (legal email)</div>
            <div>• <strong>manager_mis_ids</strong> (manager IDs)</div>
            <div>• <strong>region</strong> (regional classification)</div>
            <div>• <strong>Car target</strong> (max car delivery riders)</div>
            <div>• <strong>Bike Target</strong> (max motorcycle riders)</div>
            <div>• <strong>Total</strong> (max total riders)</div>
            <div>• <strong>car target</strong> (max car delivery riders)</div>
            <div>• <strong>bike target</strong> (max motorcycle riders)</div>
            <div>• <strong>total</strong> (max total riders)</div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            <strong>Note:</strong> Partners will be matched by partner_id first, then by name. Target columns (Car target, Bike Target, Total) will update capacity limits for scheduling validation.
          </p>
        </div>

        <FileUpload
          title="Upload Partner Data File"
          description="Upload CSV or Excel file with partner data. Ensure your file has the columns listed above."
          onFileProcessed={handleDataUpload}
        />
      </div>

      {uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 font-medium">Upload Completed Successfully!</h3>
          <div className="text-green-700 text-sm mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total Rows:</span> {uploadResult.totalRows}
            </div>
            <div>
              <span className="font-medium">Created:</span> {uploadResult.partnersCreated}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {uploadResult.partnersUpdated}
            </div>
            <div>
              <span className="font-medium">Errors:</span> {uploadResult.partnersNoChange}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <FilterPanel
          filters={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          data={filteredPartners}
          filename="partners"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredPartners.map(partner => {
          const partnerRiders = getPartnersRiders(partner);
          return {
            ...partner,
            riders_count: partnerRiders.length,
            expandedContent: expandedPartner === partner.id ? (
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Associated Riders ({partnerRiders.length})
                </h4>
                {partnerRiders.length === 0 ? (
                  <p className="text-gray-600 text-sm">No riders associated with this partner</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {partnerRiders.slice(0, 12).map((rider) => (
                      <div key={rider.id} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">
                            {rider.data.rider_name || 'Unknown'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>ID: {rider.rider_id}</div>
                          <div>Phone: {rider.data.mobile || 'N/A'}</div>
                          <div>Delivery: {rider.data.delivery_type || 'N/A'}</div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              rider.data.training_status === 'Completed' ? 'bg-green-100 text-green-800' :
                              rider.data.training_status === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                              rider.data.training_status === 'Eligible' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              T: {rider.data.training_status || 'N/A'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              rider.data.box_installation === 'Completed' ? 'bg-green-100 text-green-800' :
                              rider.data.box_installation === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
                              rider.data.box_installation === 'Eligible' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              I: {rider.data.box_installation || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {partnerRiders.length > 12 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-center">
                        <span className="text-blue-700 text-sm font-medium">
                          +{partnerRiders.length - 12} more riders
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null
          };
        })}
        searchable
        pagination
        pageSize={20}
        expandableRows
        onRowExpand={handleToggleExpand}
        expandedRowId={expandedPartner}
      />

      <AddPartnerForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          fetchPartners();
        }}
      />

      <EditPartnerForm
        isOpen={showEditForm}
        partner={selectedPartner}
        onClose={() => {
          setShowEditForm(false);
          setSelectedPartner(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setSelectedPartner(null);
          fetchPartners();
        }}
      />

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Upload Partner Data</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FileUpload
                title="Upload Partner Data File"
                description="Upload CSV or Excel file with partner data. Ensure your file has the expected columns."
                onFileProcessed={async (data, fileName) => {
                  await handleDataUpload(data, fileName);
                  setShowUploadModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900 font-medium">Processing partner data...</p>
              <p className="text-gray-600 text-sm mt-1">Updating existing partners and creating new ones</p>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-900 font-medium">Deleting all partners...</p>
              <p className="text-gray-600 text-sm mt-1">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}