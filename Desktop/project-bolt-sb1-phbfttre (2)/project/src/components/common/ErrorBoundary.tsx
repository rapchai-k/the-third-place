import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 CRASH PREVENTION: Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log detailed error information for debugging
    console.group('🔍 Error Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isContextError = this.state.error?.message.includes('must be used within');
      const isAuthError = this.state.error?.message.includes('useAuth');
      const isProjectError = this.state.error?.message.includes('useProject');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
              🚨 Application Error
            </h1>
            
            <p className="text-gray-600 text-center mb-4">
              Something went wrong. Don't worry, we can fix this!
            </p>

            {/* Context-specific error messages */}
            {isContextError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-yellow-800 mb-2">
                  🔧 Context Provider Missing
                </h3>
                {isAuthError && (
                  <p className="text-sm text-yellow-700">
                    The AuthProvider is missing. This usually happens when the app structure is modified incorrectly.
                  </p>
                )}
                {isProjectError && (
                  <p className="text-sm text-yellow-700">
                    The ProjectProvider is missing. This usually happens when the app structure is modified incorrectly.
                  </p>
                )}
              </div>
            )}

            {/* Error details for developers */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                🔍 Technical Details (for developers)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
                <div className="mb-2">
                  <strong>Error:</strong> {this.state.error?.message}
                </div>
                {this.state.error?.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            </div>

            {/* Prevention tips */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 text-sm mb-1">
                💡 Prevention Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Always keep AuthProvider and ProjectProvider in App.tsx</li>
                <li>• Don't modify the provider structure without checking dependencies</li>
                <li>• Test the app after making changes to context providers</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}