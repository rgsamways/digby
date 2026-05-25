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
          50:  "#fdf6ee",
          100: "#faecd8",
          400: "#e8a84a",
          500: "#d48d42",
          600: "#c97b3a",
          700: "#a8622e",
          900: "#6b3c1a",
        },
        digby: {
          navy:   "#1A1F2E",
          slate:  "#2C3A4A",
          stone:  "#3D4F5C",
          copper: "#C97B3A",
          amber:  "#E8A84A",
          cream:  "#F5F0E8",
          warm:   "#EEE8DC",
          blue:   "#8A9BAE",
          teal:   "#2E7D8C",
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
