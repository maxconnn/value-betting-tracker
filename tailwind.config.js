/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f4efe6',
        ink: '#14213d',
        accent: '#cb7c30',
        mint: '#0f766e',
        rose: '#b91c1c',
        amber: '#b45309',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(20, 33, 61, 0.12)',
      },
    },
  },
  plugins: [],
};
