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
        // 自定义颜色，支持暗黑模式
        'chat-bg': {
          light: '#ffffff',
          dark: '#0f0f0f',
        },
        'chat-surface': {
          light: '#f8f9fa',
          dark: '#1a1a1a',
        },
        'chat-border': {
          light: '#e5e7eb',
          dark: '#374151',
        },
        'chat-text': {
          light: '#111827',
          dark: '#f9fafb',
        },
        'chat-text-secondary': {
          light: '#6b7280',
          dark: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
}
