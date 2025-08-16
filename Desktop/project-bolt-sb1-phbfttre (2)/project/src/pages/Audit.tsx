import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { supabase, type AuditLog } from '../lib/supabase';
import { FileText, User, Calendar, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export function Audit() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('INSERT')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('UPDATE') || action.includes('MODIFY')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">{new Date(value).toLocaleDateString()}</p>
            <p className="text-xs text-gray-600">{new Date(value).toLocaleTimeString()}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'user_id',
      label: 'User',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {row.users?.first_name} {row.users?.last_name}
            </p>
            <p className="text-xs text-gray-600">{row.users?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'resource_type',
      label: 'Resource',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm capitalize">{value.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'resource_id',
      label: 'Resource ID',
      render: (value: string) => (
        <span className="text-sm font-mono text-gray-600">{value}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-1">Track all system changes and user activities</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          <span>Last 1000 entries</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={auditLogs}
        searchable
        pagination
        pageSize={50}
      />
    </div>
  );
}