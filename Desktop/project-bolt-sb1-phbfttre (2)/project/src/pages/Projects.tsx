import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/common/DataTable';
import { supabase, type Project } from '../lib/supabase';
import { Plus, FolderOpen, Calendar, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/upload');
  };

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            {row.description && (
              <p className="text-sm text-gray-600">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'created_by',
      label: 'Created By',
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage projects and their associated data</p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <button 
            onClick={handleCreateProject}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Rider Data</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchable
        pagination
        pageSize={20}
      />
    </div>
  );
}