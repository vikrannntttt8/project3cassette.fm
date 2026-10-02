/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0e0e',
        surface: {
          DEFAULT: '#18181a',
          dim: '#0e0e0e',
          bright: '#28282b',
          card: '#18181a',
          elevated: '#222225',
          high: '#2a2a2e',
        },
        'on-surface': '#f3f3f5',
        'on-surface-variant': '#a1a1aa',
        primary: {
          DEFAULT: '#f59e0b',
          container: '#b45309',
        },
        accent: {
          DEFAULT: '#ffffff',
          amber: '#f59e0b',
        },
        brand: {
          amber: '#f59e0b',
          charcoal: '#18181a',
          card: '#18181a',
          elevated: '#222225',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
