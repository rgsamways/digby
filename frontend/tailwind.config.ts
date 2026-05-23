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
          50: "#fefce8",
          100: "#fef9c3",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          900: "#713f12",
        },
        stone: {
          750: "#44403c",
        },
        mineral: {
          amethyst:      "#7c3aed",
          sodalite:      "#1d4ed8",
          feldspar:      "#0369a1",
          amazonite:     "#0f766e",
          garnet:        "#b91c1c",
          calcite:       "#92400e",
          pyrite:        "#a16207",
          quartz:        "#6b7280",
          apatite:       "#0891b2",
          tourmaline:    "#be185d",
          mica:          "#78716c",
          corundum:      "#9f1239",
          fluorite:      "#6d28d9",
          silver:        "#64748b",
          copper:        "#c2410c",
          default:       "#4d7c0f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
