'use client';

import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';

type ThemeOption = {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: '🌞' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '🖥' },
];

export function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();

  const currentTheme = useMemo(() => {
    if (!mounted) {
      return 'system';
    }
    return theme;
  }, [mounted, theme]);

  return (
    <label className="flex items-center space-x-2 text-sm text-text-tertiary">
      <span>主题</span>
      <select
        value={currentTheme}
        onChange={(event) => setTheme(event.target.value as ThemeOption['value'])}
        disabled={!mounted}
        className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {`${option.icon} ${option.label}`}
          </option>
        ))}
      </select>
    </label>
  );
}
