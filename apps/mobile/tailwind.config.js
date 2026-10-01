/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0e0e0e',
        surface: '#161616',
        'surface-elevated': '#1c1c1e',
        accent: 'var(--accent-color, #ffffff)',
      },
    },
  },
  plugins: [],
};
