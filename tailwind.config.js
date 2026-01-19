/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        az: {
          black1: "#242B33",
          black2: "#101820",
          green: "#38D430",
          gray: "#EFF0F1"
        }
      },
      borderRadius: {
        xl2: "20px"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16,24,32,.18)",
        card: "0 18px 50px rgba(16,24,32,.14)"
      }
    }
  },
  plugins: []
};
