import React, { useState } from 'react';
import { UploadHistory } from '../components/upload/UploadHistory';
import { FileUpload } from '../components/common/FileUpload';
import { cleanRiderData, validateRiderData } from '../utils/dataCleanup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUploadHistory, useRiders } from '../hooks/useRiders';
import { useGlobalProgressBar } from '../App';
import toast from 'react-hot-toast';

export function Upload() {
  const { user } = useAuth();
  const progressBar = useGlobalProgressBar();
  const { refreshHistory } = useUploadHistory();
  const { applyBulkEligibilityLogic, totalCount } = useRiders();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllRiders = async () => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete ALL ${totalCount || 'existing'} riders from the database.\n\nThis action cannot be undone!\n\nType "DELETE ALL" to confirm:`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE ALL') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    setDeleting(true);
    try {
      console.log('🗑️ Starting deletion of all rider data...');
      
      // Delete all riders
      const { error: ridersError } = await supabase
        .from('riders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)

      if (ridersError) throw ridersError;

      // Delete all upload history
      const { error: uploadsError } = await supabase
        .from('upload_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (uploadsError) throw uploadsError;

      // Delete all rider updates
      const { error: updatesError } = await supabase
        .from('rider_updates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (updatesError) throw updatesError;

      console.log('✅ All rider data deleted successfully');
      toast.success('🗑️ All rider data deleted successfully! Ready for fresh upload.');
      
      // Refresh upload history
      await refreshHistory();
      
    } catch (error: any) {
      console.error('❌ Error deleting rider data:', error);
      toast.error('Failed to delete rider data: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDataUpload = async (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast.error('No data found in file');
      return;
    }

    setUploading(true);
    progressBar.showProgress('Preparing upload...', `Processing ${data.length} records`);
    
    try {
      // Detect columns and validate rider_id
      const columns = Object.keys(data[0]);
      
      // Expected XLSX columns
      const expectedColumns = [
        'rider_id', 'create_time', 'city_id', 'partner_id', 'rider_name', 
        'mobile', 'nationality_code', 'resident_type', 'partner_company_name_en',
        'identity_card_number', 'vehicle_number', 'delivery_type', 'audit_status',
        'job_status', 'box_installation', 'training_status', 'equipment_status'
      ];
      
      // Find rider_id column (case insensitive)
      const riderIdColumn = columns.find(col => 
        col.toLowerCase().includes('rider_id') || 
        col.toLowerCase().includes('rider id') ||
        col.toLowerCase() === 'id'
      );
      
      if (!riderIdColumn) {
        toast.error('No rider ID column found. Please ensure your file has a column named "rider_id", "Rider ID", or "id"');
        return;
      }

      // Validate required columns
      const missingColumns = expectedColumns.filter(expected => 
        !columns.some(col => col.toLowerCase() === expected.toLowerCase())
      );
      
      if (missingColumns.length > 0) {
        console.warn('Missing expected columns:', missingColumns);
        // Don't block upload, just warn
      }

      console.log('Processing upload:', {
        filename: fileName,
        totalRows: data.length,
        columns: columns,
        riderIdColumn: riderIdColumn,
        expectedColumns: expectedColumns,
        missingColumns: missingColumns
      });
      
      // Create upload history record
      progressBar.updateProgress(5, 'uploading', 'Creating upload record...');
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('upload_history')
        .insert([{
          filename: fileName,
          total_rows: data.length,
          columns_detected: columns,
          upload_status: 'processing',
          uploaded_by: user?.id
        }])
        .select()
        .single();

      if (uploadError) {
        console.error('Upload record creation error:', uploadError);
        toast.error('Failed to create upload record');
        return;
      }

      let ridersCreated = 0;
      let ridersUpdated = 0;
      let ridersNoChange = 0;

      // Process each rider using the smart upsert function
      // Process in batches for better performance
      const batchSize = 50; // Process 50 records at a time
      const batches = [];
      for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
      }
      
      let processedCount = 0;
      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);
        
        // Update progress for upload phase (10% to 70%)
        const uploadProgress = 10 + ((batchIndex / batches.length) * 60);
        progressBar.updateProgress(
          uploadProgress, 
          'uploading', 
          `Uploading batch ${batchIndex + 1}/${batches.length}...`,
          `Processed ${processedCount}/${data.length} records`
        );
        
        // Process batch in parallel with controlled concurrency
        const batchPromises = batch.map(async (row) => {
        const riderId = row[riderIdColumn];
        if (!riderId) {
          console.warn('Skipping row with empty rider ID:', row);
          return { result: 'skipped', riderId: null };
        }

        // Clean and normalize the data
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.toLowerCase().replace(/\s+/g, '_');
          let value = row[key];
          
          // Handle empty strings and null values
          if (value === '' || value === null || value === undefined) {
            value = null;
          } else if (typeof value === 'string') {
            value = value.trim();
          }
          
          cleanedRow[cleanKey] = value;
        });

        // Apply data cleaning and standardization
        const standardizedData = cleanRiderData(cleanedRow);
        
        // 🚨 PRESERVE EXISTING STATUS FIELDS: Do not overwrite from upload
        // Get existing rider data to preserve status fields
        const { data: existingRider, error: fetchError } = await supabase
          .from('riders')
          .select('data')
          .eq('rider_id', String(riderId))
          .maybeSingle();
        
        let preservedData = { ...standardizedData };
        
        if (!fetchError && existingRider) {
          console.log(`🔒 PRESERVING STATUS: Found existing rider ${riderId}, preserving status fields`);
          
          // Preserve training status and all related fields
          if (existingRider.data.training_status) {
            preservedData.training_status = existingRider.data.training_status;
            preservedData.training_scheduled_date = existingRider.data.training_scheduled_date;
            preservedData.training_scheduled_time = existingRider.data.training_scheduled_time;
            preservedData.training_location = existingRider.data.training_location;
            preservedData.training_completion_date = existingRider.data.training_completion_date;
            preservedData.training_completion_time = existingRider.data.training_completion_time;
            preservedData.training_completed_by = existingRider.data.training_completed_by;
            preservedData.training_notes = existingRider.data.training_notes;
            console.log(`🎓 PRESERVED: Training status = ${existingRider.data.training_status}`);
          }
          
          // Preserve box installation status and all related fields
          if (existingRider.data.box_installation) {
            preservedData.box_installation = existingRider.data.box_installation;
            preservedData.installation_scheduled_date = existingRider.data.installation_scheduled_date;
            preservedData.installation_scheduled_time = existingRider.data.installation_scheduled_time;
            preservedData.installation_location = existingRider.data.installation_location;
            preservedData.installation_completion_date = existingRider.data.installation_completion_date;
            preservedData.installation_completion_time = existingRider.data.installation_completion_time;
            preservedData.installation_completed_by = existingRider.data.installation_completed_by;
            preservedData.installation_vendor_id = existingRider.data.installation_vendor_id;
            preservedData.installation_vendor_name = existingRider.data.installation_vendor_name;
            preservedData.installation_vendor_email = existingRider.data.installation_vendor_email;
            preservedData.installation_proof_image = existingRider.data.installation_proof_image;
            preservedData.installation_notes = existingRider.data.installation_notes;
            preservedData.installation_in_progress = existingRider.data.installation_in_progress;
            console.log(`📦 PRESERVED: Box installation = ${existingRider.data.box_installation}`);
          }
          
          // Preserve equipment status and all related fields
          if (existingRider.data.equipment_status) {
            preservedData.equipment_status = existingRider.data.equipment_status;
            preservedData.equipment_scheduled_date = existingRider.data.equipment_scheduled_date;
            preservedData.equipment_scheduled_time = existingRider.data.equipment_scheduled_time;
            preservedData.equipment_location = existingRider.data.equipment_location;
            preservedData.equipment_completion_date = existingRider.data.equipment_completion_date;
            preservedData.equipment_completion_time = existingRider.data.equipment_completion_time;
            preservedData.equipment_distributed_by = existingRider.data.equipment_distributed_by;
            preservedData.equipment_partner_id = existingRider.data.equipment_partner_id;
            preservedData.equipment_allocated_items = existingRider.data.equipment_allocated_items;
            preservedData.equipment_total_items = existingRider.data.equipment_total_items;
            preservedData.equipment_notes = existingRider.data.equipment_notes;
            console.log(`📋 PRESERVED: Equipment status = ${existingRider.data.equipment_status}`);
          }
        } else {
          console.log(`🆕 NEW RIDER: ${riderId} - will apply eligibility logic`);
        }
        // Validate the cleaned data
        const validation = validateRiderData(preservedData);
        if (!validation.isValid) {
          console.warn(`⚠️ Validation warnings for rider ${riderId}:`, validation.errors);
        }

        try {
          const { data: result, error } = await supabase
            .rpc('upsert_rider_data', {
              p_rider_id: String(riderId),
              p_new_data: preservedData,
              p_upload_id: uploadRecord.id
            });

          if (error) {
            console.error('Error upserting rider:', riderId, error);
            return { result: 'error', riderId, error };
          }

          return { result, riderId };

        } catch (error) {
          console.error('Error processing rider:', riderId, error);
          return { result: 'error', riderId, error };
        }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Count results
        batchResults.forEach(({ result }) => {
          if (result === 'created') ridersCreated++;
          else if (result === 'updated') ridersUpdated++;
          else if (result === 'skipped' || result === 'error') {
            // Handle errors/skips
          } else {
            ridersNoChange++;
          }
        });
        
        processedCount += batch.length;
        
        // Update progress (you could add a progress bar here)
        console.log(`Progress: ${processedCount}/${data.length} records processed`);
        
        // Small delay between batches to avoid overwhelming the database
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Update upload history with results
      progressBar.updateProgress(75, 'processing', 'Finalizing upload...', 'Updating upload history');
      const { error: updateError } = await supabase
        .from('upload_history')
        .update({
          riders_created: ridersCreated,
          riders_updated: ridersUpdated,
          upload_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', uploadRecord.id);

      if (updateError) {
        console.error('Error updating upload record:', updateError);
      }

      setUploadResult({
        filename: fileName,
        totalRows: data.length,
        ridersCreated,
        ridersUpdated,
        ridersNoChange
      });

      console.log('Upload completed successfully');
      toast.success(`Upload completed! Created: ${ridersCreated}, Updated: ${ridersUpdated}, No changes: ${ridersNoChange}`);
      
      // Refresh upload history
      await refreshHistory();
      
      // Auto-apply eligibility logic to all uploaded riders
      console.log('🔄 Auto-applying eligibility logic to uploaded riders...');
      progressBar.updateProgress(80, 'processing', 'Applying eligibility logic...', 'This may take a few minutes for large datasets');
      
      // Small delay to ensure data is saved, then apply eligibility logic
      setTimeout(async () => {
        // Use the fixed applyBulkEligibilityLogic function that handles pagination
        await applyBulkEligibilityLogic();
        
        // Refresh the riders list after eligibility logic is applied
        await refreshHistory();
      }, 2000);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      progressBar.errorProgress('Upload failed', error.message || 'Failed to upload data');
      toast.error(error.message || 'Failed to upload data');
    } finally {
      setUploading(false);
    }
  };

  const handleFileProcessed = (data: any[], fileName: string) => {
    handleDataUpload(data, fileName);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rider Data Upload</h1>
        <p className="text-gray-600 mt-2">
          Upload rider data files to create new riders or update existing ones based on Rider ID
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">⚠️ Database Cleanup Required</h4>
          <p className="text-sm text-red-800 mb-3">
            Before uploading new data, you need to clean the existing rider database.
          </p>
          <button
            onClick={handleDeleteAllRiders}
            disabled={uploading || deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? '🗑️ Deleting...' : '🗑️ Delete All Rider Data'}
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📋 Data Cleaning & Standardization</h4>
          <p className="text-sm text-blue-800 mb-2">
            The system will automatically clean and standardize your data during upload.
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Delivery Type:</strong> Car, Motorcycle (fixes casing, removes special chars)</li>
            <li><strong>Audit Status:</strong> Audit Pass, Audit Reject (standardizes variations)</li>
            <li><strong>Job Status:</strong> On Job, Resign (cleans hyphens/underscores)</li>
            <li><strong>Text Fields:</strong> Trims spaces and normalizes formatting</li>
            <li><strong>Eligibility Logic:</strong> Automatically applied after cleaning</li>
          </ul>
        </div>

        <FileUpload
          title="Upload Rider Data File"
          description="Upload CSV or Excel file with rider data. Ensure your file has a 'rider_id' column as the primary identifier."
          onFileProcessed={handleFileProcessed}
        />
      </div>

      {uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 font-medium">Upload Completed Successfully!</h3>
          <div className="text-green-700 text-sm mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total Rows:</span> {uploadResult.totalRows}
            </div>
            <div>
              <span className="font-medium">Created:</span> {uploadResult.ridersCreated}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {uploadResult.ridersUpdated}
            </div>
            <div>
              <span className="font-medium">No Changes:</span> {uploadResult.ridersNoChange}
            </div>
          </div>
        </div>
      )}

      <UploadHistory />

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900 font-medium">Processing rider data...</p>
              <p className="text-gray-600 text-sm mt-1">Checking for updates and creating new riders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}