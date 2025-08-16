import React from 'react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface ProgressBarProps {
  isVisible: boolean;
  onHide: () => void;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  details?: string;
}

export function ProgressBar({ 
  isVisible, 
  onHide, 
  progress, 
  status, 
  message, 
  details 
}: ProgressBarProps) {
  if (!isVisible) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Upload className="w-4 h-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      case 'processing':
        return 'bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 border-b ${getBackgroundColor()} shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`text-white ${getStatusColor().replace('bg-', 'text-')}`}>
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{message}</span>
                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {details && (
                <p className="text-xs text-gray-600 mt-1">{details}</p>
              )}
            </div>
          </div>
          <button
            onClick={onHide}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Hide progress bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}