/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — SM Black (logo shield background)
        brand: {
          50:  "#fefce8",   // light yellow tint — hover / selected bg
          100: "#fef9c3",
          200: "#fde68a",
          300: "#fde047",
          400: "#facc15",
          500: "#F5C800",   // SM Yellow — accent, focus rings, active borders
          600: "#3d3d3d",   // dark gray
          700: "#1a1a1a",   // SM Black — buttons, headers, strong text
          800: "#111111",
          900: "#0a0a0a",
        },
        // Semantic aliases used throughout the app
        ink:    "#1a1a1a",
        gold:   "#F5C800",
        danger: "#CC2200",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
