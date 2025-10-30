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
    // Running command - logging removed for security

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
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  // Test suite interrupted by user - logging removed for security
  process.exit(0);
});

process.on('SIGTERM', () => {
  // Test suite terminated - logging removed for security
  process.exit(0);
});

main();