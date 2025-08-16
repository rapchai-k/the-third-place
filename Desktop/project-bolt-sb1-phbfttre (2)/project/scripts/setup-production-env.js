#!/usr/bin/env node

/**
 * Interactive production environment setup
 * Run with: node scripts/setup-production-env.js
 */

import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProductionEnv() {
  console.log('🚀 RiderFlow Production Environment Setup');
  console.log('==========================================\n');

  try {
    console.log('📋 Please provide your production Supabase credentials:\n');

    const projectUrl = await question('🌐 Project URL (https://your-project-id.supabase.co): ');
    const anonKey = await question('🔑 Anon/Public Key (starts with eyJ, 100+ chars): ');
    const serviceKey = await question('🔐 Service Role Key (starts with eyJ, 100+ chars): ');

    // Validate inputs
    const validations = [];
    
    if (!projectUrl.startsWith('https://') || !projectUrl.includes('.supabase.co')) {
      validations.push('❌ Project URL should be in format: https://your-project-id.supabase.co');
    }
    
    if (!anonKey.startsWith('eyJ') || anonKey.length < 100) {
      validations.push('❌ Anon key should start with "eyJ" and be 100+ characters');
    }
    
    if (!serviceKey.startsWith('eyJ') || serviceKey.length < 100) {
      validations.push('❌ Service role key should start with "eyJ" and be 100+ characters');
    }

    if (validations.length > 0) {
      console.log('\n⚠️ VALIDATION ERRORS:');
      validations.forEach(error => console.log(error));
      console.log('\nPlease check your credentials and try again.');
      rl.close();
      return;
    }

    // Create production .env
    const envContent = `# Production Environment Variables
# Generated on ${new Date().toISOString()}

VITE_SUPABASE_URL=${projectUrl}
VITE_SUPABASE_ANON_KEY=${anonKey}
VITE_SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
`;

    // Backup existing .env
    if (fs.existsSync('.env')) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync('.env', `.env.backup.${timestamp}`);
      console.log('📄 Backed up existing .env file');
    }

    // Write new .env
    fs.writeFileSync('.env', envContent);

    console.log('\n✅ PRODUCTION ENVIRONMENT CONFIGURED!');
    console.log('📁 .env file updated with production credentials');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart the development server: npm run dev');
    console.log('2. Verify connection to production database');
    console.log('3. Import your data using the upload interface');
    console.log('4. Create admin users');
    console.log('5. Deploy to Netlify');

    console.log('\n🔧 Verification Commands:');
    console.log('• Test data export: node scripts/export-production-data.js');
    console.log('• Verify data integrity: node scripts/verify-production-data.js');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
  }
}

setupProductionEnv();