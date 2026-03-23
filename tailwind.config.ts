import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fd',
          300: '#a5bbfc',
          400: '#8196f8',
          500: '#6272f1',
          600: '#4f57e4',
          700: '#4145ca',
          800: '#363aa3',
          900: '#303581',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
