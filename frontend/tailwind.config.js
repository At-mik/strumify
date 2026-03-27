/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: "#F59E0B",
          bg: "#0B0B0B",
          surface: "#111111",
          text: "#EAEAEA"
        }
      },
      boxShadow: {
        amber: "0 0 24px rgba(245, 158, 11, 0.24)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        pulseBeat: {
          "0%, 100%": { transform: "scale(1)", opacity: 0.5 },
          "50%": { transform: "scale(1.15)", opacity: 1 }
        }
      },
      animation: {
        fadeUp: "fadeUp 300ms ease-out",
        pulseBeat: "pulseBeat 500ms ease-in-out"
      }
    }
  },
  plugins: []
};
