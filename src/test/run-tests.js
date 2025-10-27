#!/usr/bin/env node

/**
 * Test Runner Script for The Third Place
 * 
 * This script runs the complete test suite for the application,
 * including unit tests, integration tests, and type checking.
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
<<<<<<< HEAD
    // Running command - logging removed for security
=======
    console.log(chalk.blue(`Running: ${command} ${args.join(' ')}`));
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
};

const main = async () => {
<<<<<<< HEAD
  // Running test suite - logging removed for security

  try {
    // 1. Type checking
    // Type checking - logging removed for security
    await runCommand('npx', ['tsc', '--noEmit']);
    // Type checking passed - logging removed for security

    // 2. Linting
    // Linting - logging removed for security
    await runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx']);
    // Linting passed - logging removed for security

    // 3. Unit Tests
    // Running unit tests - logging removed for security
    await runCommand('npx', ['vitest', 'run', '--reporter=verbose']);
    // Unit tests passed - logging removed for security

    // 4. Test Coverage Report
    // Generating coverage report - logging removed for security
    await runCommand('npx', ['vitest', 'run', '--coverage']);
    // Coverage report generated - logging removed for security

    // All tests passed successfully - logging removed for security
    // Test summary - logging removed for security

  } catch (error) {
    // Test suite failed - logging removed for security
=======
  console.log(chalk.green.bold('🧪 Running The Third Place Test Suite\n'));

  try {
    // 1. Type checking
    console.log(chalk.yellow('📋 1. Type Checking...'));
    await runCommand('npx', ['tsc', '--noEmit']);
    console.log(chalk.green('✅ Type checking passed\n'));

    // 2. Linting
    console.log(chalk.yellow('🔍 2. Linting...'));
    await runCommand('npx', ['eslint', '.', '--ext', '.ts,.tsx']);
    console.log(chalk.green('✅ Linting passed\n'));

    // 3. Unit Tests
    console.log(chalk.yellow('🧪 3. Running Unit Tests...'));
    await runCommand('npx', ['vitest', 'run', '--reporter=verbose']);
    console.log(chalk.green('✅ Unit tests passed\n'));

    // 4. Test Coverage Report
    console.log(chalk.yellow('📊 4. Generating Coverage Report...'));
    await runCommand('npx', ['vitest', 'run', '--coverage']);
    console.log(chalk.green('✅ Coverage report generated\n'));

    console.log(chalk.green.bold('🎉 All tests passed successfully!'));
    console.log(chalk.blue('\n📝 Test Summary:'));
    console.log(chalk.blue('  - Type checking: ✅'));
    console.log(chalk.blue('  - Linting: ✅'));
    console.log(chalk.blue('  - Unit tests: ✅'));
    console.log(chalk.blue('  - Coverage report: ✅'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Test suite failed:'));
    console.error(chalk.red(error.message));
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
<<<<<<< HEAD
  // Test suite interrupted by user - logging removed for security
=======
  console.log(chalk.yellow('\n🛑 Test suite interrupted by user'));
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
  process.exit(0);
});

process.on('SIGTERM', () => {
<<<<<<< HEAD
  // Test suite terminated - logging removed for security
=======
  console.log(chalk.yellow('\n🛑 Test suite terminated'));
>>>>>>> 193db8a94be7a7b5ace78e2adf90eaea66f0146c
  process.exit(0);
});

main();