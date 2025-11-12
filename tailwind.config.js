/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '70': '280px',
      },
      colors: {
        'brand': {
          gold: '#FFD700',
          'gold-light': '#FFE44D',
          'gold-dark': '#D4AF37',
          black: '#1a1a1a',
          'gray-dark': '#2d2d2d',
          'gray': '#4a4a4a',
          'gray-light': '#6b6b6b',
        },
      },
    },
  },
  plugins: [],
};
