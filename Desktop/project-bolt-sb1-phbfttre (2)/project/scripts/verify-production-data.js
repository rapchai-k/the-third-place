#!/usr/bin/env node

/**
 * Verify production data integrity after migration
 * Run with: node scripts/verify-production-data.js
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProductionData() {
  console.log('🔍 Starting production data verification...');
  console.log('🌐 Environment:', supabaseUrl.includes('localhost') ? 'Development' : 'Production');
  
  const results = {
    tables: {},
    issues: [],
    summary: {}
  };

  try {
    // Check riders table
    console.log('\n📊 Checking riders table...');
    const { data: riders, error: ridersError, count: ridersCount } = await supabase
      .from('riders')
      .select('*', { count: 'exact' })
      .limit(1);

    if (ridersError) {
      results.issues.push(`Riders table error: ${ridersError.message}`);
    } else {
      results.tables.riders = {
        count: ridersCount,
        sample: riders[0] || null,
        hasData: ridersCount > 0
      };
      console.log(`✅ Riders: ${ridersCount} records`);
    }

    // Check partners table
    console.log('🏢 Checking partners table...');
    const { data: partners, error: partnersError, count: partnersCount } = await supabase
      .from('partners')
      .select('*', { count: 'exact' })
      .limit(1);

    if (partnersError) {
      results.issues.push(`Partners table error: ${partnersError.message}`);
    } else {
      results.tables.partners = {
        count: partnersCount,
        sample: partners[0] || null,
        hasData: partnersCount > 0
      };
      console.log(`✅ Partners: ${partnersCount} records`);
    }

    // Check vendors table
    console.log('🚛 Checking vendors table...');
    const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .limit(1);

    if (vendorsError) {
      results.issues.push(`Vendors table error: ${vendorsError.message}`);
    } else {
      results.tables.vendors = {
        count: vendorsCount,
        sample: vendors[0] || null,
        hasData: vendorsCount > 0
      };
      console.log(`✅ Vendors: ${vendorsCount} records`);
    }

    // Check users table
    console.log('👥 Checking users table...');
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);

    if (usersError) {
      results.issues.push(`Users table error: ${usersError.message}`);
    } else {
      results.tables.users = {
        count: usersCount,
        sample: users[0] || null,
        hasData: usersCount > 0
      };
      console.log(`✅ Users: ${usersCount} records`);
    }

    // Check equipment_items table
    console.log('📦 Checking equipment_items table...');
    const { data: equipment, error: equipmentError, count: equipmentCount } = await supabase
      .from('equipment_items')
      .select('*', { count: 'exact' })
      .limit(1);

    if (equipmentError) {
      results.issues.push(`Equipment table error: ${equipmentError.message}`);
    } else {
      results.tables.equipment_items = {
        count: equipmentCount,
        sample: equipment[0] || null,
        hasData: equipmentCount > 0
      };
      console.log(`✅ Equipment Items: ${equipmentCount} records`);
    }

    // Check data integrity
    console.log('\n🔍 Checking data integrity...');
    
    // Check for riders with scheduled/completed status
    if (results.tables.riders?.hasData) {
      const { data: scheduledTrainings } = await supabase
        .from('riders')
        .select('rider_id, data')
        .contains('data', { training_status: 'Scheduled' });

      const { data: completedTrainings } = await supabase
        .from('riders')
        .select('rider_id, data')
        .contains('data', { training_status: 'Completed' });

      const { data: scheduledInstallations } = await supabase
        .from('riders')
        .select('rider_id, data')
        .contains('data', { box_installation: 'Scheduled' });

      const { data: completedInstallations } = await supabase
        .from('riders')
        .select('rider_id, data')
        .contains('data', { box_installation: 'Completed' });

      results.summary = {
        scheduled_trainings: scheduledTrainings?.length || 0,
        completed_trainings: completedTrainings?.length || 0,
        scheduled_installations: scheduledInstallations?.length || 0,
        completed_installations: completedInstallations?.length || 0
      };

      console.log(`📚 Scheduled Trainings: ${results.summary.scheduled_trainings}`);
      console.log(`✅ Completed Trainings: ${results.summary.completed_trainings}`);
      console.log(`📦 Scheduled Installations: ${results.summary.scheduled_installations}`);
      console.log(`✅ Completed Installations: ${results.summary.completed_installations}`);
    }

    // Generate verification report
    const reportPath = 'production-export/verification_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log('\n🎉 VERIFICATION COMPLETED!');
    console.log('📄 Report saved to:', reportPath);

    if (results.issues.length > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      results.issues.forEach(issue => console.log(`   • ${issue}`));
    } else {
      console.log('\n✅ NO ISSUES FOUND - Production ready!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyProductionData();