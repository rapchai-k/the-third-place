import { useState, useCallback } from 'react';

interface ProgressState {
  isVisible: boolean;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  details?: string;
}

export function useProgressBar() {
  const [progressState, setProgressState] = useState<ProgressState>({
    isVisible: false,
    progress: 0,
    status: 'uploading',
    message: '',
    details: ''
  });

  const showProgress = useCallback((message: string, details?: string) => {
    setProgressState({
      isVisible: true,
      progress: 0,
      status: 'uploading',
      message,
      details
    });
  }, []);

  const updateProgress = useCallback((
    progress: number, 
    status: 'uploading' | 'processing' | 'completed' | 'error' = 'processing',
    message?: string,
    details?: string
  ) => {
    setProgressState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      status,
      ...(message && { message }),
      ...(details !== undefined && { details })
    }));
  }, []);

  const hideProgress = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const completeProgress = useCallback((message: string = 'Processing completed!', details?: string) => {
    setProgressState(prev => ({
      ...prev,
      progress: 100,
      status: 'completed',
      message,
      details
    }));
    
    // Auto-hide after 3 seconds for completed status
    setTimeout(() => {
      hideProgress();
    }, 3000);
  }, [hideProgress]);

  const errorProgress = useCallback((message: string, details?: string) => {
    setProgressState(prev => ({
      ...prev,
      status: 'error',
      message,
      details
    }));
  }, []);

  return {
    progressState,
    showProgress,
    updateProgress,
    hideProgress,
    completeProgress,
    errorProgress
  };
}