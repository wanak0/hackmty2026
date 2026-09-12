/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banorte: {
          red: '#EB0029',
          darkRed: '#BA0020',
          lightRed: '#FFF0F2',
          redGlow: 'rgba(235, 0, 41, 0.15)',
          bg: '#F2F4F8',
          card: '#FFFFFF',
          surface: '#F8F9FB',
          input: '#F3F4F6',
          border: '#E5E7EB',
          borderLight: '#F3F4F6',
          gold: '#D97706',
          gray: '#6B7280',
          textDark: '#1E242D',
          textMuted: '#6B7280',
        }
      },
      boxShadow: {
        'banorte-card': '0 2px 12px -2px rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'banorte-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'banorte-red': '0 4px 14px 0 rgba(235, 0, 41, 0.35)',
        'banorte-phone': '0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 12px #1E242D, 0 0 0 14px #4B5563',
      }
    },
  },
  plugins: [],
}
