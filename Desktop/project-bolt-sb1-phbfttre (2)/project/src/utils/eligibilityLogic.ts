/**
 * Apply eligibility logic to rider data
 * This function determines training and box installation eligibility
 *
 * STRICT RULES:
 * Training: Car + Audit Pass + On Job = "Eligible", otherwise "Not Eligible"
 * Training: OR Box Installation Completed = "Eligible" (regardless of vehicle type)
 * Installation: Motorcycle + Audit Pass + On Job = "Eligible", otherwise "Not Eligible"
 * Equipment: Training Completed = "Eligible", otherwise "Not Eligible"
 */
export const applyEligibilityLogic = (data: Record<string, any>) => {
  const updates: Record<string, any> = {};
  
  const deliveryType = String(data.delivery_type || '').trim();
  const auditStatus = String(data.audit_status || '').trim();
  const jobStatus = String(data.job_status || '').trim();
  const boxInstallationStatus = String(data.box_installation || '').trim();
  const trainingStatus = String(data.training_status || '').trim();
  const equipmentStatus = String(data.equipment_status || '').trim();
  
  console.log('🔍 === ELIGIBILITY LOGIC DEBUG FOR RIDER ===');
  console.log('🆔 Rider ID:', data.rider_id || 'Unknown');
  console.log('🚗 Delivery Type:', deliveryType);
  console.log('🔍 Audit Status:', auditStatus);
  console.log('💼 Job Status:', jobStatus);
  console.log('📦 Box Installation Status:', boxInstallationStatus);
  console.log('🎓 Training Status:', trainingStatus);
  console.log('📋 Equipment Status:', equipmentStatus);
  
  // STRICT criteria checking
  const hasAuditPass = auditStatus === 'Audit Pass';
  const hasOnJob = jobStatus === 'On Job';
  const isCarDelivery = deliveryType === 'Car';
  const isMotorcycleDelivery = deliveryType === 'Motorcycle';
  const hasCompletedBoxInstallation = boxInstallationStatus === 'Completed';
  const hasCompletedTraining = trainingStatus === 'Completed';
  
  console.log('✅ Has Audit Pass (strict):', hasAuditPass);
  console.log('💼 Has On Job (strict):', hasOnJob);
  console.log('🚗 Is Car Delivery (strict):', isCarDelivery);
  console.log('🏍️ Is Motorcycle Delivery (strict):', isMotorcycleDelivery);
  console.log('📦 Has Completed Box Installation:', hasCompletedBoxInstallation);
  console.log('🎓 Has Completed Training:', hasCompletedTraining);
  
  // Resignation hard rules
  if (jobStatus === 'Resign' || jobStatus === 'Resigned') {
    // Training rules on resignation
    if (trainingStatus === 'Scheduled' || trainingStatus === 'Eligible' || trainingStatus === '') {
      updates.training_status = 'Not Eligible';
      updates.training_scheduled_date = null;
      updates.training_scheduled_time = null;
      updates.training_location = null;
    }
    // Installation rules on resignation
    if (boxInstallationStatus === 'Scheduled' || boxInstallationStatus === 'Eligible' || boxInstallationStatus === '') {
      updates.box_installation = 'Not Eligible';
      updates.installation_scheduled_date = null;
      updates.installation_scheduled_time = null;
      updates.installation_scheduled_time_end = null;
      updates.installation_location = null;
      updates.installation_vendor_id = null;
      updates.installation_vendor_name = null;
      updates.installation_vendor_email = null;
      updates.installation_in_progress = false;
    }
    // Equipment rules on resignation
    if (equipmentStatus === 'Scheduled' || equipmentStatus === 'Eligible' || equipmentStatus === '') {
      updates.equipment_status = 'Not Eligible';
      updates.equipment_scheduled_date = null;
      updates.equipment_scheduled_time = null;
      updates.equipment_location = null;
    }
    if (equipmentStatus === 'Completed') {
      updates.equipment_return_required = true;
      updates.equipment_return_status = data.equipment_return_status || 'Pending';
    }
    if (boxInstallationStatus === 'Completed') {
      updates.installation_return_required = true;
      updates.installation_return_status = data.installation_return_status || 'Pending';
    }
  }

  // Training eligibility logic: (Car + Audit Pass + On Job) OR (Box Installation Completed)
  // Only update training status if not already Completed or Scheduled
  if (trainingStatus !== 'Completed' && trainingStatus !== 'Scheduled') {
    const meetsTrainingCriteria = (isCarDelivery && hasAuditPass && hasOnJob) || hasCompletedBoxInstallation;
    console.log('🎓 Meets Training Criteria:', meetsTrainingCriteria);
    
    const newTrainingStatus = meetsTrainingCriteria ? 'Eligible' : 'Not Eligible';
    updates.training_status = newTrainingStatus;
    
    if (hasCompletedBoxInstallation) {
      console.log(`🎓 ✅ TRAINING ELIGIBLE (Box Installation Completed): ${newTrainingStatus}`);
    } else {
      console.log(`🎓 ${meetsTrainingCriteria ? '✅ TRAINING ELIGIBLE (Car Criteria)' : '❌ TRAINING NOT ELIGIBLE'}: ${newTrainingStatus}`);
    }
  } else {
    console.log(`🎓 ✅ KEEPING EXISTING TRAINING STATUS: ${trainingStatus} (not overriding)`);
  }
  
  // Box installation eligibility logic: Only update if not already Completed or Scheduled
  if (boxInstallationStatus !== 'Completed' && boxInstallationStatus !== 'Scheduled') {
    const meetsInstallationCriteria = isMotorcycleDelivery && hasAuditPass && hasOnJob;
    console.log('📦 Meets Installation Criteria:', meetsInstallationCriteria);
    
    const newInstallationStatus = meetsInstallationCriteria ? 'Eligible' : 'Not Eligible';
    updates.box_installation = newInstallationStatus;
    console.log(`📦 ${meetsInstallationCriteria ? '✅ INSTALLATION ELIGIBLE' : '❌ INSTALLATION NOT ELIGIBLE'}: ${newInstallationStatus}`);
  } else {
    console.log(`📦 ✅ KEEPING EXISTING STATUS: ${boxInstallationStatus} (not overriding)`);
  }
  
  // Equipment eligibility logic: Only update if not already Completed or Scheduled
  if (equipmentStatus !== 'Completed' && equipmentStatus !== 'Scheduled') {
    const meetsEquipmentCriteria = hasCompletedTraining;
    console.log('📋 Meets Equipment Criteria:', meetsEquipmentCriteria);
    
    const newEquipmentStatus = meetsEquipmentCriteria ? 'Eligible' : 'Not Eligible';
    updates.equipment_status = newEquipmentStatus;
    console.log(`📋 ${meetsEquipmentCriteria ? '✅ EQUIPMENT ELIGIBLE' : '❌ EQUIPMENT NOT ELIGIBLE'}: ${newEquipmentStatus}`);
  } else {
    console.log(`📋 ✅ KEEPING EXISTING STATUS: ${equipmentStatus} (not overriding)`);
  }
  
  console.log('🔄 Updates to apply:', updates);
  console.log('🏁 === END ELIGIBILITY DEBUG ===');
  
  return updates;
};