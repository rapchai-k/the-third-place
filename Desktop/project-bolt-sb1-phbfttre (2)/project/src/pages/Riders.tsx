import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { AddRiderForm } from '../components/forms/AddRiderForm';
import { supabase, type Rider } from '../lib/supabase';
import { Plus, Phone, Mail } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { usePartners } from '../hooks/usePartners';
import toast from 'react-hot-toast';

export function Riders() {
  const { selectedProject } = useProject();
  const { partners } = usePartners();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    if (!selectedProject) {
      setRiders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('project_id', selectedProject.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiders(data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [selectedProject]);

  // Build Manager MIS list from rider data
  const managerSet = new Set<string>();
  (riders || []).forEach(r => {
    const raw = [ (r as any).data?.manager_mis_ids, (r as any).data?.manager_id, (r as any).data?.manager ]
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .join(',');
    raw.split(/[,|]/).map(s => s.trim()).filter(Boolean).forEach(v => managerSet.add(v));
  });

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'audit_pass', label: 'Audit Pass' },
        { value: 'on_job', label: 'On Job' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'manager_mis_ids',
      label: 'Manager MIS IDs',
      type: 'select' as const,
      options: Array.from(managerSet).sort().map(id => ({ value: id, label: id }))
    },
    {
      key: 'three_pl_status',
      label: '3PL Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle Type',
      type: 'select' as const,
      options: [
        { value: 'bike', label: 'Bike' },
        { value: 'scooter', label: 'Scooter' },
      ],
    },
  ];

  const filteredRiders = riders.filter(rider => {
    // Enforce partner business status == Open
    const riderPartnerId = (rider as any).data?.partner_id;
    if (riderPartnerId && partners && partners.length > 0) {
      const matched = partners.find(p => p.partner_id === riderPartnerId);
      if (matched && matched.business_status !== 'Open') {
        return false;
      }
    }
    // Apply user filters
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'manager_mis_ids') {
        const raw = [ (rider as any).data?.manager_mis_ids, (rider as any).data?.manager_id, (rider as any).data?.manager ]
          .map(v => String(v || '').trim())
          .filter(Boolean)
          .join(',');
        const list = raw.split(/[,|]/).map(s => s.trim());
        return list.includes(String(value));
      }
      return (rider as any)[key] === value;
    });
  });

  const columns = [
    {
      key: 'rider_id',
      label: 'Rider ID',
      sortable: true,
    },
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (value: string, row: Rider) => (
        <div>
          <p className="font-medium text-gray-900">{row.first_name} {row.last_name}</p>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-600">{row.phone}</span>
            </div>
            {row.email && (
              <div className="flex items-center space-x-1">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-600">{row.email}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'identity_card_number',
      label: 'Identity Card',
      sortable: true,
      render: (_: string, row: Rider) => (
        <span className="text-sm font-mono">{(row as any).data?.identity_card_number || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'audit_pass' ? 'bg-green-100 text-green-800' :
          value === 'on_job' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'three_pl_status',
      label: '3PL Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'vehicle_type',
      label: 'Vehicle',
      sortable: true,
      render: (value: string) => (
        <span className="capitalize">{value}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Added',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
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
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <p className="text-gray-600 mt-1">Manage rider information and status</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rider</span>
        </button>
      </div>

      <div className="mb-4">
        <FilterPanel
          filters={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          data={filteredRiders}
          filename="riders"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRiders}
        isLoading={loading}
        searchable
        pagination
        pageSize={20}
      />

      <AddRiderForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={fetchRiders}
      />
    </div>
  );
}