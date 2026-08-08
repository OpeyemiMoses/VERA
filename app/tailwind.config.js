/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vera: {
          cyan: '#00D2FF',
          blue: '#0072FF',
          purple: '#A100F2',
          violet: '#7000FF',
          dark: '#08090D',
          'dark-surface': '#0F111A',
          'dark-card': '#161927',
          'dark-border': '#232738',
        },
        cream: {
          50:  '#fdfbf7',
          100: '#f8f6f0',
          200: '#f1ede3',
          300: '#e5decb',
        },
        forest: {
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
          950: '#011c15',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
    },
  },
  plugins: [],
};
