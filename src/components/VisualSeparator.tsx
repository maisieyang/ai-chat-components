'use client';

import React from 'react';

interface VisualSeparatorProps {
  text?: string;
  className?: string;
}

export function VisualSeparator({ text, className = '' }: VisualSeparatorProps) {
  if (text) {
    return (
      <div className={`flex items-center my-6 ${className}`}>
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="px-4 text-sm text-gray-500 bg-white">{text}</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
    );
  }

  return (
    <hr className={`my-6 border-gray-200 ${className}`} />
  );
}
