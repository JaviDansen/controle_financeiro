/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sand: '#E1DBCB',
        surface: '#ECE7DC',
        'surface-light': '#FBFAF6',
        'surface-muted': '#DDD7C8',
        'surface-deep': '#D6CFBE',
        ink: '#15151A',
        'ink-secondary': '#3B3B43',
        'ink-muted': '#8B8B92',
        'ink-dark': '#151515',
        green: '#3F8C5C',
        dark: '#2A2A33',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'System'],
      },
      letterSpacing: {
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
}
