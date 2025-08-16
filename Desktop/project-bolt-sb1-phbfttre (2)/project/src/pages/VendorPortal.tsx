import { useState, useEffect } from 'react';
import { DataTable } from '../components/common/DataTable';
import { supabase } from '../lib/supabase';
import { Truck, Calendar, MapPin, Clock, CheckCircle, AlertCircle, LogOut, X, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePartners } from '../hooks/usePartners';
import toast from 'react-hot-toast';

interface VendorInstallation {
  id: string;
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  identity_card_number?: string;
  installation_date: string;
  installation_time: string;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  proof_image_url?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  originalRider: any;
  needsVendorAssignment?: boolean;
}

export function VendorPortal() {
  const { user, signOut } = useAuth();
  const { partners } = usePartners();
  const [vendor, setVendor] = useState<any>(null);
  const [installations, setInstallations] = useState<VendorInstallation[]>([]);
  const [allInstallations, setAllInstallations] = useState<VendorInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bikeNumber, setBikeNumber] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<{ url: string; rider: any } | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const getPartnerInfo = (riderData: any) => {
    const riderPartnerId: string | undefined = riderData?.partner_id || riderData?.equipment_partner_id;
    const riderPartnerName: string | undefined = riderData?.partner_company_name_en || riderData?.partner_name;

    if (partners && partners.length > 0) {
      // Try by partner_id first (including equipment_partner_id)
      if (riderPartnerId) {
        const matchById = partners.find(p => p.partner_id === riderPartnerId);
        if (matchById) {
          return {
            partner_id: matchById.partner_id || riderPartnerId,
            partner_name: (matchById as any).partner_name || (matchById as any).name || riderPartnerName || ''
          };
        }
      }
      // Try by name match if available
      if (riderPartnerName) {
        const normalizedName = String(riderPartnerName).trim().toLowerCase();
        const matchByName = partners.find(p => {
          const pname = ((p as any).partner_name || (p as any).name || '').toLowerCase();
          return pname === normalizedName;
        });
        if (matchByName) {
          return {
            partner_id: matchByName.partner_id || riderPartnerId || '',
            partner_name: (matchByName as any).partner_name || (matchByName as any).name || riderPartnerName || ''
          };
        }
      }
    }
    // Fallback to rider-provided fields
    return {
      partner_id: riderPartnerId || '',
      partner_name: riderPartnerName || ''
    };
  };

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      console.log('🔍 VENDOR PORTAL: Fetching vendor data for user:', user.email);
      
      // Get vendor information
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('vendor_email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (vendorError || !vendorData) {
        console.error('❌ Vendor not found or inactive:', { vendorError, vendorData });
        toast.error('Vendor account not found or inactive');
        await signOut();
        return;
      }

      console.log('✅ VENDOR PORTAL: Found vendor data:', {
        vendor_id: vendorData.vendor_id,
        vendor_name: vendorData.vendor_name,
        vendor_email: vendorData.vendor_email,
        is_active: vendorData.is_active,
        can_login: vendorData.can_login
      });
      
      setVendor(vendorData);
      
      // Fetch installations after vendor data is set
      await fetchVendorInstallations(vendorData.vendor_id);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor information');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorInstallations = async (vendorId: string) => {
    try {
      console.log('🔍 VENDOR PORTAL: Fetching installations for vendor_id:', vendorId);
      
      // Get vendor data from state or fetch it
      let currentVendor = vendor;
      if (!currentVendor) {
        console.log('🔄 VENDOR PORTAL: Vendor data not in state, fetching from database...');
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .maybeSingle();

        if (vendorError || !vendorData) {
          console.error('❌ Could not fetch vendor data for installations:', { vendorError, vendorData });
          setInstallations([]);
          return;
        }
        currentVendor = vendorData;
      }

      console.log('🔍 VENDOR PORTAL: Current vendor details:', {
        uuid: currentVendor.id,
        vendor_id: currentVendor.vendor_id,
        vendor_name: currentVendor.vendor_name,
        vendor_email: currentVendor.vendor_email
      });

      // Fetch riders for this vendor only (Scheduled/Completed). Paged to respect API limits
      console.log('🔍 VENDOR PORTAL: Fetching riders assigned to this vendor (scheduled/completed only)...');
      const pageSize = 1000;
      let currentPage = 0;
      let hasMore = true;
      const collected: any[] = [];

      while (hasMore) {
        const start = currentPage * pageSize;
        const end = start + pageSize - 1;

        let query = supabase
          .from('riders')
          .select('id,rider_id,data,created_at,updated_at')
          .in('data->>box_installation', ['Scheduled', 'Completed'])
          .order('updated_at', { ascending: false })
          .range(start, end);



        const orConditions = [
          `data->>installation_vendor_id.eq.${currentVendor.vendor_id}`,
          `data->>installation_vendor_id.eq.${currentVendor.id}`,
          `data->>installation_vendor_email.eq.${currentVendor.vendor_email}`,
        ].join(',');

        // @ts-ignore - supabase-js supports JSON path with or()
        query = query.or(orConditions);

        const { data: pageRows, error } = await query;
        if (error) {
          console.error('❌ Error fetching vendor riders page:', error);
          throw error;
        }

        if (pageRows && pageRows.length > 0) {
          collected.push(...pageRows);
          if (pageRows.length < pageSize) {
            hasMore = false;
          } else {
            currentPage += 1;
          }
        } else {
          hasMore = false;
        }
      }

      const allRiders = collected;
      console.log(`🔍 VENDOR PORTAL: Loaded ${allRiders.length} riders assigned to this vendor`);
      
      // ENHANCED DEBUG: Check what installation data exists
      console.log('🔍 CHECKING ALL RIDERS FOR ANY INSTALLATION DATA...');
      
      // Check for ANY installation-related fields
      const ridersWithAnyInstallationData = (allRiders || []).filter(rider => {
        const data = rider.data;
        const hasInstallationStatus = data.box_installation;
        const hasVendorId = data.installation_vendor_id;
        const hasVendorName = data.installation_vendor_name;
        const hasVendorEmail = data.installation_vendor_email;
        const hasScheduledDate = data.installation_scheduled_date;
        const hasLocation = data.installation_location;
        
        const hasAnyInstallationData = hasInstallationStatus || hasVendorId || hasVendorName || 
                                      hasVendorEmail || hasScheduledDate || hasLocation;
        
        if (hasAnyInstallationData) {
          console.log(`📦 RIDER ${rider.rider_id} HAS INSTALLATION DATA:`, {
            box_installation: data.box_installation,
            installation_vendor_id: data.installation_vendor_id,
            installation_vendor_name: data.installation_vendor_name,
            installation_vendor_email: data.installation_vendor_email,
            installation_scheduled_date: data.installation_scheduled_date,
            installation_location: data.installation_location
          });
        }
        
        return hasAnyInstallationData;
      });
      
      console.log(`🔍 RIDERS WITH ANY INSTALLATION DATA: ${ridersWithAnyInstallationData.length}`);
      
      // Now filter for scheduled/completed specifically
      const ridersWithInstallationData = ridersWithAnyInstallationData.filter(rider => 
        rider.data.box_installation === 'Scheduled' || 
        rider.data.box_installation === 'Completed'
      );
      
      // ALSO check for any installation-related fields
      const ridersWithAnyInstallationFields = (allRiders || []).filter(rider => 
        rider.data.installation_vendor_id || 
        rider.data.installation_vendor_name || 
        rider.data.installation_vendor_email ||
        rider.data.installation_scheduled_date ||
        rider.data.installation_location
      );
      
      console.log(`🔍 VENDOR PORTAL: Found ${ridersWithInstallationData.length} riders with installation data`);
      console.log(`🔍 VENDOR PORTAL: Found ${ridersWithAnyInstallationFields.length} riders with ANY installation fields`);
      
      // Show sample installation data
      if (ridersWithAnyInstallationFields.length > 0) {
        console.log('🔍 SAMPLE INSTALLATION DATA:', ridersWithAnyInstallationFields.slice(0, 3).map(rider => ({
          rider_id: rider.rider_id,
          box_installation: rider.data.box_installation,
          installation_vendor_id: rider.data.installation_vendor_id,
          installation_vendor_name: rider.data.installation_vendor_name,
          installation_vendor_email: rider.data.installation_vendor_email,
          installation_scheduled_date: rider.data.installation_scheduled_date,
          installation_location: rider.data.installation_location
        })));
      }
      
      // Show ALL unique vendor assignments in the database
      const allVendorAssignments = new Set();
      const allVendorNames = new Set();
      const allVendorEmails = new Set();
      
      ridersWithAnyInstallationFields.forEach(rider => {
        if (rider.data.installation_vendor_id) allVendorAssignments.add(rider.data.installation_vendor_id);
        if (rider.data.installation_vendor_name) allVendorNames.add(rider.data.installation_vendor_name);
        if (rider.data.installation_vendor_email) allVendorEmails.add(rider.data.installation_vendor_email);
        if (rider.data.installation_completed_by) allVendorNames.add(rider.data.installation_completed_by);
      });
      
      // ENHANCED: Also check for vendor assignments by email matching
      console.log('🔍 CHECKING FOR VENDOR EMAIL MATCHES...');
      const ridersByVendorEmail = (allRiders || []).filter(rider => {
        const data = rider.data;
        const vendorEmail = data.installation_vendor_email;
        const isMatch = vendorEmail === currentVendor.vendor_email;
        
        if (vendorEmail) {
          console.log(`📧 RIDER ${rider.rider_id} vendor email: "${vendorEmail}" vs current: "${currentVendor.vendor_email}" = ${isMatch}`);
        }
        
        return isMatch;
      });
      
      console.log(`📧 RIDERS MATCHING VENDOR EMAIL: ${ridersByVendorEmail.length}`);
      
      console.log('🔍 VENDOR PORTAL: ALL vendor assignments in database:', {
        all_vendor_ids: Array.from(allVendorAssignments),
        all_vendor_names: Array.from(allVendorNames),
        all_vendor_emails: Array.from(allVendorEmails),
        riders_by_email_match: ridersByVendorEmail.length,
        current_vendor_details: {
          uuid: currentVendor.id,
          vendor_id: currentVendor.vendor_id,
          vendor_name: currentVendor.vendor_name,
          vendor_email: currentVendor.vendor_email
        }
      });
      
      // Show sample installation data for debugging
      if (ridersWithInstallationData.length > 0) {
        console.log('🔍 VENDOR PORTAL: Sample installation data (first 3 riders):');
        ridersWithInstallationData.slice(0, 3).forEach((rider, index) => {
          console.log(`   ${index + 1}. Rider ${rider.rider_id}:`, {
            box_installation: rider.data.box_installation,
            installation_vendor_id: rider.data.installation_vendor_id,
            installation_vendor_name: rider.data.installation_vendor_name,
            installation_vendor_email: rider.data.installation_vendor_email,
            installation_scheduled_date: rider.data.installation_scheduled_date,
            installation_location: rider.data.installation_location,
            installation_completion_date: rider.data.installation_completion_date
          });
        });
      }
      
      // ENHANCED: Filter for installations assigned to this vendor
      const vendorInstallations = (allRiders || []).filter(rider => {
        const riderData = rider.data;
        const boxInstallationStatus = riderData.box_installation;
        
        // Check for scheduled or completed installations
        const hasInstallationStatus = boxInstallationStatus === 'Scheduled' || boxInstallationStatus === 'Completed';
        if (!hasInstallationStatus) return false;
        
        // Get vendor assignment data
        const assignedVendorId = riderData.installation_vendor_id;
        const assignedVendorName = riderData.installation_vendor_name;
        const assignedVendorEmail = riderData.installation_vendor_email;
        
        // Try multiple matching strategies
        const matchByVendorId = assignedVendorId === currentVendor.vendor_id || assignedVendorId === currentVendor.id;
        const matchByVendorName = assignedVendorName === currentVendor.vendor_name;
        const matchByVendorEmail = assignedVendorEmail === currentVendor.vendor_email;
        
        // If no vendor assignment, check if this vendor can claim it
        const hasNoVendorAssignment = !assignedVendorId && !assignedVendorName && !assignedVendorEmail;
        
        const isMatch = matchByVendorId || matchByVendorName || matchByVendorEmail || hasNoVendorAssignment;
        
        if (isMatch) {
          console.log(`✅ FOUND INSTALLATION for rider ${rider.rider_id}:`, {
            status: boxInstallationStatus,
            scheduled_date: riderData.installation_scheduled_date,
            scheduled_time: riderData.installation_scheduled_time,
            location: riderData.installation_location,
            vendor_assignment: {
              vendor_id: assignedVendorId,
              vendor_name: assignedVendorName,
              vendor_email: assignedVendorEmail
            },
            match_reason: matchByVendorId ? 'vendor_id' : 
                         matchByVendorName ? 'vendor_name' : 
                         matchByVendorEmail ? 'vendor_email' : 'unassigned'
          });
        }
        
        return isMatch;
      });
      
      console.log(`✅ VENDOR PORTAL: Found ${vendorInstallations.length} installations for vendor ${currentVendor.vendor_name} (${currentVendor.vendor_id})`);
      
      // If no installations found, show detailed analysis
      if (vendorInstallations.length === 0) {
        console.log('🚨 VENDOR PORTAL: NO INSTALLATIONS FOUND - DETAILED ANALYSIS:');
        console.log('   📊 Total riders in database:', allRiders?.length || 0);
        console.log('   📦 Riders with installation data:', ridersWithInstallationData.length);
        console.log('   🔍 Current vendor looking for:', {
          vendor_id: currentVendor.vendor_id,
          vendor_name: currentVendor.vendor_name,
          vendor_email: currentVendor.vendor_email
        });
        console.log('   📋 All vendor IDs in database:', Array.from(allVendorAssignments));
        console.log('   📋 All vendor names in database:', Array.from(allVendorNames));
        console.log('   📋 All vendor emails in database:', Array.from(allVendorEmails));
        
        // Check if this vendor exists in the vendors table
        const { data: vendorCheck } = await supabase
          .from('vendors')
          .select('*')
          .eq('vendor_email', currentVendor.vendor_email);
        
        console.log('   🔍 Vendor exists in vendors table:', vendorCheck?.length || 0, 'records');
        if (vendorCheck && vendorCheck.length > 0) {
          console.log('   📋 Vendor table data:', vendorCheck[0]);
        }
        
        // Show potential matches that might be close
        const potentialMatches = ridersWithInstallationData.filter(rider => {
          const vendorName = rider.data.installation_vendor_name || '';
          const vendorEmail = rider.data.installation_vendor_email || '';
          
          return vendorName.toLowerCase().includes(currentVendor.vendor_name.toLowerCase().split(' ')[0]) ||
                 vendorEmail.toLowerCase().includes(currentVendor.vendor_email.toLowerCase().split('@')[0]);
        });
        
        console.log('   🔍 Potential close matches:', potentialMatches.length);
        if (potentialMatches.length > 0) {
          console.log('   📋 Close match examples:');
          potentialMatches.slice(0, 3).forEach((rider, index) => {
            console.log(`      ${index + 1}. ${rider.rider_id}: vendor_name="${rider.data.installation_vendor_name}", vendor_email="${rider.data.installation_vendor_email}"`);
          });
        }
        
        // ENHANCED: Check if any riders have installation status but no vendor assignment
        const ridersWithStatusButNoVendor = (allRiders || [])
          .filter(rider => rider.data.box_installation === 'Scheduled' || rider.data.box_installation === 'Completed')
          .filter(rider => !rider.data.installation_vendor_id && !rider.data.installation_vendor_name && !rider.data.installation_vendor_email);
        
        console.log(`🔍 RIDERS WITH STATUS BUT NO VENDOR ASSIGNMENT: ${ridersWithStatusButNoVendor.length}`);
        if (ridersWithStatusButNoVendor.length > 0) {
          console.log('📋 Sample riders with status but no vendor:', ridersWithStatusButNoVendor.slice(0, 3).map(r => ({
            rider_id: r.rider_id,
            status: r.data.box_installation,
            scheduled_date: r.data.installation_scheduled_date
          })));
        }
      }
      
      // Transform rider data to installation format
      const installationData = vendorInstallations.map(rider => ({
        id: rider.id,
        rider_id: rider.rider_id,
        rider_name: rider.data.rider_name || 'Unknown',
        rider_phone: rider.data.mobile || 'N/A',
        identity_card_number: rider.data.identity_card_number || 'N/A',
        installation_date: rider.data.installation_scheduled_date || rider.data.installation_completion_date || '',
        installation_time: rider.data.installation_scheduled_time || rider.data.installation_completion_time || '',
        location: rider.data.installation_location,
        status: rider.data.box_installation === 'Completed' ? 'completed' as const : 
                rider.data.installation_in_progress ? 'in_progress' as const : 'scheduled' as const,
        notes: rider.data.installation_notes || '',
        proof_image_url: rider.data.installation_proof_image,
        completed_at: rider.data.installation_completion_date,
        created_at: rider.created_at,
        updated_at: rider.updated_at,
        originalRider: rider,
        needsVendorAssignment: !rider.data.installation_vendor_id && !rider.data.installation_vendor_name
      }));
      
      console.log(`📊 VENDOR PORTAL: Processed ${installationData.length} installations for display`);
      
      // Show sample processed installation data
      if (installationData.length > 0) {
        console.log('🔍 VENDOR PORTAL: Sample processed installation:', installationData[0]);
      }
      
      // Keep full set and apply date filters client-side
      setAllInstallations(installationData);
      setInstallations(applyDateFilter(installationData, fromDate, toDate));
    } catch (error) {
      console.error('Error fetching vendor installations:', error);
      toast.error('Failed to load installations');
    } finally {
      setLoading(false);
    }
  };

  const updateInstallationStatus = async (installation: VendorInstallation, newStatus: string, notes?: string, proofImageUrl?: string | null) => {
    try {
      // If this installation needs vendor assignment, assign this vendor
      if (installation.needsVendorAssignment) {
        console.log('🔧 ASSIGNING VENDOR to installation:', installation.rider_id);
      }
      
      const currentDateTime = new Date();
      const currentDate = currentDateTime.toISOString().split('T')[0];
      const currentTime = currentDateTime.toTimeString().slice(0, 5);
      
      const updatedData: any = {
        ...installation.originalRider.data,
        // Assign this vendor if not already assigned
        installation_vendor_id: installation.originalRider.data.installation_vendor_id || vendor.id,
        installation_vendor_name: installation.originalRider.data.installation_vendor_name || vendor.vendor_name,
        installation_vendor_email: installation.originalRider.data.installation_vendor_email || vendor.vendor_email,
        box_installation: newStatus === 'completed' ? 'Completed' : 'Scheduled',
        installation_in_progress: newStatus === 'in_progress',
        installation_notes: notes || installation.originalRider.data.installation_notes || '',
        last_updated_by: vendor?.vendor_email || vendor?.vendor_name || 'Vendor',
        last_updated_at: new Date().toISOString()
      };

      if (newStatus === 'completed') {
        // When installation is completed, ensure training status is set to Eligible as requested
        updatedData.training_status = 'Eligible';
        updatedData.installation_completion_date = currentDate;
        updatedData.installation_completion_time = currentTime;
        updatedData.installation_completed_by = vendor?.vendor_name || 'Vendor';
        if (bikeNumber) {
          updatedData.installation_bike_number = bikeNumber;
        }
        if (proofImageUrl) {
          updatedData.installation_proof_image = proofImageUrl;
          updatedData.proof_image_url = proofImageUrl;
        }
      }

      const { error } = await supabase
        .from('riders')
        .update({ 
          data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('rider_id', installation.rider_id);

      if (error) throw error;

      toast.success(`Installation ${newStatus === 'completed' ? 'completed' : 'started'} successfully`);
      await fetchVendorInstallations(vendor?.vendor_id);
    } catch (error: any) {
      console.error('Error updating installation status:', error);
      toast.error('Failed to update installation status');
    }
  };

  const handleStartInstallation = (installation: VendorInstallation) => {
    updateInstallationStatus(installation, 'in_progress');
  };

  const handleCompleteInstallation = (installation: VendorInstallation) => {
    setSelectedInstallation(installation);
    setCompletionNotes(installation.notes || '');
    setBikeNumber(installation.originalRider?.data?.installation_bike_number || '');
    setShowCompletionModal(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type)) {
      const msg = 'Invalid file type. Allowed: JPG, PNG, WebP, GIF';
      setImageError(msg);
      toast.error(msg);
      setProofImage(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      return;
    }
    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > 5) {
      const msg = `Image too large (${sizeMb.toFixed(2)} MB). Max allowed is 5 MB.`;
      setImageError(msg);
      toast.error(msg);
      setProofImage(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      return;
    }
    setImageError(null);
    setProofImage(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadProofImage = async (fileToUpload: File): Promise<string | null> => {
    try {
      const bucket = 'installation-proofs';
      const ext = (fileToUpload.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi,'');
      const path = `vendor_installations/${vendor?.vendor_id || 'unknown'}/${selectedInstallation?.rider_id || 'rider'}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl || null;
    } catch (error: any) {
      console.error('❌ Storage upload failed', error);
      const msg = typeof error?.message === 'string' ? error.message : String(error);
      toast.error(`Failed to upload proof image: ${msg}. Bucket: installation-proofs`);
      // Try to detect missing bucket and hint
      try {
        const test = await supabase.storage.from('installation-proofs').list('');
        if ((test as any)?.error) {
          console.warn('Bucket check error:', (test as any).error);
        }
      } catch (e) {
        console.warn('Bucket list probe failed, bucket may not exist.');
      }
      return null;
    }
  };

  const handleSubmitCompletion = async () => {
    if (!selectedInstallation) return;

    setUploading(true);
    try {
      if (imageError) {
        toast.error(imageError);
        setUploading(false);
        return;
      }
      let proofImageUrl: string | null = null;
      if (proofImage) {
        proofImageUrl = await uploadProofImage(proofImage);
      }

      await updateInstallationStatus(
        selectedInstallation, 
        'completed', 
        completionNotes,
        proofImageUrl
      );

      setShowCompletionModal(false);
      setSelectedInstallation(null);
      setCompletionNotes('');
      setBikeNumber('');
      setProofImage(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    } catch (error) {
      console.error('Error completing installation:', error);
      toast.error('Failed to complete installation');
    } finally {
      setUploading(false);
    }
  };

  const claimUnassignedInstallations = async () => {
    if (!vendor) return;
    
    try {
      // Find all scheduled installations without vendor assignment
      const { data: unassignedRiders, error } = await supabase
        .from('riders')
        .select('*')
        .contains('data', { box_installation: 'Scheduled' })
        .is('data->installation_vendor_id', null);
      
      if (error) throw error;
      
      if (!unassignedRiders || unassignedRiders.length === 0) {
        toast('No unassigned installations found');
        return;
      }
      
      const proceed = confirm(`Found ${unassignedRiders.length} unassigned installations. Assign them to your vendor (${vendor.vendor_name})?`);
      if (!proceed) return;
      
      let assignedCount = 0;
      
      for (const rider of unassignedRiders) {
        const updatedData = {
          ...rider.data,
          installation_vendor_id: vendor.id,
          installation_vendor_name: vendor.vendor_name,
          installation_vendor_email: vendor.vendor_email
        };
        
        const { error: updateError } = await supabase
          .from('riders')
          .update({ 
            data: updatedData,
            updated_at: new Date().toISOString()
          })
          .eq('rider_id', rider.rider_id);
        
        if (!updateError) {
          assignedCount++;
        }
      }
      
      toast.success(`Assigned ${assignedCount} installations to your vendor`);
      await fetchVendorInstallations(vendor.vendor_id);
    } catch (error) {
      console.error('Error claiming installations:', error);
      toast.error('Failed to claim installations');
    }
  };

  const debugInstallations = async () => {
    if (vendor) {
      console.log('🔍 MANUAL DEBUG: Current vendor state:', vendor);
      await fetchVendorInstallations(vendor.vendor_id);
      toast('Debug completed - check console for details');
    }
  };

  const showCurrentData = () => {
    console.log('🔍 MANUAL DEBUG: Current installations state:', installations);
    console.log('🔍 MANUAL DEBUG: Installations length:', installations.length);
    toast('Current data logged to console');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  function applyDateFilter(rows: VendorInstallation[], from: string, to: string) {
    if (!from && !to) return rows;
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : -Infinity;
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : Infinity;
    return rows.filter(r => {
      const dateStr = r.completed_at || r.installation_date || r.created_at;
      if (!dateStr) return false;
      const ts = new Date(dateStr).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  }

  const columns = [
    {
      key: 'vendor_info',
      label: 'Vendor',
      render: (_value: string) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{vendor?.vendor_name || 'N/A'}</p>
          <p className="text-xs text-gray-600">{vendor?.vendor_id || ''}</p>
        </div>
      ),
    },
    {
      key: 'rider_info',
      label: 'Rider Information',
      sortable: true,
      render: (_value: string, row: VendorInstallation) => (
        <div>
          <p className="font-medium text-gray-900">{row.rider_id}</p>
          <p className="text-sm text-gray-600">{row.rider_name}</p>
          <p className="text-xs text-gray-500">{row.rider_phone}</p>
        </div>
      ),
    },
    {
      key: 'identity_card_number',
      label: 'Identity Card',
      sortable: true,
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm font-mono">{row.identity_card_number || 'N/A'}</span>
      ),
    },
    {
      key: 'partner_name',
      label: 'Partner Name',
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm text-gray-900">{getPartnerInfo(row.originalRider?.data).partner_name}</span>
      ),
    },
    {
      key: 'partner_id',
      label: 'Partner ID',
      sortable: true,
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm font-mono">{getPartnerInfo(row.originalRider?.data).partner_id}</span>
      ),
    },
    {
      key: 'installation_date',
      label: 'Scheduled Date & Time',
      sortable: true,
      render: (value: string, row: VendorInstallation) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{value}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{row.installation_time}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'daily_installation_date',
      label: 'Daily Installation Date',
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm text-gray-900">{row.completed_at || row.installation_date || 'N/A'}</span>
      ),
    },
    {
      key: 'bike_model',
      label: 'Bike Model',
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm text-gray-900">{row.originalRider?.data?.installation_bike_number || row.originalRider?.data?.vehicle_number || row.originalRider?.data?.delivery_type || ''}</span>
      ),
    },
    {
      key: 'installation_bike_number',
      label: 'Installation Bike Number',
      sortable: true,
      render: (_value: string, row: VendorInstallation) => (
        <span className="text-sm font-mono">{row.originalRider?.data?.installation_bike_number || row.originalRider?.data?.vehicle_number || ''}</span>
      ),
    },
    {
      key: 'location',
      label: 'Installation Location',
      render: (value: string) => (
        <div className="flex items-start space-x-1">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <span className="text-sm text-gray-900 max-w-xs">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status & Actions',
      sortable: true,
      render: (value: string, row: VendorInstallation) => (
        <div className="space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
            {value.replace('_', ' ').toUpperCase()}
          </span>
          
          {value === 'scheduled' && (
            <div className="space-y-1">
              <button
                onClick={() => handleStartInstallation(row)}
                className="block w-full text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Start Installation
              </button>
              <button
                onClick={() => handleCompleteInstallation(row)}
                className="block w-full text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            </div>
          )}
          
          {value === 'in_progress' && (
            <button
              onClick={() => handleCompleteInstallation(row)}
              className="block w-full text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
            >
              Complete Installation
            </button>
          )}
          
          {value === 'completed' && row.proof_image_url && (
            <button
              onClick={() => setSelectedProofImage({ url: row.proof_image_url as string, rider: row })}
              className="block w-full text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              View Proof Image
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: string, row: VendorInstallation) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600">{value || 'No notes'}</p>
          {row.completed_at && (
            <p className="text-xs text-green-600 mt-1">
              Completed: {new Date(row.completed_at).toLocaleDateString()}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Updated: {row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A'}
          </div>
          {(row.originalRider?.data?.last_updated_by || row.originalRider?.data?.updated_by) && (
            <div className="text-xs text-gray-500">by {row.originalRider.data.last_updated_by || row.originalRider.data.updated_by}</div>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: installations.length,
    scheduled: installations.filter(i => i.status === 'scheduled').length,
    inProgress: installations.filter(i => i.status === 'in_progress').length,
    completed: installations.filter(i => i.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your installations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Vendor Portal</h1>
              <p className="text-sm text-gray-600">
                {vendor?.vendor_name || 'Loading...'} - {vendor?.vendor_id || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={debugInstallations}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
            >
              🔍 Debug Installations
            </button>
            <button
              onClick={claimUnassignedInstallations}
              className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200 transition-colors"
            >
              🔧 Claim Unassigned Installations
            </button>
            <button
              onClick={showCurrentData}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              📊 Show Current Data
            </button>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Date Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setFromDate(v);
                  setInstallations(applyDateFilter(allInstallations, v, toDate));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">To date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setToDate(v);
                  setInstallations(applyDateFilter(allInstallations, fromDate, v));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="ml-auto text-xs text-gray-500">
              Showing {installations.length} of {allInstallations.length}
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Installations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.scheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Vendor Availability Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Daily Capacity</p>
                <p className="text-2xl font-semibold text-purple-600">{vendor?.max_boxes_per_day || 0}</p>
                <p className="text-xs text-gray-500">{vendor?.boxes_per_hour || 0}/hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Serviceable Timings */}
        {vendor && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Service Hours</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Working Days */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Working Days</h3>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const serviceableDays = Array.isArray(vendor.serviceable_days) && vendor.serviceable_days.length > 0 
                      ? vendor.serviceable_days 
                      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <span
                      key={day}
                      className={`px-2 py-1 text-xs rounded-full ${
                        serviceableDays.includes(day)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </span>
                    ));
                  })()}
                </div>
                {vendor.is_available_weekends === true && (
                  <p className="text-xs text-green-600 mt-1">✅ Weekend availability</p>
                )}
                {vendor.is_available_weekends === false && (
                  <p className="text-xs text-gray-500 mt-1">❌ No weekend availability</p>
                )}
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Working Hours</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Start:</span>
                    <span className="font-medium text-gray-900">
                      {vendor.start_time ? vendor.start_time.slice(0, 5) : '08:00'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">End:</span>
                    <span className="font-medium text-gray-900">
                      {vendor.end_time ? vendor.end_time.slice(0, 5) : '18:00'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Timezone: {vendor.timezone || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Break Times */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Break Time</h3>
                <div className="space-y-2">
                  {vendor.break_start_time && vendor.break_end_time ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Break:</span>
                        <span className="font-medium text-gray-900">
                          {vendor.break_start_time.slice(0, 5)} - {vendor.break_end_time.slice(0, 5)}
                        </span>
                      </div>
                      <p className="text-xs text-orange-600">⏸️ Not available during break</p>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">No break scheduled</p>
                      <p className="text-xs text-green-600">✅ Available all working hours</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {vendor.special_notes && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">📝 Special Notes:</h4>
                <p className="text-sm text-blue-800">{vendor.special_notes}</p>
              </div>
            )}

            {/* Capacity Information */}
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">📦 Installation Capacity:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
                <div>
                  <span className="font-medium">Hourly Rate:</span> {vendor.boxes_per_hour || 1} boxes/hour
                </div>
                <div>
                  <span className="font-medium">Daily Maximum:</span> {vendor.max_boxes_per_day || 8} boxes/day
                </div>
                <div>
                  <span className="font-medium">Working Hours:</span> {(() => {
                    const startTime = vendor.start_time || '08:00';
                    const endTime = vendor.end_time || '18:00';
                    try {
                      const start = new Date(`1970-01-01T${startTime.slice(0, 5)}`);
                      const end = new Date(`1970-01-01T${endTime.slice(0, 5)}`);
                      const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                      return `${hours} hours/day`;
                    } catch (error) {
                      return '10 hours/day';
                    }
                  })()}
                </div>
              </div>
              
              {/* Additional Vendor Info */}
              <div className="mt-3 pt-3 border-t border-purple-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-purple-700">
                  <div>
                    <span className="font-medium">Vendor ID:</span> {vendor.vendor_id || 'Not assigned'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {vendor.location || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {vendor.vendor_email || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Last Login:</span> {
                      vendor.last_login 
                        ? new Date(vendor.last_login).toLocaleDateString()
                        : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Installations Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Box Installations</h2>
            <p className="text-gray-600 mt-1">Manage your assigned box installation tasks</p>
          </div>

          <div className="p-6">
            {installations.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Installations Assigned</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any box installations assigned yet. There might be unassigned installations you can claim.
                </p>
                <button
                  onClick={claimUnassignedInstallations}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  🔧 Check for Unassigned Installations
                </button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={installations.map(installation => ({
                  ...installation,
                  searchableText: `${installation.rider_id} ${installation.rider_name} ${installation.rider_phone} ${installation.identity_card_number || ''} ${installation.location} ${installation.status} ${installation.originalRider?.data?.partner_id || ''} ${installation.originalRider?.data?.equipment_partner_id || ''} ${installation.originalRider?.data?.partner_company_name_en || installation.originalRider?.data?.partner_name || ''} ${installation.originalRider?.data?.installation_bike_number || ''} ${installation.originalRider?.data?.vehicle_number || ''}`.toLowerCase()
                }))}
                searchable
                pagination
                pageSize={20}
              />
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && selectedInstallation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Complete Installation</h2>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setSelectedInstallation(null);
                    setCompletionNotes('');
                    setBikeNumber('');
                    // setProofImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Installation Details */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-orange-900 mb-2">Installation Details</h3>
                <div className="space-y-1 text-sm text-orange-800">
                  <div><strong>Rider:</strong> {selectedInstallation.rider_name} ({selectedInstallation.rider_id})</div>
                  <div><strong>Phone:</strong> {selectedInstallation.rider_phone}</div>
                  <div><strong>Date:</strong> {selectedInstallation.installation_date} at {selectedInstallation.installation_time}</div>
                  <div><strong>Location:</strong> {selectedInstallation.location}</div>
                </div>
              </div>

              {/* Bike Number Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bike Number
                </label>
                <input
                  type="text"
                  value={bikeNumber}
                  onChange={(e) => setBikeNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter bike number used for installation (e.g., BIKE001)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Record which bike was used for this installation
                </p>
              </div>

              {/* Completion Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Add any notes about the installation (optional)..."
                />
              </div>

           

              {/* Proof Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Proof Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                {proofImage && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {proofImage.name} ({(proofImage.size/1024/1024).toFixed(2)} MB)</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Max 5 MB. Allowed types: JPG, PNG, WebP, GIF.</p>
                {imageError && (
                  <p className="text-xs text-red-600 mt-1">{imageError}</p>
                )}
                {previewUrl && !imageError && (
                  <div className="mt-2">
                    <img src={previewUrl} alt="Preview" className="max-h-40 rounded border" />
                    <div className="mt-2">
                      <button
                        onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setProofImage(null); }}
                        className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setSelectedInstallation(null);
                    setCompletionNotes('');
                    setBikeNumber('');
                    // setProofImage(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCompletion}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{uploading ? 'Completing...' : 'Complete Installation'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Viewing Modal */}
      {selectedProofImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Installation Proof</h2>
                <button
                  onClick={() => setSelectedProofImage(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Installation Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Completed Installation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                  <div>
                    <div><strong>Rider:</strong> {selectedProofImage.rider.rider_name}</div>
                    <div><strong>Rider ID:</strong> {selectedProofImage.rider.rider_id}</div>
                    <div><strong>Phone:</strong> {selectedProofImage.rider.rider_phone}</div>
                  </div>
                  <div>
                    <div><strong>Date:</strong> {selectedProofImage.rider.installation_date}</div>
                    <div><strong>Time:</strong> {selectedProofImage.rider.installation_time}</div>
                    <div><strong>Location:</strong> {selectedProofImage.rider.location}</div>
                  </div>
                </div>
                {selectedProofImage.rider.completed_at && (
                  <div className="mt-2 text-sm text-green-700">
                    <strong>Completed:</strong> {new Date(selectedProofImage.rider.completed_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Proof Image */}
              <div className="text-center">
                <img
                  src={selectedProofImage.url}
                  alt="Installation proof"
                  className="max-w-full max-h-96 object-contain mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('❌ Failed to load proof image');
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedProofImage(null)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}