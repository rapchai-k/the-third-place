/**
 * 🚨 CRASH PREVENTION: Context Validator
 * 
 * This utility helps validate that all required context providers are present
 * before components try to use them.
 */

import { useContext } from 'react';
import { AuthContext } from '../hooks/useAuth';

export interface ContextValidationResult {
  isValid: boolean;
  missingProviders: string[];
  errors: string[];
}

/**
 * Validates that all required context providers are available
 */
export function validateContextProviders(): ContextValidationResult {
  const result: ContextValidationResult = {
    isValid: true,
    missingProviders: [],
    errors: []
  };

  try {
    // Check AuthContext
    const authContext = useContext(AuthContext);
    if (!authContext) {
      result.isValid = false;
      result.missingProviders.push('AuthProvider');
      result.errors.push('AuthProvider is missing. Components using useAuth() will crash.');
    }
  } catch (error) {
    result.isValid = false;
    result.missingProviders.push('AuthProvider');
    result.errors.push('AuthProvider validation failed: ' + (error as Error).message);
  }


  return result;
}

/**
 * Hook to safely check if contexts are available
 */
export function useContextValidation() {
  try {
    return validateContextProviders();
  } catch (error) {
    return {
      isValid: false,
      missingProviders: ['Unknown'],
      errors: ['Context validation failed: ' + (error as Error).message]
    };
  }
}

/**
 * Component dependency mapping for documentation
 */
export const COMPONENT_DEPENDENCIES = {
  AuthProvider: [
    'Sidebar',
    'Header', 
    'QuickActions',
    'LoginForm',
    'Dashboard',
    'Users',
    'Reports',
    'Equipment',
    'Training',
    'Installation'
  ]
} as const;

/**
 * Logs component dependencies for debugging
 */
export function logComponentDependencies() {
  console.group('🔍 Component Dependencies');
  Object.entries(COMPONENT_DEPENDENCIES).forEach(([provider, components]) => {
    console.log(`${provider} required by:`, components);
  });
  console.groupEnd();
}