// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Chef's Diary Design Tokens ────────────────────────────
      colors: {
        parchment: {
          50:  '#fdfaf4',
          100: '#f9f2e3',
          200: '#f2e4c4',
          DEFAULT: '#f5ede0',
        },
        terracotta: {
          light:   '#e8957a',
          DEFAULT: '#c1614f',
          dark:    '#9a3d2e',
        },
        saffron: {
          light:   '#f5c96a',
          DEFAULT: '#e6a817',
          dark:    '#b07c00',
        },
        ink: {
          light:   '#5c4f3a',
          DEFAULT: '#2c1f0e',
          muted:   '#7a6a54',
        },
        sage: {
          light:  '#d4e4d0',
          DEFAULT:'#7a9e72',
          dark:   '#4a6e42',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(44, 31, 14, 0.08)',
        'warm':    '0 4px 20px rgba(44, 31, 14, 0.12)',
        'warm-lg': '0 8px 40px rgba(44, 31, 14, 0.18)',
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};