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
          darkRed: '#B3001F',
          dark: '#0f0f11',
          card: '#18181b',
          border: '#27272a',
          gray: '#71717a',
          lightGray: '#f4f4f5'
        }
      }
    },
  },
  plugins: [],
}
