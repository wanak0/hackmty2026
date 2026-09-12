/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'Montserrat', 'system-ui', 'sans-serif'],
        display: ['Montserrat', '"Source Sans 3"', 'sans-serif'],
      },
      colors: {
        banorte: {
          red: '#E30613',
          darkRed: '#C10510',
          lightRed: '#FFF0F1',
          redGlow: 'rgba(227, 6, 19, 0.15)',
          bg: '#F5F5F5',
          card: '#FFFFFF',
          surface: '#FAFAFA',
          input: '#F3F4F6',
          border: '#E6E6E6',
          borderLight: '#F0F0F0',
          gold: '#D97706',
          gray: '#6B6B6B',
          textDark: '#1A1A1A',
          textMuted: '#6B6B6B',
        }
      },
      boxShadow: {
        'banorte-card': '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'banorte-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'banorte-red': '0 2px 8px 0 rgba(227, 6, 19, 0.28)',
        'banorte-phone': '0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 12px #1A1A1A, 0 0 0 14px #4B5563',
      }
    },
  },
  plugins: [],
}
