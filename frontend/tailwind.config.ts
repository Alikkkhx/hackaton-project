import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d7f0ff",
          200: "#b7e5ff",
          300: "#85d4ff",
          400: "#4cbaff",
          500: "#1c9aff",
          600: "#007ae6",
          700: "#0063bd",
          800: "#005399",
          900: "#06467e",
        },
        accent: {
          500: "#14b8a6",
          600: "#0d9488",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        cardHover:
          "0 4px 8px rgba(16, 24, 40, 0.06), 0 12px 24px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
