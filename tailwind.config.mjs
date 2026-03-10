/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f6',
          100: '#d5f0e8',
          200: '#aee0d1',
          300: '#7ac9b5',
          400: '#4aab95',
          500: '#2d8f7b',
          600: '#1f6f5f',
          700: '#1a5c4e',
          800: '#174a3f',
          900: '#143d35',
        },
        gold: {
          50: '#fdf9ef',
          100: '#faf0d5',
          200: '#f4dfaa',
          300: '#ecc974',
          400: '#e3ae45',
          500: '#d9982d',
          600: '#c17a22',
          700: '#a05c1e',
          800: '#834a1f',
          900: '#6c3e1d',
        }
      }
    },
  },
  plugins: [],
}
