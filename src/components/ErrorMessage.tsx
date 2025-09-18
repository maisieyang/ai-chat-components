'use client';

import React from 'react';

interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  onDismiss, 
  retryCount = 0, 
  maxRetries = 3 
}: ErrorMessageProps) {
  if (!error) return null;

  const canRetry = retryCount < maxRetries;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error occurred
          </h3>
          <p className="text-sm text-red-600 mb-2">
            {error}
          </p>
          {retryCount > 0 && (
            <p className="text-xs text-red-500">
              Retry attempt: {retryCount}/{maxRetries}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-2">
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
