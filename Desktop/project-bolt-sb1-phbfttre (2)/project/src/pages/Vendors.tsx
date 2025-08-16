import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { FileUpload } from '../components/common/FileUpload';
import { AddVendorForm } from '../components/forms/AddVendorForm';
import { EditVendorForm } from '../components/forms/EditVendorForm';
import { supabase, type Vendor } from '../lib/supabase';
import { Plus, Building, Mail, MapPin, Edit, Trash2, Upload, Clock, Package } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVendors } from '../hooks/useVendors';
import toast from 'react-hot-toast';

export function Vendors() {
  const { user } = useAuth();
  const { vendors, loading, fetchVendors } = useVendors();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleDeleteVendor = async (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const confirmMessage = `Are you sure you want to delete vendor "${vendor.vendor_name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast.success('Vendor deleted successfully');
      await fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor: ' + error.message);
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditForm(true);
  };

  const handleDataUpload = async (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast.error('No data found in file');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Processing vendor upload:', {
        filename: fileName,
        totalRows: data.length,
        columns: Object.keys(data[0])
      });

      let vendorsCreated = 0;
      let vendorsUpdated = 0;
      let vendorsErrors = 0;

      // Process each vendor
      for (const row of data) {
        try {
          // Clean and normalize the data
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().replace(/\s+/g, '_');
            let value = row[key];
            
            // Handle empty strings and null values
            if (value === '' || value === null || value === undefined) {
              value = null;
            } else if (typeof value === 'string') {
              value = value.trim();
            }
            
            cleanedRow[cleanKey] = value;
          });

          // Map to vendor fields
          const vendorData = {
            // vendor_id will be auto-generated
            vendor_name: cleanedRow.vendor_name || cleanedRow.name || 'Unknown Vendor',
            vendor_email: cleanedRow.vendor_email || cleanedRow.email,
            location: cleanedRow.location || cleanedRow.address || 'Location not specified',
            boxes_per_hour: parseInt(cleanedRow.boxes_per_hour || cleanedRow.hourly_capacity || '1'),
            max_boxes_per_day: parseInt(cleanedRow.max_boxes_per_day || cleanedRow.daily_capacity || '8'),
            is_active: cleanedRow.is_active !== false && cleanedRow.status !== 'inactive',
            can_login: cleanedRow.can_login !== false
          };

          // Check if vendor exists by email (primary key)
          const { data: existingVendor, error: checkError } = await supabase
            .from('vendors')
            .select('*')
            .eq('vendor_email', vendorData.vendor_email)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          if (existingVendor) {
            // Update existing vendor
            const { error: updateError } = await supabase
              .from('vendors')
              .update({
                vendor_name: vendorData.vendor_name,
                location: vendorData.location,
                boxes_per_hour: vendorData.boxes_per_hour,
                max_boxes_per_day: vendorData.max_boxes_per_day,
                is_active: vendorData.is_active,
                can_login: vendorData.can_login,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingVendor.id);

            if (updateError) throw updateError;
            vendorsUpdated++;
            console.log(`✅ Updated vendor: ${vendorData.vendor_name}`);
          } else {
            // Create new vendor
            const { error: insertError } = await supabase
              .from('vendors')
              .insert([vendorData]);

            if (insertError) throw insertError;
            vendorsCreated++;
            console.log(`✅ Created vendor: ${vendorData.vendor_name}`);
          }
        } catch (error) {
          console.error('Error processing vendor:', row.vendor_name || row.name || 'Unknown', error);
          vendorsErrors++;
        }
      }

      setUploadResult({
        filename: fileName,
        totalRows: data.length,
        vendorsCreated,
        vendorsUpdated,
        vendorsErrors
      });

      console.log('Vendor upload completed successfully');
      toast.success(`Upload completed! Created: ${vendorsCreated}, Updated: ${vendorsUpdated}, Errors: ${vendorsErrors}`);
      
      // Refresh vendors list
      await fetchVendors();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload vendor data');
    } finally {
      setUploading(false);
    }
  };

  const filterOptions = [
    {
      key: 'location',
      label: 'Location',
      type: 'select' as const,
      options: Array.from(new Set(vendors.map(v => v.location).filter(Boolean))).map(location => ({
        value: location!,
        label: location!
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

  const filteredVendors = vendors.filter(vendor => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'is_active') {
        return vendor[key as keyof Vendor].toString() === value;
      }
      return vendor[key as keyof Vendor] === value;
    });
  });

  const columns = [
    {
      key: 'vendor_info',
      label: 'Vendor Information',
      sortable: true,
      render: (value: string, row: Vendor) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.vendor_name}</p>
            <p className="text-sm text-gray-600">ID: {row.vendor_id}</p>
            {row.vendor_email && (
              <div className="flex items-center space-x-1 mt-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{row.vendor_email}</span>
              </div>
            )}
            {row.can_login && (
              <div className="text-xs text-blue-600 font-medium">Portal Access</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'capacity_info',
      label: 'Installation Capacity',
      render: (value: any, row: Vendor) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-sm font-medium text-blue-600">
              {row.boxes_per_hour} boxes/hour
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Package className="w-3 h-3 text-green-400" />
            <span className="text-sm font-medium text-green-600">
              {row.max_boxes_per_day} boxes/day max
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'service_hours',
      label: 'Service Hours',
      render: (value: any, row: Vendor) => (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">
            <div className="font-medium text-purple-800">
              {(row.start_time || '08:00').slice(0, 5)} - {(row.end_time || '18:00').slice(0, 5)}
            </div>
            <div className="text-gray-500">
              {row.timezone || 'Asia/Qatar'}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(() => {
              const days = Array.isArray(row.serviceable_days) ? row.serviceable_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return days.slice(0, 3).map(day => (
                <span key={day} className="px-1 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                  {day.slice(0, 3)}
                </span>
              ));
            })()}
            {(() => {
              const days = Array.isArray(row.serviceable_days) ? row.serviceable_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return days.length > 3 && (
                <span className="text-xs text-gray-500">+{days.length - 3}</span>
              );
            })()}
          </div>
          {row.break_start_time && row.break_end_time && (
            <div className="text-xs text-orange-600">
              Break: {row.break_start_time.slice(0, 5)}-{row.break_end_time.slice(0, 5)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: Vendor) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditVendor(row)}
            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
            title="Edit vendor"
          >
            <Edit className="w-4 h-4" />
          </button>
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <button
              onClick={() => handleDeleteVendor(row.id)}
              className="p-1 text-red-600 hover:text-red-700 transition-colors"
              title="Delete vendor"
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
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage box installation vendors and their capacity</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendor Data Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Upload className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Upload Vendor Data</h2>
        </div>
        
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">📋 Expected Excel Columns:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-orange-800">
            <div>• <strong>vendor_name</strong> (company name)</div>
            <div>• <strong>vendor_email</strong> (contact email)</div>
            <div>• <strong>location</strong> (vendor location)</div>
            <div>• <strong>boxes_per_hour</strong> (hourly capacity)</div>
            <div>• <strong>max_boxes_per_day</strong> (daily capacity)</div>
            <div>• <strong>can_login</strong> (portal access)</div>
          </div>
          <p className="text-xs text-orange-600 mt-2">
            <strong>Note:</strong> Vendors will be matched by email. Vendor ID is auto-generated (VND001, VND002, etc.).
          </p>
        </div>

        <FileUpload
          title="Upload Vendor Data File"
          description="Upload CSV or Excel file with vendor data. Ensure your file has the columns listed above."
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
              <span className="font-medium">Created:</span> {uploadResult.vendorsCreated}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {uploadResult.vendorsUpdated}
            </div>
            <div>
              <span className="font-medium">Errors:</span> {uploadResult.vendorsErrors}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <FilterPanel
          filters={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          data={filteredVendors}
          filename="vendors"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredVendors}
        searchable
        pagination
        pageSize={20}
      />

      <AddVendorForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          fetchVendors();
        }}
      />

      <EditVendorForm
        isOpen={showEditForm}
        vendor={selectedVendor}
        onClose={() => {
          setShowEditForm(false);
          setSelectedVendor(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setSelectedVendor(null);
          fetchVendors();
        }}
      />

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-900 font-medium">Processing vendor data...</p>
              <p className="text-gray-600 text-sm mt-1">Updating existing vendors and creating new ones</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}