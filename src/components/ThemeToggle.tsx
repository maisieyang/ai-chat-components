'use client';

import React from 'react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  // 防止服务端渲染不匹配
  if (!mounted) {
    return (
      <div className="flex items-center space-x-1 bg-bg-tertiary rounded-lg p-1">
        <div className="px-3 py-1.5 rounded-md text-base font-medium bg-bg-elevated text-text-primary shadow-sm">
          <span className="mr-1">💻</span>
          系统
        </div>
      </div>
    );
  }

  const themes = [
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'system', label: '系统', icon: '💻' },
  ] as const;

  return (
    <div className="flex items-center space-x-1 bg-bg-tertiary rounded-lg p-1">
      {themes.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`px-3 py-1.5 rounded-md text-base font-medium transition-colors duration-200 ${
            theme === value
              ? 'bg-bg-elevated text-text-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-primary'
          }`}
          title={label}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
