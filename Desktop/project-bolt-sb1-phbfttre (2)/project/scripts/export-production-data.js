#!/usr/bin/env node

/**
 * Export all data for production migration
 * Run with: node scripts/export-production-data.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  console.log('🚀 Starting production data export...');
  
  const exportDir = 'production-export';
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  try {
    // Export riders data
    console.log('📊 Exporting riders data...');
    const { data: riders, error: ridersError } = await supabase
      .from('riders')
      .select('*')
      .order('created_at');

    if (ridersError) throw ridersError;
    
    // Transform riders data for CSV export
    const ridersCSV = riders.map(rider => ({
      rider_id: rider.rider_id,
      ...rider.data,
      created_at: rider.created_at,
      updated_at: rider.updated_at
    }));

    fs.writeFileSync(
      path.join(exportDir, 'riders_export.json'),
      JSON.stringify(ridersCSV, null, 2)
    );
    console.log(`✅ Exported ${riders.length} riders`);

    // Export partners data
    console.log('🏢 Exporting partners data...');
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .order('created_at');

    if (partnersError) throw partnersError;

    fs.writeFileSync(
      path.join(exportDir, 'partners_export.json'),
      JSON.stringify(partners, null, 2)
    );
    console.log(`✅ Exported ${partners.length} partners`);

    // Export vendors data
    console.log('🚛 Exporting vendors data...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at');

    if (vendorsError) throw vendorsError;

    fs.writeFileSync(
      path.join(exportDir, 'vendors_export.json'),
      JSON.stringify(vendors, null, 2)
    );
    console.log(`✅ Exported ${vendors.length} vendors`);

    // Export users data (excluding sensitive fields)
    console.log('👥 Exporting users data...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active, vendor_id, created_at, updated_at')
      .order('created_at');

    if (usersError) throw usersError;

    fs.writeFileSync(
      path.join(exportDir, 'users_export.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Exported ${users.length} users`);

    // Export equipment items
    console.log('📦 Exporting equipment items...');
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment_items')
      .select('*')
      .order('created_at');

    if (equipmentError) throw equipmentError;

    fs.writeFileSync(
      path.join(exportDir, 'equipment_export.json'),
      JSON.stringify(equipment, null, 2)
    );
    console.log(`✅ Exported ${equipment.length} equipment items`);

    // Create summary report
    const summary = {
      export_date: new Date().toISOString(),
      export_summary: {
        riders: riders.length,
        partners: partners.length,
        vendors: vendors.length,
        users: users.length,
        equipment_items: equipment.length
      },
      database_info: {
        source_url: supabaseUrl,
        export_method: 'automated_script'
      }
    };

    fs.writeFileSync(
      path.join(exportDir, 'export_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n🎉 EXPORT COMPLETED SUCCESSFULLY!');
    console.log('📁 Files created in:', exportDir);
    console.log('📊 Export Summary:');
    console.log(`   • ${riders.length} riders`);
    console.log(`   • ${partners.length} partners`);
    console.log(`   • ${vendors.length} vendors`);
    console.log(`   • ${users.length} users`);
    console.log(`   • ${equipment.length} equipment items`);
    console.log('\n📋 Next Steps:');
    console.log('1. Create production Supabase project');
    console.log('2. Update .env with production credentials');
    console.log('3. Run migrations in production');
    console.log('4. Import data using the upload interface');
    console.log('5. Deploy to Netlify');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportData();