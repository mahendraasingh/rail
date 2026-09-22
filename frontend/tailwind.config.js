/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rail: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f6',
          500: '#0e8ce4',
          600: '#026fc3',
          700: '#03589e',
          800: '#074b82',
          900: '#0c3f6d',
          950: '#082847',
        },
        navy: {
          800: '#111827',
          900: '#0b0f19',
          950: '#060911',
        },
        /* Warm charcoal ramp (brown undertone) for the dark theme — no blue cast */
        coal: {
          50: '#f5f2ee',
          100: '#e8e2da',
          200: '#cfc5b8',
          300: '#a89b8a',
          400: '#7d6f5f',
          500: '#5c5147',
          600: '#443c34',
          700: '#37302a',
          750: '#2b2620',
          800: '#211d18',
          900: '#181512',
          950: '#12100d',
        },
        berth: {
          lower: '#0284c7',
          middle: '#6366f1',
          upper: '#8b5cf6',
          sideLower: '#0d9488',
          sideUpper: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        elevated: '0 12px 32px -4px rgba(7, 75, 130, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
