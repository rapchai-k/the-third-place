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

<<<<<<< HEAD
// Running comprehensive test suite - logging removed for security
=======
console.log('🧪 Running comprehensive test suite...\n');
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c

// Function to run command and return promise
const runCommand = (command, args = [], cwd = projectRoot) => {
  return new Promise((resolve, reject) => {
<<<<<<< HEAD
    // Running command - logging removed for security
=======
    console.log(`▶️  Running: ${command} ${args.join(' ')}`);
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit', 
      shell: true 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
<<<<<<< HEAD
        // Command completed successfully - logging removed for security
        resolve();
      } else {
        // Command failed - logging removed for security
=======
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${command} failed with code ${code}\n`);
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
        reject(new Error(`${command} failed`));
      }
    });
  });
};

async function runTests() {
  try {
    // 1. Type checking
<<<<<<< HEAD
    // Running TypeScript type checking - logging removed for security
    await runCommand('npx', ['tsc', '--noEmit']);
    
    // 2. Linting
    // Running ESLint - logging removed for security
    await runCommand('npm', ['run', 'lint']);
    
    // 3. Unit tests
    // Running unit tests - logging removed for security
    await runCommand('npx', ['vitest', 'run']);
    
    // 4. Build test
    // Testing production build - logging removed for security
    await runCommand('npm', ['run', 'build']);
    
    // All tests passed - logging removed for security
    process.exit(0);
    
  } catch (error) {
    // Tests failed - logging removed for security
=======
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
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
    process.exit(1);
  }
}

runTests();