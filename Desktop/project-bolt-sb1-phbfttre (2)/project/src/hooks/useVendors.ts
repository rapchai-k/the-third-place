import { useState, useEffect } from 'react';
import { supabase, type Vendor } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error('❌ Supabase client not available for vendors');
        toast.error('Database connection not configured');
        setVendors([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('vendor_name');

      if (error) {
        console.error('❌ Error fetching vendors:', error);
        if (error.message?.includes('Failed to fetch')) {
          toast.error('Network error: Cannot connect to database for vendors');
        } else {
          toast.error('Failed to load vendors: ' + error.message);
        }
        setVendors([]);
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} active vendors`);
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error: Cannot fetch vendors. Please check your connection.');
      } else {
        toast.error('Failed to load vendors: ' + (error as Error).message);
      }
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('vendors')
        .insert([vendorData]);

      if (error) {
        console.error('Error adding vendor:', error);
        toast.error('Failed to add vendor: ' + error.message);
        return false;
      }

      toast.success('Vendor added successfully');
      await fetchVendors(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor: ' + (error as Error).message);
      return false;
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating vendor:', error);
        toast.error('Failed to update vendor: ' + error.message);
        return false;
      }

      toast.success('Vendor updated successfully');
      await fetchVendors(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor: ' + (error as Error).message);
      return false;
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vendor:', error);
        toast.error('Failed to delete vendor: ' + error.message);
        return false;
      }

      toast.success('Vendor deleted successfully');
      await fetchVendors(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor: ' + (error as Error).message);
      return false;
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return {
    vendors,
    loading,
    fetchVendors,
    addVendor,
    updateVendor,
    deleteVendor,
    refreshVendors: fetchVendors
  };
}