'use client';

import React, { ReactNode, useEffect, useState, useCallback } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack?: string; errorBoundary?: string }) => void;
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 重置错误状态
  const resetError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  // 处理错误
  const handleError = useCallback((error: Error, errorInfo: { componentStack?: string; errorBoundary?: string }) => {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    setHasError(true);
    setError(error);
    onError?.(error, errorInfo);
  }, [onError]);

  // 使用 useEffect 来捕获错误
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(new Error(event.message), {
        componentStack: event.filename,
        errorBoundary: 'ErrorBoundary'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          componentStack: 'Promise rejection',
          errorBoundary: 'ErrorBoundary'
        }
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  // 如果有错误，显示错误界面
  if (hasError) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
