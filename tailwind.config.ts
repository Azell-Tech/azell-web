/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azell: {
          black1: '#242B33',
          black2: '#101820',
          green: '#38D430',
          gray: '#EFF0F1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
