'use client';

import React from 'react';

interface SendButtonProps {
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function SendButton({ isLoading, disabled, onClick }: SendButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-interactive-primary text-text-inverted hover:bg-interactive-primary-hover disabled:bg-bg-tertiary disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
    >
      {isLoading ? (
        // 发送中状态 - 停止/暂停图标
        <svg 
          className="w-5 h-5" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      ) : (
        // 正常状态 - 发送箭头图标
        <svg 
          className="w-5 h-5 transition-transform duration-200 hover:translate-x-0.5" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 19l7-7-7-7m-7 7h14"
          />
        </svg>
      )}
    </button>
  );
}
