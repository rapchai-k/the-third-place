/**
 * Partner data cleaning and standardization utilities
 * Handles the specific Excel columns: partner_id, partner_name, partner_city_id, city, 
 * cooperation_status, business_status, capacity_type, parent_partner_id, 
 * partner_company_name_en, brand_name, signer_email, legal_email, manager_mis_ids, region
 */

/**
 * Clean and standardize partner data from Excel upload with specific column mapping
 */
export function cleanPartnerData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  // Map exact Excel columns to database fields
  Object.keys(data).forEach(key => {
    const lowerKey = key.toLowerCase().trim();
    let value = data[key];
    
    // Handle empty strings and null values
    if (value === '' || value === null || value === undefined) {
      value = null;
    } else if (typeof value === 'string') {
      value = value.trim();
    }
    
    // Map exact Excel column names
    switch (lowerKey) {
      case 'partner_id':
        cleaned.partner_id = value;
        break;
      case 'partner_name':
        cleaned.partner_name = value;
        cleaned.name = value; // Also set as name for compatibility
        break;
      case 'partner_city_id':
        cleaned.partner_city_id = value;
        break;
      case 'city':
        cleaned.city = value;
        cleaned.location = value; // Also set as location for compatibility
        break;
      case 'cooperation_status':
        cleaned.cooperation_status = value;
        break;
      case 'business_status':
        cleaned.business_status = value;
        break;
      case 'capacity_type':
        cleaned.capacity_type = value;
        break;
      case 'parent_partner_id':
        cleaned.parent_partner_id = value;
        break;
      case 'partner_company_name_en':
        cleaned.partner_company_name_en = value;
        break;
      case 'brand_name':
        cleaned.brand_name = value;
        break;
      case 'signer_email':
        cleaned.signer_email = value;
        break;
      case 'legal_email':
        cleaned.legal_email = value;
        break;
      case 'manager_mis_ids':
        cleaned.manager_mis_ids = value;
        break;
      case 'region':
        cleaned.region = value;
        break;
      case 'car target':
      case 'car_target':
        cleaned.car_target = value !== null && value !== undefined && value !== '' ? parseInt(value) : null;
        break;
      case 'bike target':
      case 'bike_target':
        cleaned.bike_target = value !== null && value !== undefined && value !== '' ? parseInt(value) : null;
        break;
      case 'total':
      case 'total_target':
        cleaned.total_target = value !== null && value !== undefined && value !== '' ? parseInt(value) : null;
        break;
      // Handle legacy field names for compatibility
      case 'name':
      case 'company_name':
        if (!cleaned.partner_name) cleaned.partner_name = value;
        cleaned.name = value;
        break;
      case 'location':
      case 'address':
        if (!cleaned.city) cleaned.city = value;
        cleaned.location = value;
        break;
      case 'email':
      case 'email_address':
        cleaned.email = value;
        break;
      case 'phone':
      case 'mobile':
      case 'contact_number':
        cleaned.phone = value;
        break;
      case 'status':
      case 'is_active':
      case 'active':
        // Handle various status formats
        if (typeof value === 'boolean') {
          cleaned.is_active = value;
        } else if (typeof value === 'string') {
          const statusValue = value.toLowerCase();
          cleaned.is_active = statusValue === 'active' || statusValue === 'true' || statusValue === '1' || statusValue === 'yes';
        } else {
          cleaned.is_active = true; // Default to active
        }
        break;
      default:
        // Keep other fields as-is for additional data
        cleaned[lowerKey] = value;
        break;
    }
  });
  
  // Ensure required fields have defaults
  if (!cleaned.partner_name && !cleaned.name) {
    cleaned.partner_name = 'Unknown Partner';
    cleaned.name = 'Unknown Partner';
  }
  
  if (!cleaned.city && !cleaned.location) {
    cleaned.city = 'Unknown City';
    cleaned.location = 'Location not specified';
  }
  
  if (cleaned.is_active === undefined) {
    cleaned.is_active = true;
  }
  
  console.log('🧹 Cleaned partner data:', {
    original: Object.keys(data),
    cleaned: Object.keys(cleaned),
    partner_id: cleaned.partner_id,
    partner_name: cleaned.partner_name,
    city: cleaned.city,
    cooperation_status: cleaned.cooperation_status,
    business_status: cleaned.business_status,
    is_active: cleaned.is_active
  });
  
  return cleaned;
}

/**
 * Validate partner data with specific Excel requirements
 */
export function validatePartnerData(data: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!data.partner_name && !data.name) {
    errors.push('Partner name is required and must be at least 2 characters');
  }
  
  if (!data.partner_id) {
    errors.push('Partner ID is required');
  }
  
  if (!data.city && !data.location) {
    errors.push('City is required');
  }
  
  if (!data.region) {
    errors.push('Region is required');
  }
  
  if (!data.cooperation_status) {
    errors.push('Cooperation status is required');
  }
  
  if (!data.business_status) {
    errors.push('Business status is required');
  }
  
  if (!data.capacity_type) {
    errors.push('Capacity type is required');
  }
  
  if (!data.partner_company_name_en) {
    errors.push('English company name is required');
  }
  
  // Check email formats if provided
  if (data.email && data.email.trim()) {
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid contact email format');
    }
  }
  
  if (data.signer_email && data.signer_email.trim()) {
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(data.signer_email)) {
      errors.push('Invalid signer email format');
    }
  }
  
  if (data.legal_email && data.legal_email.trim()) {
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(data.legal_email)) {
      errors.push('Invalid legal email format');
    }
  }
  
  // Check phone format if provided
  if (data.phone && data.phone.trim()) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}