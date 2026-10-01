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
        gis: {
          bg: '#0b0f19',
          card: '#111827',
          border: '#1f293d',
          accent: '#3b82f6',
          fire: {
            low: '#22c55e',
            med: '#f59e0b',
            high: '#ef4444'
          }
        }
      }
    },
  },
  plugins: [],
}
