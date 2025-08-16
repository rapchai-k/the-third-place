import { useState, useEffect } from 'react';
import { supabase, type Partner } from '../lib/supabase';
import toast from 'react-hot-toast';

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error('❌ Supabase client not available for partners');
        toast.error('Database connection not configured');
        setPartners([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Error fetching partners:', error);
        if (error.message?.includes('Failed to fetch')) {
          toast.error('Network error: Cannot connect to database for partners');
        } else {
          toast.error('Failed to load partners: ' + error.message);
        }
        setPartners([]);
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} active partners`);
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error: Cannot fetch partners. Please check your connection.');
      } else {
        toast.error('Failed to load partners: ' + (error as Error).message);
      }
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async (partnerData: Omit<Partner, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('partners')
        .insert([partnerData]);

      if (error) {
        console.error('Error adding partner:', error);
        toast.error('Failed to add partner: ' + error.message);
        return false;
      }

      toast.success('Partner added successfully');
      await fetchPartners(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error adding partner:', error);
      toast.error('Failed to add partner: ' + (error as Error).message);
      return false;
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating partner:', error);
        toast.error('Failed to update partner: ' + error.message);
        return false;
      }

      toast.success('Partner updated successfully');
      await fetchPartners(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Failed to update partner: ' + (error as Error).message);
      return false;
    }
  };

  const deletePartner = async (id: string) => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured');
        return false;
      }

      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting partner:', error);
        toast.error('Failed to delete partner: ' + error.message);
        return false;
      }

      toast.success('Partner deleted successfully');
      await fetchPartners(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner: ' + (error as Error).message);
      return false;
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    loading,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
    refreshPartners: fetchPartners
  };
}

export function usePartnerCapacity() {
  const checkPartnerCapacity = async (partnerId: string, deliveryType: string, additionalCount: number = 1) => {
    try {
      console.log('🔍 ===== CAPACITY CHECK START =====');
      console.log('🔍 INPUT:', { partnerId, deliveryType, additionalCount });
      
      // STEP 1: Find the partner
      console.log('🔍 STEP 1: Finding partner...');
      const { data: foundPartner, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();
      
      if (partnerError) {
        console.error('❌ STEP 1 ERROR:', partnerError);
        return {
          success: false,
          can_schedule: false,
          error: 'Database error finding partner',
          partner_name: 'Unknown Partner'
        };
      }

      if (!foundPartner) {
        console.error('❌ STEP 1 FAILED - Partner not found:', partnerId);
        return {
          success: false,
          can_schedule: false,
          error: 'Partner not found',
          partner_name: 'Unknown Partner'
        };
      }

      console.log('✅ STEP 1 SUCCESS - Partner found:', {
        partner_id: foundPartner.partner_id,
        name: foundPartner.partner_name || foundPartner.name,
        car_target: foundPartner.car_target,
        bike_target: foundPartner.bike_target,
        total_target: foundPartner.total_target
      });

      // STEP 2: Get ALL riders
      console.log('🔍 STEP 2: Fetching ALL riders...');
      const { data: allRiders, error: ridersError } = await supabase
        .from('riders')
        .select('*');

      if (ridersError) {
        console.error('❌ STEP 2 ERROR:', ridersError);
        return {
          success: false,
          can_schedule: false,
          error: 'Failed to fetch riders',
          partner_name: foundPartner.partner_name || foundPartner.name
        };
      }

      console.log(`✅ STEP 2 SUCCESS - Fetched ${allRiders?.length || 0} riders`);

      // STEP 3: Filter riders for this partner
      console.log('🔍 STEP 3: Filtering riders for partner...');
      const partnersRiders = (allRiders || []).filter(rider => {
        const riderPartnerId = rider.data.partner_id;
        const riderPartnerName = rider.data.partner_company_name_en || rider.data.partner_name;
        
        const matchById = riderPartnerId === foundPartner.partner_id;
        const matchByName = riderPartnerName === (foundPartner.partner_company_name_en || foundPartner.name);
        
        return matchById || matchByName;
      });

      console.log(`✅ STEP 3 SUCCESS - Found ${partnersRiders.length} riders for partner`);

      // STEP 4: Filter for active riders (Scheduled or Completed in ANY workflow)
      console.log('🔍 STEP 4: Filtering for active riders...');
      const activeRiders = partnersRiders.filter(rider => {
        const data = rider.data;
        const trainingStatus = data.training_status;
        const installationStatus = data.box_installation;
        const equipmentStatus = data.equipment_status;
        
        const isActive = 
          (trainingStatus === 'Scheduled' || trainingStatus === 'Completed') ||
          (installationStatus === 'Scheduled' || installationStatus === 'Completed') ||
          (equipmentStatus === 'Scheduled' || equipmentStatus === 'Completed');
        
        return isActive;
      });

      console.log(`✅ STEP 4 SUCCESS - Found ${activeRiders.length} active riders`);

      // STEP 5: Count by delivery type
      console.log('🔍 STEP 5: Counting by delivery type...');
      const carRidersForPartner = activeRiders.filter(r => r.data.delivery_type === 'Car');
      const bikeRidersForPartner = activeRiders.filter(r => r.data.delivery_type === 'Motorcycle');

      const currentCarCount = carRidersForPartner.length;
      const currentBikeCount = bikeRidersForPartner.length;
      const currentTotalCount = activeRiders.length;

      console.log('✅ STEP 5 SUCCESS - Counts:', {
        car: currentCarCount,
        bike: currentBikeCount,
        total: currentTotalCount
      });

      // STEP 6: Check capacity limits
      console.log('🔍 STEP 6: Checking capacity limits...');
      const carTarget = foundPartner.car_target || 50;
      const bikeTarget = foundPartner.bike_target || 50;
      const totalTarget = foundPartner.total_target || 100;

      let canSchedule = true;
      let errorMessage = '';

      if (deliveryType === 'Car') {
        const newCarCount = currentCarCount + additionalCount;
        if (newCarCount > carTarget) {
          canSchedule = false;
          errorMessage = `Car capacity exceeded: Currently ${currentCarCount}/${carTarget} active riders. Adding ${additionalCount} would exceed limit (${newCarCount}/${carTarget})`;
          console.log('❌ STEP 6 - CAR CAPACITY EXCEEDED');
        } else {
          console.log('✅ STEP 6 - CAR CAPACITY OK');
        }
      } else if (deliveryType === 'Motorcycle') {
        const newBikeCount = currentBikeCount + additionalCount;
        if (newBikeCount > bikeTarget) {
          canSchedule = false;
          errorMessage = `Motorcycle capacity exceeded: Currently ${currentBikeCount}/${bikeTarget} active riders. Adding ${additionalCount} would exceed limit (${newBikeCount}/${bikeTarget})`;
          console.log('❌ STEP 6 - BIKE CAPACITY EXCEEDED');
        } else {
          console.log('✅ STEP 6 - BIKE CAPACITY OK');
        }
      }

      // Check total capacity
      const newTotalCount = currentTotalCount + additionalCount;
      if (newTotalCount > totalTarget) {
        canSchedule = false;
        errorMessage = `Total capacity exceeded: Currently ${currentTotalCount}/${totalTarget} active riders. Adding ${additionalCount} would exceed limit (${newTotalCount}/${totalTarget})`;
        console.log('❌ STEP 6 - TOTAL CAPACITY EXCEEDED');
      }

      console.log('🎯 FINAL RESULT:', {
        partner_name: foundPartner.partner_name || foundPartner.name,
        can_schedule: canSchedule,
        error: errorMessage,
        current_counts: { car: currentCarCount, bike: currentBikeCount, total: currentTotalCount },
        targets: { car: carTarget, bike: bikeTarget, total: totalTarget }
      });

      console.log('🔍 ===== CAPACITY CHECK END =====');

      return {
        success: true,
        can_schedule: canSchedule,
        error: errorMessage,
        partner_name: foundPartner.partner_name || foundPartner.name,
        current_car_count: currentCarCount,
        current_bike_count: currentBikeCount,
        current_total_count: currentTotalCount,
        car_target: carTarget,
        bike_target: bikeTarget,
        total_target: totalTarget
      };

    } catch (error) {
      console.error('❌ CAPACITY CHECK FATAL ERROR:', error);
      return {
        success: false,
        can_schedule: false,
        error: 'Failed to check partner capacity',
        partner_name: 'Unknown Partner'
      };
    }
  };

  return {
    checkPartnerCapacity
  };
}