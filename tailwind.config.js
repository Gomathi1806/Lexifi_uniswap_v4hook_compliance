/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Instrument Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        base: { 0: "#05070e", 1: "#0a0e1a", 2: "#111828", 3: "#1a2236" },
        lex: { cyan: "#22d3ee", green: "#34d399", amber: "#fbbf24", red: "#f87171", violet: "#a78bfa" },
      },
    },
  },
  plugins: [],
};
