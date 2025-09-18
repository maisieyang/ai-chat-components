'use client';

import React from 'react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  isVisible: boolean;
  className?: string;
}

export function ScrollToBottomButton({ 
  onClick, 
  isVisible, 
  className = '' 
}: ScrollToBottomButtonProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 z-10 ${className}`}
      title="Scroll to bottom"
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 14l-7 7m0 0l-7-7m7 7V3" 
        />
      </svg>
    </button>
  );
}
