/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pure Blacks & Deep Obisidian
        ink: {
          950: '#000000', // Pure pitch black
          900: '#050505', // Noir 1
          850: '#0A0A0A', // Noir surface elevated
          800: '#121212', // Charcoal dark
          750: '#1A1A1A', // Border dark
          700: '#262626',
          600: '#404040',
        },
        // Clean Whites & Grays for maximum contrast
        cream: {
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#F5F5F5',
          300: '#E5E5E5',
          400: '#A3A3A3',
          500: '#737373',
        },
        // Pure Crimson, Vermillion & Blood Red
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444', // Radiant neon red
          600: '#DC2626', // Pure primary crimson
          700: '#B91C1C', // Deep crimson
          800: '#991B1B', // Dark red
          900: '#7F1D1D', // Dark burgundy
          950: '#450A0A', // Deep blood black-red
        },
        // Aliased gold to red / gray to ensure NO gold appears
        gold: {
          100: '#FFFFFF',
          200: '#F5F5F5',
          300: '#E5E5E5',
          400: '#A3A3A3',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
        },
        terracotta: {
          400: '#F87171',
          500: '#DC2626',
          600: '#B91C1C',
        },
        forest: {
          400: '#A3A3A3',
          500: '#DC2626',
          600: '#B91C1C',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        nepali: ['"Mukta"', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-red': '0 0 25px rgba(220, 38, 38, 0.45)',
        'glow-red-lg': '0 0 45px rgba(220, 38, 38, 0.65)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
