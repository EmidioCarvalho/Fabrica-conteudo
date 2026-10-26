/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        ink: { 900: '#0f172a', 800: '#1e293b' },
      },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.05), 0 4px 16px -4px rgba(15,23,42,.08)' },
      keyframes: {
        in: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { in: 'in .25s ease-out' },
    },
  },
  plugins: [],
}
