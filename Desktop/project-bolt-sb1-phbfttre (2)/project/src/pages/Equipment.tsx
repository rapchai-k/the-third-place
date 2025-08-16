import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterPanel } from '../components/common/FilterPanel';
import { AddEquipmentForm } from '../components/forms/AddEquipmentForm';
import { supabase, type EquipmentItem } from '../lib/supabase';
import { Plus, Package, DollarSign, Tag, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRiders } from '../hooks/useRiders';
import toast from 'react-hot-toast';

export function Equipment() {
  const { user } = useAuth();
  const { riders } = useRiders();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchEquipment();
  }, []);


  const fetchEquipment = async () => {
    try {

      const { data, error } = await supabase
        .from('equipment_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment items');
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'safety', label: 'Safety Equipment' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'accessories', label: 'Accessories' },
        { value: 'tools', label: 'Tools' },
        { value: 'general', label: 'General' },
      ],
    },
    {
      key: 'is_chargeable',
      label: 'Chargeable',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
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

  const filteredEquipment = equipment.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'is_chargeable' || key === 'is_active') {
        return item[key as keyof EquipmentItem].toString() === value;
      }
      return item[key as keyof EquipmentItem] === value;
    });
  });

  const columns = [
    {
      key: 'name',
      label: 'Equipment Name',
      sortable: true,
      render: (value: string, row: EquipmentItem) => (
        <div className="flex items-center space-x-3">
          <Package className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {row.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'sizes',
      label: 'Available Sizes',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((size, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
            >
              {size}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'current_price',
      label: 'Current Price',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-medium">${value.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'is_chargeable',
      label: 'Chargeable',
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value ? 'Yes' : 'Free'}
        </span>
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
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      label: 'Updated',
      sortable: true,
      render: (_value: string, row: EquipmentItem) => (
        <div className="text-xs text-gray-700">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          {((row as any).updated_by || (row as any).last_updated_by) && (
            <div className="text-gray-500">by {((row as any).updated_by || (row as any).last_updated_by)}</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-1">Manage equipment items, pricing, and availability</p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'equipment_person') && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        )}
      </div>

      <div className="mb-4">
        <FilterPanel
          filters={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          data={filteredEquipment}
          filename="equipment_items"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredEquipment}
        searchable
        pagination
        pageSize={20}
      />

      <AddEquipmentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchEquipment}
      />
    </div>
  );
}