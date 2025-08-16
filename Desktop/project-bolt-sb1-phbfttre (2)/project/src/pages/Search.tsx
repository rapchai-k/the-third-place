import React, { useState } from 'react';
import { supabase, type Rider } from '../lib/supabase';
import { Search as SearchIcon, Phone, Mail, User, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 SEARCH VERIFICATION: Searching in database for: "${searchTerm}"`);
      
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .or(`rider_id.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10000); // Ensure no default limits

      if (error) throw error;
      
      console.log(`🔍 SEARCH VERIFICATION: Found ${data?.length || 0} matching riders`);
      setSearchResults(data || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching riders:', error);
      toast.error('Failed to search riders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'audit_pass':
        return 'bg-green-100 text-green-800';
      case 'on_job':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Search Riders</h1>
        <p className="text-gray-600 mt-2">
          Search for riders by Rider ID, phone number, or name
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Rider ID, phone number, or name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h2>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No riders found</h3>
              <p className="text-gray-600">
                Try searching with a different Rider ID, phone number, or name.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((rider) => (
                <div key={rider.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {rider.first_name} {rider.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {rider.rider_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(rider.status)}`}>
                        {rider.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{rider.phone}</span>
                    </div>
                    {rider.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{rider.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 capitalize">{rider.vehicle_type}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rider.three_pl_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        3PL: {rider.three_pl_status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Added: {new Date(rider.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}