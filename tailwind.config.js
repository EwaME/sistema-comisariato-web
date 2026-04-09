/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Reemplaza 'sans' para que sea la global por defecto
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        // Si quieres tener la otra disponible también:
        display: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
