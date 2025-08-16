import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

interface Column {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  virtualScrolling?: boolean; // Add virtual scrolling for performance
  expandableRows?: boolean;
  onRowExpand?: (rowId: string) => void;
  expandedRowId?: string | null;
  isLoading?: boolean; // explicitly indicate loading state
}

export function DataTable({
  columns,
  data,
  searchable = true,
  filterable = false,
  pagination = true,
  pageSize = 50,
  virtualScrolling = false,
  expandableRows = false,
  onRowExpand,
  expandedRowId,
  isLoading = false,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Verification: Log data table data count
  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log(`🔍 DATATABLE VERIFICATION: Received ${data.length} records for display`);
      if (data.length < 5000) {
        console.warn(`⚠️ DATATABLE WARNING: Only ${data.length} records received, expected 5000+`);
      }
    }
  }, [data.length]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Verification: Log search/filter results
  React.useEffect(() => {
    console.log(`🔍 SEARCH VERIFICATION: ${filteredData.length} records after search from ${data.length} total`);
  }, [filteredData.length, data.length, searchTerm]);
  
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination ? sortedData.slice(startIndex, startIndex + pageSize) : sortedData;
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state when not loading and no data
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <p className="text-gray-600">No data found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {filterable && (
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          )}
        </div>
      )}

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
              {paginatedData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Expandable Row Content */}
                  {expandableRows && expandedRowId === (row.id || rowIndex.toString()) && row.expandedContent && (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 bg-gray-50">
                        {row.expandedContent}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  ))}
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