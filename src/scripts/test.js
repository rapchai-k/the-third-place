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

// Running comprehensive test suite - logging removed for security

// Function to run command and return promise
const runCommand = (command, args = [], cwd = projectRoot) => {
  return new Promise((resolve, reject) => {
    // Running command - logging removed for security
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit', 
      shell: true 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        // Command completed successfully - logging removed for security
        resolve();
      } else {
        // Command failed - logging removed for security
        reject(new Error(`${command} failed`));
      }
    });
  });
};

async function runTests() {
  try {
    // 1. Type checking
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
    process.exit(1);
  }
}

runTests();