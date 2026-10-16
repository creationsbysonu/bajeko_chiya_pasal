/**
 * @type {import('tailwindcss').Config}
 *
 * Every colour that needs to flip between day (light) and night (dark) is
 * expressed as `rgb(var(--c-<name>) / <alpha-value>)` so that *all* utilities
 * built from it — text-white, border-white/10, hover:bg-red-500, group-hover:…
 * — follow the active theme automatically. The actual values live in
 * src/index.css under `:root` (night) and `html.light` (day).
 *
 * `black` is deliberately literal: it is used for photo scrims and modal
 * backdrops that must stay dark in both themes. Solid `bg-black` surfaces are
 * remapped separately in the light layer of src/index.css.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        black: '#000000',

        white: 'rgb(var(--c-white) / <alpha-value>)',

        neutral: {
          50: 'rgb(var(--c-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--c-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--c-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--c-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--c-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--c-neutral-500) / <alpha-value>)',
          600: 'rgb(var(--c-neutral-600) / <alpha-value>)',
          700: 'rgb(var(--c-neutral-700) / <alpha-value>)',
          800: 'rgb(var(--c-neutral-800) / <alpha-value>)',
          900: 'rgb(var(--c-neutral-900) / <alpha-value>)',
          950: 'rgb(var(--c-neutral-950) / <alpha-value>)',
        },

        // Crimson — the brand accent. Night values match the original palette;
        // day values are darkened so red *text* keeps AA contrast on paper.
        red: {
          50: 'rgb(var(--c-red-50) / <alpha-value>)',
          100: 'rgb(var(--c-red-100) / <alpha-value>)',
          200: 'rgb(var(--c-red-200) / <alpha-value>)',
          300: 'rgb(var(--c-red-300) / <alpha-value>)',
          400: 'rgb(var(--c-red-400) / <alpha-value>)',
          500: 'rgb(var(--c-red-500) / <alpha-value>)',
          600: 'rgb(var(--c-red-600) / <alpha-value>)',
          700: 'rgb(var(--c-red-700) / <alpha-value>)',
          800: 'rgb(var(--c-red-800) / <alpha-value>)',
          900: 'rgb(var(--c-red-900) / <alpha-value>)',
          950: 'rgb(var(--c-red-950) / <alpha-value>)',
        },

        amber: {
          300: 'rgb(var(--c-amber-300) / <alpha-value>)',
          400: 'rgb(var(--c-amber-400) / <alpha-value>)',
          500: 'rgb(var(--c-amber-500) / <alpha-value>)',
          950: 'rgb(var(--c-amber-950) / <alpha-value>)',
        },

        // Editorial surfaces / type
        cream: {
          50: 'rgb(var(--c-cream-50) / <alpha-value>)',
          100: 'rgb(var(--c-cream-100) / <alpha-value>)',
          200: 'rgb(var(--c-cream-200) / <alpha-value>)',
          300: 'rgb(var(--c-cream-300) / <alpha-value>)',
          400: 'rgb(var(--c-cream-400) / <alpha-value>)',
          500: 'rgb(var(--c-cream-500) / <alpha-value>)',
        },
        ink: {
          700: 'rgb(var(--c-ink-700) / <alpha-value>)',
          750: 'rgb(var(--c-ink-750) / <alpha-value>)',
          800: 'rgb(var(--c-ink-800) / <alpha-value>)',
          850: 'rgb(var(--c-ink-850) / <alpha-value>)',
          900: 'rgb(var(--c-ink-900) / <alpha-value>)',
          950: 'rgb(var(--c-ink-950) / <alpha-value>)',
        },

        // Kept literal — decorative aliases that must not shift with theme.
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
        'panel': '0 18px 45px -25px rgba(0, 0, 0, 0.55)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'marquee': 'marquee var(--roller-duration, 34s) linear infinite',
        'marquee-rev': 'marquee-rev var(--roller-duration, 34s) linear infinite',
        'eq': 'eq 1.1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        'marquee-rev': {
          '0%': { transform: 'translate3d(-50%, 0, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
