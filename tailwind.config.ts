import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brux: {
          navy: '#0a1628',
          blue: '#1a3a5c',
          accent: '#2d7dd2',
          light: '#e8f0fe',
          gray: '#6b7b8d',
          bg: '#f4f7fa',
          line: '#d1dbe6',
          white: '#ffffff',
          success: '#10b981',
          warn: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Noto Sans JP"', 'sans-serif'],
        body: ['"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
