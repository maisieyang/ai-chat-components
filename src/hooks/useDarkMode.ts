'use client';

import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 检测初始主题
    const checkTheme = () => {
      const isDark = 
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setIsDarkMode(isDark);
      setIsLoaded(true);
    };

    checkTheme();

    // 监听主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const isDark = 
        document.documentElement.classList.contains('dark') ||
        mediaQuery.matches;
      setIsDarkMode(isDark);
    };

    mediaQuery.addEventListener('change', handleChange);

    // 监听DOM类名变化（手动切换主题）
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  return { isDarkMode, isLoaded };
}
