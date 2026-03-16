module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: "#00d4ff",
          cyan: "#0ff0fc",
          purple: "#b500ff",
          pink: "#ff006e",
        },
        dark: {
          bg: "#0a0e27",
          card: "#1a1f3a",
          border: "#2a2f4a",
        }
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.3)",
        glowPurple: "0 0 20px rgba(181, 0, 255, 0.3)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.5)" },
        },
      },
    },
  },
  plugins: [],
}
