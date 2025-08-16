import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle } from 'lucide-react';

interface SafeComponentProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

export function SafeComponent({ children, componentName, fallback }: SafeComponentProps) {
  const defaultFallback = (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <h3 className="font-medium text-red-800">Component Error</h3>
          <p className="text-sm text-red-600">
            The {componentName} component encountered an error and has been safely isolated.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
}