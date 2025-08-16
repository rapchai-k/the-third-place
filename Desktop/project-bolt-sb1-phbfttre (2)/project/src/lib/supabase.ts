import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Configuration Check:');
console.log('✅ URL:', supabaseUrl ? 'Connected' : '❌ Missing');
console.log('✅ Anon Key:', supabaseAnonKey ? 'Connected' : '❌ Missing');
console.log('🔑 Service Role Key:', supabaseServiceRoleKey ? 'Connected (Admin features enabled)' : '⚠️ Missing (Admin features disabled)');

// Create main Supabase client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Create admin client for user management (only if service role key is provided)
export const supabaseAdmin = supabaseServiceRoleKey && supabaseServiceRoleKey.length > 100
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (supabaseAdmin) {
  console.log('✅ Admin features enabled - you can create/manage users');
} else {
  console.log('ℹ️ Admin features disabled - add VITE_SUPABASE_SERVICE_ROLE_KEY to enable user management');
}

export type UserRole = 'super_admin' | 'admin' | 'training_person' | 'equipment_person' | 'vendor';
export type UserPermission = 'installation' | 'eligibility' | 'training' | 'equipment';

export interface UploadHistory {
  id: string;
  filename: string;
  total_rows: number;
  riders_created: number;
  riders_updated: number;
  columns_detected: string[];
  upload_status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  uploaded_by: string;
  created_at: string;
  completed_at?: string;
}

export interface RiderUpdate {
  id: string;
  upload_id: string;
  rider_id: string;
  action: 'created' | 'updated' | 'no_change';
  changed_columns: string[];
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  vendor_id?: string;
  permissions?: UserPermission[];
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: string;
  rider_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_upload_id?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  sizes: string[];
  inactive_sizes?: string[];
  current_price: number;
  is_chargeable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EquipmentStockTransactionType = 'inbound' | 'distribution' | 'return' | 'adjustment';

export interface EquipmentStockTransaction {
  id: string;
  equipment_item_id: string;
  item_name?: string;
  size?: string | null;
  transaction_type: EquipmentStockTransactionType;
  quantity: number; // positive increases, negative decreases
  supplier_name?: string | null;
  delivery_date?: string | null; // ISO date (YYYY-MM-DD)
  reference_id?: string | null;
  reference_type?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface EquipmentStockLevel {
  equipment_item_id: string;
  item_name: string;
  size: string; // 'N/A' when null
  stock_count: number;
  first_movement_at: string;
  last_movement_at: string;
}

export interface EquipmentStockWeekly {
  equipment_item_id: string;
  item_name: string;
  size: string;
  week_start: string; // date
  net_movement: number;
}

export interface EquipmentStockMonthly {
  equipment_item_id: string;
  item_name: string;
  size: string;
  month_start: string; // date
  net_movement: number;
}

export interface Training {
  id: string;
  rider_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  trainer_name: string;
  language: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  completion_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BoxInstallation {
  id: string;
  rider_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  completion_date?: string;
  proof_image_url?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentDistribution {
  id: string;
  rider_id: string;
  equipment_items: Array<{
    item_id: string;
    item_name: string;
    size: string;
    quantity: number;
    unit_price: number;
    is_free: boolean;
  }>;
  total_amount: number;
  distribution_date: string;
  status: 'pending' | 'distributed' | 'returned';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

export interface Partner {
  id: string;
  partner_id?: string;
  partner_name?: string;
  name: string;
  partner_city_id?: string;
  city?: string;
  location: string;
  email?: string;
  phone?: string;
  cooperation_status?: string;
  business_status?: string;
  capacity_type?: string;
  parent_partner_id?: string;
  partner_company_name_en?: string;
  brand_name?: string;
  signer_email?: string;
  legal_email?: string;
  manager_mis_ids?: string;
  region?: string;
  is_active: boolean;
  car_target?: number;
  bike_target?: number;
  total_target?: number;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  location: string;
  boxes_per_hour: number;
  max_boxes_per_day: number;
  is_active: boolean;
  can_login: boolean;
  password_hash?: string;
  last_login?: string;
  serviceable_days: string[];
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  timezone: string;
  is_available_weekends: boolean;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorInstallation {
  id: string;
  vendor_id: string;
  rider_id: string;
  installation_date: string;
  installation_time: string;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  proof_image_url?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}