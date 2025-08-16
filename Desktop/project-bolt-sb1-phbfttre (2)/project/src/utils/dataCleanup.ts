/**
 * Data cleaning and standardization utilities
 * Ensures all rider data matches exact allowed values
 */

// Allowed values for each field
export const ALLOWED_VALUES = {
  delivery_type: ['Car', 'Motorcycle'],
  audit_status: ['Audit Pass', 'Audit Reject'],
  job_status: ['On Job', 'Resign']
} as const;

/**
 * Clean and standardize a single field value
 */
export function cleanFieldValue(field: keyof typeof ALLOWED_VALUES, value: any): string {
  if (!value) return '';
  
  // Convert to string and clean
  let cleaned = String(value)
    .trim() // Remove leading/trailing spaces
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/[^\w\s]/g, ' ') // Remove special characters except word chars and spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Final trim
  
  // Normalize to lowercase for comparison
  const normalized = cleaned.toLowerCase();
  
  // Find matching allowed value (case-insensitive)
  const allowedValues = ALLOWED_VALUES[field];
  const match = allowedValues.find(allowed => 
    allowed.toLowerCase() === normalized
  );
  
  if (match) {
    console.log(`✅ Cleaned ${field}: "${value}" → "${match}"`);
    return match;
  }
  
  // Try partial matching for common variations
  if (field === 'delivery_type') {
    if (normalized.includes('car') || normalized.includes('automobile')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "Car" (partial match)`);
      return 'Car';
    }
    if (normalized.includes('motorcycle') || normalized.includes('bike') || normalized.includes('motor')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "Motorcycle" (partial match)`);
      return 'Motorcycle';
    }
  }
  
  if (field === 'audit_status') {
    if (normalized.includes('pass') || normalized.includes('approved') || normalized.includes('accept')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "Audit Pass" (partial match)`);
      return 'Audit Pass';
    }
    if (normalized.includes('reject') || normalized.includes('fail') || normalized.includes('denied')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "Audit Reject" (partial match)`);
      return 'Audit Reject';
    }
  }
  
  if (field === 'job_status') {
    if (normalized.includes('on') && normalized.includes('job')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "On Job" (partial match)`);
      return 'On Job';
    }
    if (normalized.includes('resign') || normalized.includes('quit') || normalized.includes('left')) {
      console.log(`✅ Cleaned ${field}: "${value}" → "Resign" (partial match)`);
      return 'Resign';
    }
  }
  
  // If no match found, log warning and return original cleaned value
  console.warn(`⚠️ No match found for ${field}: "${value}" → keeping as "${cleaned}"`);
  return cleaned;
}

/**
 * Clean all rider data fields
 */
export function cleanRiderData(data: Record<string, any>): Record<string, any> {
  const cleaned = { ...data };
  
  // Clean the three critical fields
  if (cleaned.delivery_type) {
    cleaned.delivery_type = cleanFieldValue('delivery_type', cleaned.delivery_type);
  }
  
  if (cleaned.audit_status) {
    cleaned.audit_status = cleanFieldValue('audit_status', cleaned.audit_status);
  }
  
  if (cleaned.job_status) {
    cleaned.job_status = cleanFieldValue('job_status', cleaned.job_status);
  }
  
  // Clean other text fields (trim and normalize spaces)
  const textFields = ['rider_name', 'mobile', 'nationality_code', 'resident_type', 
                     'partner_company_name_en', 'identity_card_number', 'vehicle_number'];
  
  textFields.forEach(field => {
    if (cleaned[field]) {
      const original = cleaned[field];
      cleaned[field] = String(original)
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
      
      if (original !== cleaned[field]) {
        console.log(`🧹 Cleaned ${field}: "${original}" → "${cleaned[field]}"`);
      }
    }
  });
  
  return cleaned;
}

/**
 * Validate that critical fields have allowed values
 */
export function validateRiderData(data: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check delivery_type
  if (data.delivery_type && !ALLOWED_VALUES.delivery_type.includes(data.delivery_type)) {
    errors.push(`Invalid delivery_type: "${data.delivery_type}". Must be: ${ALLOWED_VALUES.delivery_type.join(', ')}`);
  }
  
  // Check audit_status
  if (data.audit_status && !ALLOWED_VALUES.audit_status.includes(data.audit_status)) {
    errors.push(`Invalid audit_status: "${data.audit_status}". Must be: ${ALLOWED_VALUES.audit_status.join(', ')}`);
  }
  
  // Check job_status
  if (data.job_status && !ALLOWED_VALUES.job_status.includes(data.job_status)) {
    errors.push(`Invalid job_status: "${data.job_status}". Must be: ${ALLOWED_VALUES.job_status.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}