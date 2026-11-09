/** @type {import('tailwindcss').Config} */
const brandShade = (shade) => `rgb(var(--brand-${shade}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          50: brandShade(50),
          100: brandShade(100),
          200: brandShade(200),
          300: brandShade(300),
          400: brandShade(400),
          500: brandShade(500),
          600: brandShade(600),
          700: brandShade(700),
          800: brandShade(800),
          900: brandShade(900),
        },
      },
    },
  },
  plugins: [],
};
