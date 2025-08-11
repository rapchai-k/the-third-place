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
    console.log(chalk.blue(`Running: ${command} ${args.join(' ')}`));
    
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
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Test suite interrupted by user'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Test suite terminated'));
  process.exit(0);
});

main();