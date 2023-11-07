/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        logo: 'Lexend',
        sans: 'Inter',
        mono: 'Courier New',
      },
      colors: {
        beige: {
          DEFAULT: '#fff7e2',
        },
      },
      boxShadow: {
        hard: '4px 4px 0px 0px rgba(0, 0, 0, 1)', // base size
        'hard-sm': '1px 1px 0px 0px rgba(0, 0, 0, 1)', // small size
        'hard-md': '3px 3px 0px 0px rgba(0, 0, 0, 1)', // medium size
        'hard-lg': '5px 5px 0px 0px rgba(0, 0, 0, 1)', // large size
      },
    },
  },
  plugins: [],
};
