'use client';

import React from 'react';

interface CalloutBoxProps {
  type: 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function CalloutBox({ type, children, className = '' }: CalloutBoxProps) {
  const getStyles = () => {
    switch (type) {
      case 'info':
        return {
          container: 'bg-blue-50 border-l-4 border-blue-400 text-blue-800',
          icon: '🔵'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800',
          icon: '⚠️'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-l-4 border-green-400 text-green-800',
          icon: '✅'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-l-4 border-red-400 text-red-800',
          icon: '❌'
        };
      default:
        return {
          container: 'bg-gray-50 border-l-4 border-gray-400 text-gray-800',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`p-4 my-4 rounded-r-lg ${styles.container} ${className}`}>
      <div className="flex items-start">
        <span className="text-lg mr-2 flex-shrink-0">{styles.icon}</span>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
