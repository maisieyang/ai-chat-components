'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export function ThemeTest() {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();
  const [htmlClass, setHtmlClass] = useState('');

  useEffect(() => {
    if (mounted) {
      setHtmlClass(document.documentElement.className);
    }
  }, [mounted, resolvedTheme]);

  if (!mounted) {
    return <div>加载中...</div>;
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">主题调试信息</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">当前主题:</span> 
          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
            {theme}
          </span>
        </div>
        
        <div>
          <span className="font-medium">解析主题:</span> 
          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-800 dark:text-green-200">
            {resolvedTheme}
          </span>
        </div>
        
        <div>
          <span className="font-medium">HTML类名:</span> 
          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs">
            {htmlClass}
          </span>
        </div>
        
        <div>
          <span className="font-medium">系统偏好:</span> 
          <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-purple-800 dark:text-purple-200">
            {typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => setTheme('light')}
          className={`px-3 py-1 rounded text-sm ${
            theme === 'light' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          浅色
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-3 py-1 rounded text-sm ${
            theme === 'dark' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          深色
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-1 rounded text-sm ${
            theme === 'system' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          系统
        </button>
      </div>
    </div>
  );
}
