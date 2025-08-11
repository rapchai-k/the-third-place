/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/test/**/*.test.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      'src/test/e2e/**',
      'src/test/fixtures/**',
      'src/test/utils/**'
    ],

    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },

    // Test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'dist/',
        '**/*.config.{js,ts}',
        'src/components/ui/**', // Exclude shadcn/ui components from coverage
      ],

      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Higher thresholds for critical components
        'src/contexts/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/hooks/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/lib/**': {
          branches: 95,
          functions: 100,
          lines: 95,
          statements: 95
        }
      }
    },

    // Reporters
    reporter: process.env.CI ? ['junit', 'github-actions'] : ['verbose'],
    outputFile: {
      junit: './test-results/junit.xml'
    },

    // Watch mode configuration
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-results/**'
    ],

    // Retry configuration for flaky tests
    retry: process.env.CI ? 2 : 0,

    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})