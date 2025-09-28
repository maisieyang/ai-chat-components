/* eslint-disable @typescript-eslint/no-require-imports */
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
        // ChatGPT风格颜色系统
        'bg-primary': 'var(--main-surface-primary)',
        'bg-secondary': 'var(--main-surface-secondary)',
        'bg-tertiary': 'var(--main-surface-tertiary)',
        'bg-elevated': 'var(--main-surface-primary)',
        'bg-overlay': 'rgba(0, 0, 0, 0.5)',
        
        // 文字颜色系统
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-inverted': 'var(--text-primary-inverse)',
        'text-disabled': 'var(--text-quaternary)',
        
        // 边框颜色系统
        'border-default': 'var(--border-light)',
        'border-light': 'var(--border-xlight)',
        'border-heavy': 'var(--border-medium)',
        'border-focus': 'var(--default-theme-entity-accent)',
        
        // 交互颜色系统
        'interactive-primary': 'var(--default-theme-submit-btn-bg)',
        'interactive-primary-hover': 'var(--default-theme-submit-btn-bg)',
        'interactive-primary-active': 'var(--default-theme-submit-btn-bg)',
        'interactive-secondary': 'var(--default-theme-secondary-btn-bg)',
        'interactive-secondary-hover': 'var(--default-theme-secondary-btn-bg)',
        
        // 状态颜色系统
        'accent': 'var(--default-theme-entity-accent)',
        'accent-hover': 'var(--link-hover)',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': 'var(--text-error)',
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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch', // 最佳阅读宽度
            lineHeight: '1.75', // 舒适的行高
            color: 'var(--text-primary)',
            fontSize: '1rem',
            '--tw-prose-body': 'var(--text-primary)',
            '--tw-prose-headings': 'var(--text-primary)',
            '--tw-prose-lead': 'var(--text-secondary)',
            '--tw-prose-links': 'var(--default-theme-entity-accent)',
            '--tw-prose-bold': 'var(--text-primary)',
            '--tw-prose-counters': 'var(--text-secondary)',
            '--tw-prose-bullets': 'var(--text-secondary)',
            '--tw-prose-hr': 'var(--border-light)',
            '--tw-prose-quotes': 'var(--text-primary)',
            '--tw-prose-quote-borders': 'var(--border-light)',
            '--tw-prose-captions': 'var(--text-secondary)',
            '--tw-prose-code': 'var(--text-primary)',
            '--tw-prose-pre-code': 'var(--text-primary)',
            '--tw-prose-pre-bg': 'var(--main-surface-tertiary)',
            '--tw-prose-th-borders': 'var(--border-light)',
            '--tw-prose-td-borders': 'var(--border-light)',
            h1: {
              fontSize: '2.25rem',
              fontWeight: '700',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.2',
            },
            h2: {
              fontSize: '1.875rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
              lineHeight: '1.3',
            },
            h3: {
              fontSize: '1.5rem',
              fontWeight: '600',
              marginTop: '1.25rem',
              marginBottom: '0.5rem',
              lineHeight: '1.4',
            },
            h4: {
              fontSize: '1.25rem',
              fontWeight: '600',
              marginTop: '1rem',
              marginBottom: '0.5rem',
              lineHeight: '1.4',
            },
            p: {
              marginTop: '0',
              marginBottom: '1.25rem',
              lineHeight: '1.75',
            },
            ul: {
              marginTop: '0',
              marginBottom: '1.25rem',
              paddingLeft: '1.5rem',
            },
            ol: {
              marginTop: '0',
              marginBottom: '1.25rem',
              paddingLeft: '1.5rem',
            },
            li: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            blockquote: {
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              paddingLeft: '1rem',
              borderLeftWidth: '4px',
              borderLeftColor: 'var(--default-theme-entity-accent)',
              backgroundColor: 'var(--main-surface-secondary)',
              padding: '1rem',
              borderRadius: '0.5rem',
            },
            code: {
              backgroundColor: 'var(--main-surface-tertiary)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: '1px solid var(--border-light)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'var(--main-surface-tertiary)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
              overflow: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              borderRadius: '0',
              border: 'none',
            },
            table: {
              width: '100%',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              borderCollapse: 'collapse',
            },
            th: {
              backgroundColor: 'var(--main-surface-secondary)',
              padding: '0.75rem',
              textAlign: 'left',
              fontWeight: '600',
              borderBottom: '1px solid var(--border-light)',
            },
            td: {
              padding: '0.75rem',
              borderBottom: '1px solid var(--border-light)',
            },
            hr: {
              marginTop: '2rem',
              marginBottom: '2rem',
              borderTop: '1px solid var(--border-light)',
            },
          },
        },
        // 暗色主题变体
        invert: {
          css: {
            color: 'var(--text-primary)',
            '--tw-prose-body': 'var(--text-primary)',
            '--tw-prose-headings': 'var(--text-primary)',
            '--tw-prose-lead': 'var(--text-secondary)',
            '--tw-prose-links': 'var(--default-theme-entity-accent)',
            '--tw-prose-bold': 'var(--text-primary)',
            '--tw-prose-counters': 'var(--text-secondary)',
            '--tw-prose-bullets': 'var(--text-secondary)',
            '--tw-prose-hr': 'var(--border-light)',
            '--tw-prose-quotes': 'var(--text-primary)',
            '--tw-prose-quote-borders': 'var(--border-light)',
            '--tw-prose-captions': 'var(--text-secondary)',
            '--tw-prose-code': 'var(--text-primary)',
            '--tw-prose-pre-code': 'var(--text-primary)',
            '--tw-prose-pre-bg': 'var(--main-surface-tertiary)',
            '--tw-prose-th-borders': 'var(--border-light)',
            '--tw-prose-td-borders': 'var(--border-light)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
