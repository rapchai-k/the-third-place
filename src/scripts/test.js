#!/usr/bin/env node
/**
 * Test script for running all tests and validating the build
 * This ensures all functionality works before committing changes
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

console.log('🧪 Running comprehensive test suite...\n');

// Function to run command and return promise
const runCommand = (command, args = [], cwd = projectRoot) => {
  return new Promise((resolve, reject) => {
    console.log(`▶️  Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit', 
      shell: true 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${command} failed with code ${code}\n`);
        reject(new Error(`${command} failed`));
      }
    });
  });
};

async function runTests() {
  try {
    // 1. Type checking
    console.log('1️⃣ Running TypeScript type checking...');
    await runCommand('npx', ['tsc', '--noEmit']);
    
    // 2. Linting
    console.log('2️⃣ Running ESLint...');
    await runCommand('npm', ['run', 'lint']);
    
    // 3. Unit tests
    console.log('3️⃣ Running unit tests...');
    await runCommand('npx', ['vitest', 'run']);
    
    // 4. Build test
    console.log('4️⃣ Testing production build...');
    await runCommand('npm', ['run', 'build']);
    
    console.log('🎉 All tests passed! Ready to commit.');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Tests failed:', error.message);
    console.log('\n❌ Please fix the issues before committing.');
    process.exit(1);
  }
}

runTests();