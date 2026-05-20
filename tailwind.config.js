/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#e8dcc4",
        ink: "#2a1f17",
        amber: "#d99a4e",
        ember: "#7a4a1f",
        midnight: "#070503"
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        hand: ["'Caveat'", "cursive"],
        type: ["'Special Elite'", "'Courier New'", "monospace"]
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "1", filter: "brightness(1)" },
          "20%": { opacity: ".92", filter: "brightness(.95)" },
          "45%": { opacity: ".97", filter: "brightness(1.05)" },
          "70%": { opacity: ".88", filter: "brightness(.9)" }
        },
        drift: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        breathe: {
          "0%,100%": { opacity: ".85" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        flicker: "flicker 5s ease-in-out infinite",
        drift: "drift 8s ease-in-out infinite",
        fadeIn: "fadeIn 1.4s ease-out forwards",
        breathe: "breathe 7.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
