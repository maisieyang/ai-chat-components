/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 基础颜色系统
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-overlay': 'var(--color-bg-overlay)',
        
        // 文字颜色系统
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverted': 'var(--color-text-inverted)',
        'text-disabled': 'var(--color-text-disabled)',
        
        // 边框颜色系统
        'border-default': 'var(--color-border-default)',
        'border-light': 'var(--color-border-light)',
        'border-heavy': 'var(--color-border-heavy)',
        'border-focus': 'var(--color-border-focus)',
        
        // 交互颜色系统
        'interactive-primary': 'var(--color-interactive-primary)',
        'interactive-primary-hover': 'var(--color-interactive-primary-hover)',
        'interactive-primary-active': 'var(--color-interactive-primary-active)',
        'interactive-secondary': 'var(--color-interactive-secondary)',
        'interactive-secondary-hover': 'var(--color-interactive-secondary-hover)',
        
        // 状态颜色系统
        'accent': 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'error': 'var(--color-error)',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
        'slow': 'var(--transition-slow)',
      },
    },
  },
  plugins: [],
}
