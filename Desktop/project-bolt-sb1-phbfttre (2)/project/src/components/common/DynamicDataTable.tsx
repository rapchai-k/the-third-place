import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Loader2 } from 'lucide-react';
import type { ProjectSchema, ProjectData } from '../../lib/supabase';

interface DynamicDataTableProps {
  data: ProjectData[];
  schemas: ProjectSchema[];
  totalCount?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export function DynamicDataTable({
  data,
  schemas,
  totalCount,
  hasMore = false,
  onLoadMore,
  searchable = true,
  pagination = true,
  pageSize = 20,
}: DynamicDataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = useMemo(() => {
    return schemas
      .sort((a, b) => (a.column_order || 0) - (b.column_order || 0)) // Maintain file order
      .map(schema => ({
      key: schema.column_name,
      label: schema.display_name || schema.column_name,
      sortable: true,
      render: (value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
    }));
  }, [schemas]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const searchFilteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => {
      return Object.values(item.data).some(value =>
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return searchFilteredData;
    
    return [...searchFilteredData].sort((a, b) => {
      const aValue = a.data[sortColumn];
      const bValue = b.data[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchFilteredData, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination ? sortedData.slice(startIndex, startIndex + pageSize) : sortedData;

  const handleLoadMore = async () => {
    if (onLoadMore && hasMore && !loadingMore) {
      setLoadingMore(true);
      await onLoadMore();
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Data summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {paginatedData.length} of {sortedData.length} records
          {totalCount && totalCount > data.length && (
            <span> (loaded {data.length} of {totalCount} total)</span>
          )}
        </span>
        {hasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortColumn === column.key && sortDirection === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 -mt-1 ${
                              sortColumn === column.key && sortDirection === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, rowIndex) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render(item.data[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No matching records found' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + pageSize, sortedData.length)}
                  </span>{' '}
                  of <span className="font-medium">{sortedData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}