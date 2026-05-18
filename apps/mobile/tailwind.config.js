/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        finapp: {
          bg: '#ECE7DC',
          surface: '#FBFAF6',
          ink: '#15151A',
          ink2: '#3B3B43',
          muted: '#8B8B92',
          hairline: 'rgba(21,21,26,0.10)',
          accent: '#3D8B4E',
          'accent-soft': '#DDF0E4',
          'accent-ink': '#1E5229',
          pos: '#3D8B4E',
          neg: '#B85732',
          'neg-soft': '#F7E8E0',
        },
      },
    },
  },
  plugins: [],
};