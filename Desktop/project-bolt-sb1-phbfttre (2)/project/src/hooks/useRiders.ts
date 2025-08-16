import { useState, useEffect } from 'react';
import { supabase, type Rider, type UploadHistory, type RiderUpdate } from '../lib/supabase';
import { applyEligibilityLogic } from '../utils/eligibilityLogic';
import { useGlobalProgressBar } from '../App';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';

export function useRiders() {
  const progressBar = useGlobalProgressBar();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { user } = useAuth();

  const fetchRiders = async () => {
    setLoading(true);
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('❌ Supabase client not available - check your .env configuration');
        toast.error('Database connection not configured. Please check your Supabase settings.');
        setRiders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Add network connectivity check
      try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(`Supabase connection failed: ${response.status}`);
        }
      } catch (networkError: any) {
        console.error('❌ Network connectivity check failed:', networkError);
        if (networkError?.message?.includes('Failed to fetch')) {
          toast.error('Network connection failed. Please check your internet connection.');
        } else {
          toast.error('Cannot connect to database. Please check your Supabase configuration.');
        }
        setRiders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching ALL riders from database using pagination...');
      
      // Show immediate feedback that loading has started
      setLoading(true);
      
      // First get the total count from database to verify we get everything
      let totalDbCount, countError;
      try {
        const result = await supabase
          .from('riders')
          .select('*', { count: 'exact', head: true });
        totalDbCount = result.count;
        countError = result.error;
      } catch (fetchError) {
        console.error('❌ Network error during count fetch:', fetchError);
        toast.error('Network error: Cannot connect to database. Please check your internet connection.');
        setRiders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      if (countError) {
        console.error('❌ Error getting rider count:', countError);
        if (countError.message?.includes('Failed to fetch')) {
          toast.error('Unable to connect to database. Please check your internet connection and Supabase configuration.');
        } else {
          toast.error('Failed to load rider count: ' + countError.message);
        }
        setRiders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      console.log(`📊 VERIFICATION: Total riders in database: ${totalDbCount}`);
      setTotalCount(totalDbCount || 0);

      // Fetch ALL riders using client-side pagination to overcome Supabase 1000 limit
      const allRidersData = [];
      const pageSize = 1000; // Supabase's max per request
      let currentPage = 0;
      let hasMore = true;
      
      while (hasMore) {
        const startRange = currentPage * pageSize;
        const endRange = startRange + pageSize - 1;
        
        console.log(`📦 Fetching page ${currentPage + 1}: records ${startRange} to ${endRange}`);
        
        let pageData, error;
        try {
          const result = await supabase
            .from('riders')
            .select('*')
            .order('updated_at', { ascending: false })
            .range(startRange, endRange);
          pageData = result.data;
          error = result.error;
        } catch (fetchError: any) {
          console.error(`❌ Network error fetching page ${currentPage + 1}:`, fetchError);
          if (fetchError?.message?.includes('Failed to fetch')) {
            toast.error('Network connection lost. Please refresh the page and try again.');
          } else {
            toast.error('Error loading riders. Please try again.');
          }
          setRiders([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        if (error) {
          console.error(`❌ Error fetching page ${currentPage + 1}:`, error);
          if (error.message?.includes('Failed to fetch')) {
            toast.error('Network error while loading riders. Please check your connection.');
          } else {
            toast.error('Failed to load riders: ' + error.message);
          }
          setRiders([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
        
        if (pageData && pageData.length > 0) {
          allRidersData.push(...pageData);
          console.log(`✅ Fetched ${pageData.length} riders. Total so far: ${allRidersData.length}`);
          
          // Check if we got less than pageSize, meaning we're done
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
        
        // Add small delay between pages to prevent overwhelming the connection
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      const actualCount = allRidersData.length;
      console.log(`✅ VERIFICATION: Fetched ${actualCount} riders from database`);
      console.log(`🔍 VERIFICATION: Database count: ${totalDbCount}, Fetched count: ${actualCount}`);
      
      if (actualCount !== totalDbCount) {
        console.error(`🚨 MISMATCH: Expected ${totalDbCount} riders but got ${actualCount}!`);
        console.error('🚨 This indicates pagination may need adjustment!');
      } else {
        console.log(`✅ SUCCESS: All ${actualCount} riders loaded successfully`);
      }
      
      setRiders(allRidersData);
      
      generateDynamicOptions(allRidersData);
      
    } catch (error) {
      console.error('Error fetching riders:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network connection failed. Please check your internet connection and try again.');
      } else {
        toast.error('Failed to load riders: ' + (error as Error).message);
      }
      setRiders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };


  const generateDynamicOptions = (ridersData: Rider[]) => {
    const options: Record<string, Set<string>> = {
      nationality_code: new Set(),
      delivery_type: new Set(),
      audit_status: new Set(),
      job_status: new Set(),
    };

    ridersData.forEach(rider => {
      Object.keys(options).forEach(key => {
        const value = rider.data[key];
        if (value && String(value).trim()) {
          options[key].add(String(value).trim());
        }
      });
    });

    const dynamicOpts: Record<string, { value: string; label: string }[]> = {};
    Object.keys(options).forEach(key => {
      dynamicOpts[key] = Array.from(options[key]).sort().map(value => ({
        value,
        label: value
      }));
    });

    setDynamicOptions(dynamicOpts);
  };

  const updateRider = async (riderId: string, field: string, newValue: any, additionalData?: Record<string, any>): Promise<boolean> => {
    try {
      console.log('🔄 Starting updateRider:', { riderId, field, newValue, additionalData });
      
      // Find the rider
      const rider = riders.find(r => r.rider_id === riderId);
      if (!rider) {
        console.error('❌ Rider not found:', riderId);
        toast.error('Rider not found');
        return false;
      }

      console.log('📋 Current rider data:', rider.data);
      
      // Update the data
      const updatedData = { 
        ...rider.data, 
        [field]: newValue,
        ...(additionalData || {}),
        last_updated_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
        last_updated_at: new Date().toISOString()
      };
      console.log('📝 Updated data before eligibility:', updatedData);
      
      // ALWAYS apply eligibility logic when updating these critical fields (including job_status resignation handling)
      console.log('🎯 Checking if field affects eligibility:', field);
      let eligibilityUpdates: Record<string, any> = {};
      if (['delivery_type', 'audit_status', 'job_status', 'box_installation', 'training_status', 'equipment_status'].includes(field)) {
        console.log('🎯 ✅ Field affects eligibility, applying logic...');
        console.log('🔍 Data being checked:', {
          delivery_type: (updatedData as any).delivery_type,
          audit_status: (updatedData as any).audit_status,
          job_status: (updatedData as any).job_status,
          box_installation: (updatedData as any).box_installation,
          training_status: (updatedData as any).training_status,
          equipment_status: (updatedData as any).equipment_status
        });
        
        // Special handling for status field updates
        if (field === 'box_installation' || field === 'training_status' || field === 'equipment_status') {
          console.log('🎯 📦 Box installation field updated, checking if we should apply eligibility logic...');
          
          // Only apply eligibility logic if the new value is not Completed or Scheduled for status fields
          // This prevents overriding manual status changes
          if (newValue !== 'Completed' && newValue !== 'Scheduled') {
            eligibilityUpdates = applyEligibilityLogic(updatedData);
            console.log('🎯 Eligibility updates calculated:', eligibilityUpdates);
          } else {
            console.log('🎯 📦 Preserving manual status:', newValue);
            // Still check downstream eligibilities since completion affects other processes
            const downstreamEligibilityCheck: Record<string, any> = applyEligibilityLogic(updatedData);
            
            // Only apply downstream updates, not the field being manually changed
            if (field === 'training_status' && downstreamEligibilityCheck.equipment_status) {
              eligibilityUpdates.equipment_status = downstreamEligibilityCheck.equipment_status;
              console.log('🎯 📋 Training completed - updating equipment eligibility:', downstreamEligibilityCheck.equipment_status);
            }
            if (field === 'box_installation' && downstreamEligibilityCheck.training_status) {
              eligibilityUpdates.training_status = downstreamEligibilityCheck.training_status;
              console.log('🎯 🎓 Box installation completed - updating training eligibility:', downstreamEligibilityCheck.training_status);
            }
          }
        } else {
          // Apply eligibility logic for other fields
          eligibilityUpdates = applyEligibilityLogic(updatedData);
          console.log('🎯 Eligibility updates calculated:', eligibilityUpdates);
        }
      } else {
        console.log('🎯 ❌ Field does not affect eligibility:', field);
      }
      
      Object.assign(updatedData, eligibilityUpdates);
      console.log('📝 Final updated data:', updatedData);

      // SPECIAL: If rider resigned, clear scheduled fields that eligibility flagged
      if ((updatedData as any).job_status === 'Resign' || (updatedData as any).job_status === 'Resigned') {
        Object.assign(updatedData, eligibilityUpdates);
      }

      // Update in database
      const { error } = await supabase
        .from('riders')
        .update({ 
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('rider_id', riderId);

      if (error) throw error;
      console.log('✅ Database updated successfully');

      // Update local state immediately for better UX
      setRiders(prevRiders => 
        prevRiders.map(r => 
          r.rider_id === riderId 
            ? { ...r, data: updatedData, updated_at: new Date().toISOString() }
            : r
        )
      );
      console.log('✅ Local state updated');

      // Show detailed success message with all eligibility updates
      const eligibilityMessages: string[] = [];
      if ((eligibilityUpdates as any).training_status) {
        eligibilityMessages.push(`Training status updated to ${eligibilityUpdates.training_status}`);
      }
      if ((eligibilityUpdates as any).box_installation) {
        eligibilityMessages.push(`Box installation updated to ${eligibilityUpdates.box_installation}`);
      }
      if ((eligibilityUpdates as any).equipment_status) {
        eligibilityMessages.push(`Equipment status updated to ${eligibilityUpdates.equipment_status}`);
      }
      
      if (eligibilityMessages.length > 0) {
        toast.success(`✅ ${field} updated! Eligibility recalculated: ${eligibilityMessages.join(', ')}`, { duration: 5000 });
      } else {
        toast.success(`✅ ${field} updated successfully!`);
      }

      console.log('🎉 Update process completed successfully');
      
      return true;
    } catch (error: any) {
      console.error('❌ Error updating rider:', error);
      toast.error(error.message || 'Failed to update rider');
      return false;
    }
  };


  const applyBulkEligibilityLogicInternal = async (ridersData: Rider[]) => {
    console.log('=== BULK ELIGIBILITY CHECK STARTING ===');
    console.log(`🔍 VERIFICATION: Processing ${ridersData?.length || 0} riders for eligibility`);
    
    // Explicit verification
    if (ridersData.length < 5000) {
      console.warn(`⚠️ ELIGIBILITY WARNING: Only processing ${ridersData.length} riders, expected 5000+`);
    }
    
    progressBar.showProgress('Applying eligibility logic...', `Processing ALL ${ridersData?.length || 0} riders from database`);
    
    if (!ridersData || ridersData.length === 0) {
      console.log('No riders to process');
      progressBar.hideProgress();
      return;
    }
    
    let updatedCount = 0;
    const batchSize = 200; // Optimized batch size for 5000+ records
    const concurrencyLimit = 10; // Process 10 batches concurrently for better performance
    
    // Create batches
    const batches = [];
    for (let i = 0; i < ridersData.length; i += batchSize) {
      const batch = ridersData.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    console.log(`📊 Created ${batches.length} batches of ${batchSize} records each for ${ridersData.length} total riders`);
    
    // Process batches with controlled concurrency
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const concurrentBatches = batches.slice(i, i + concurrencyLimit);
      
      // Update progress (0% to 90%)
      const progress = (i / batches.length) * 90;
      const processedBatches = Math.floor(i / concurrencyLimit) + 1;
      const totalBatchGroups = Math.ceil(batches.length / concurrencyLimit);
      
      progressBar.updateProgress(
        progress,
        'processing',
        `Applying eligibility logic to ALL ${ridersData.length} riders...`,
        `Batch group ${processedBatches}/${totalBatchGroups} (${batches.length} total batches) - Updated ${updatedCount} riders so far`
      );
      
      const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
        const actualBatchIndex = i + batchIndex;
        console.log(`📦 Processing batch ${actualBatchIndex + 1}/${batches.length} (${batch.length} riders) - Total processed: ${actualBatchIndex * batchSize}/${ridersData.length}`);
        
        let batchUpdatedCount = 0;
        
        for (const rider of batch) {
          const eligibilityUpdates = applyEligibilityLogic(rider.data);
          
          const needsUpdate = Object.keys(eligibilityUpdates).length > 0;
          
          // Update database if needed
          if (needsUpdate) {
            const updatedData = { ...rider.data, ...eligibilityUpdates };
            
            try {
              const { error } = await supabase
                .from('riders')
                .update({ 
                  data: updatedData,
                  updated_at: new Date().toISOString()
                })
                .eq('rider_id', rider.rider_id);
              
              if (error) {
                console.error('Error updating rider', rider.rider_id, error);
              } else {
                batchUpdatedCount++;
              }
            } catch (error) {
              console.error('Error updating rider:', error);
            }
          }
        }
        
        return batchUpdatedCount;
      });
      
      // Wait for concurrent batches to complete
      const batchResults = await Promise.all(batchPromises);
      const batchTotal = batchResults.reduce((sum, count) => sum + count, 0);
      updatedCount += batchTotal;
      
      const completedBatches = Math.min(i + concurrencyLimit, batches.length);
      console.log(`✅ Completed ${completedBatches}/${batches.length} batches (${completedBatches * batchSize}/${ridersData.length} riders). Updated: ${batchTotal} riders in this group. Total updated: ${updatedCount}`);
      
      // Small delay between batch groups
      if (i + concurrencyLimit < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Increased delay to prevent network issues
      }
    }
    
    console.log(`🎉 ELIGIBILITY PROCESSING COMPLETED: Updated ${updatedCount} riders out of ${ridersData.length} total riders`);
    
    if (updatedCount > 0) {
      progressBar.completeProgress(
        `Eligibility logic applied to ALL ${ridersData.length} riders!`,
        `Successfully updated ${updatedCount} riders with new eligibility status`
      );
      toast.success(`✅ Applied eligibility logic to ALL ${ridersData.length} riders! Updated ${updatedCount} riders with new status.`);
      // Refresh the data to show updates
      return await fetchRiders();
    } else {
      console.log(`ℹ️ All ${ridersData.length} riders already have correct eligibility status`);
      progressBar.completeProgress(
        `Eligibility check completed for ALL ${ridersData.length} riders!`,
        `All riders already have correct eligibility status - no updates needed`
      );
      toast.success(`✅ All ${ridersData.length} riders already have correct eligibility status!`);
      return Promise.resolve();
    }
    
    console.log('=== BULK ELIGIBILITY CHECK COMPLETED ===');
  };

  const applyBulkEligibilityLogic = async () => {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        console.error('❌ Supabase client not available for eligibility logic');
        progressBar.errorProgress('Database not configured', 'Please check your Supabase settings');
        toast.error('Database connection not configured. Cannot apply eligibility logic.');
        return Promise.resolve();
      }

      console.log('🔄 ELIGIBILITY: Fetching ALL riders using pagination for eligibility processing...');
      
      // Get total count first
      const { count: totalDbCount, error: countError } = await supabase
        .from('riders')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Error getting rider count for eligibility:', countError);
        if (countError.message?.includes('Failed to fetch')) {
          progressBar.errorProgress('Network connection failed', 'Unable to connect to database for eligibility processing');
          toast.error('Network error: Cannot connect to database for eligibility processing');
        } else {
          progressBar.errorProgress('Failed to get rider count', 'Could not count riders in database');
          toast.error('Failed to get rider count for eligibility processing: ' + countError.message);
        }
        return Promise.resolve();
      }
      
      console.log(`📊 ELIGIBILITY: Total riders to process: ${totalDbCount}`);
      
      // Fetch ALL riders using client-side pagination
      const allRidersFromDB = [];
      const pageSize = 1000;
      let currentPage = 0;
      let hasMore = true;
      
      while (hasMore) {
        const startRange = currentPage * pageSize;
        const endRange = startRange + pageSize - 1;
        
        console.log(`📦 ELIGIBILITY: Fetching page ${currentPage + 1}: records ${startRange} to ${endRange}`);
        
        const { data: pageData, error } = await supabase
          .from('riders')
          .select('*')
          .order('updated_at', { ascending: false })
          .range(startRange, endRange);

        if (error) {
          console.error('❌ Error fetching riders page for eligibility:', error);
          if (error.message?.includes('Failed to fetch')) {
            progressBar.errorProgress('Network connection failed', 'Unable to connect to database');
            toast.error('Network error: Cannot fetch riders for eligibility processing');
          } else {
            progressBar.errorProgress('Failed to fetch riders', 'Could not load rider data from database');
            toast.error('Failed to fetch riders for eligibility processing: ' + error.message);
          }
          return Promise.resolve();
        }
        
        if (pageData && pageData.length > 0) {
          allRidersFromDB.push(...pageData);
          console.log(`✅ ELIGIBILITY: Fetched ${pageData.length} riders. Total so far: ${allRidersFromDB.length}`);
          
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          hasMore = false;
        }
      }

      const ridersToProcess = allRidersFromDB;
      console.log(`📊 ELIGIBILITY VERIFICATION: Fetched ${ridersToProcess.length} riders from database`);
      
      // Verify we have the full dataset
      if (ridersToProcess.length !== totalDbCount) {
        console.warn(`⚠️ ELIGIBILITY WARNING: Fetched ${ridersToProcess.length} riders, expected ${totalDbCount}`);
      } else {
        console.log(`✅ ELIGIBILITY SUCCESS: Processing complete dataset of ${ridersToProcess.length} riders`);
      }

      if (ridersToProcess && ridersToProcess.length > 0) {
        console.log(`🎯 ELIGIBILITY: Processing eligibility logic for ALL ${ridersToProcess.length} riders`);
        return await applyBulkEligibilityLogicInternal(ridersToProcess);
      } else {
        console.log('No riders found to process');
        toast('No riders found to process');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error in applyBulkEligibilityLogic:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        progressBar.errorProgress('Network connection failed', 'Unable to connect to database');
        toast.error('Network error: Cannot apply eligibility logic. Please check your connection.');
      } else {
        progressBar.errorProgress('Failed to apply eligibility logic', 'An error occurred while processing riders');
        toast.error('Failed to apply eligibility logic: ' + (error as Error).message);
      }
      return Promise.resolve();
    }
  };

  const searchRiders = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .or(`rider_id.ilike.%${searchTerm}%,data->>rider_name.ilike.%${searchTerm}%,data->>phone.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRiders(data || []);
      generateDynamicOptions(data || []);
    } catch (error) {
      console.error('Error searching riders:', error);
      toast.error('Failed to search riders');
    } finally {
      setLoading(false);
    }
  };

  const getRiderById = async (riderId: string): Promise<Rider | null> => {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('rider_id', riderId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching rider:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  return {
    riders,
    loading,
    totalCount,
    dynamicOptions,
    fetchRiders,
    searchRiders,
    getRiderById,
    updateRider,
    refreshRiders: fetchRiders,
    applyBulkEligibilityLogic
  };
}

export function useUploadHistory() {
  const [uploads, setUploads] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUploadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('upload_history')
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
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      toast.error('Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const getUploadDetails = async (uploadId: string): Promise<RiderUpdate[]> => {
    try {
      const { data, error } = await supabase
        .from('rider_updates')
        .select('*')
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upload details:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  return {
    uploads,
    loading,
    fetchUploadHistory,
    getUploadDetails,
    refreshHistory: fetchUploadHistory
  };
}