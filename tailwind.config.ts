import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a0f1a",
          50: "#0d1320",
          100: "#111827",
          200: "#1a2332",
          300: "#242f42",
          400: "#2e3b52",
          500: "#3a4a66",
        },
        mint: {
          DEFAULT: "#3DFFA2",
          50: "#e6fff3",
          100: "#b3ffe0",
          200: "#80ffcc",
          300: "#4dffb8",
          400: "#3DFFA2",
          500: "#2ee68f",
          600: "#24cc7d",
          700: "#1ab36b",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a0f1a 100%)",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.37)",
        "mint-glow": "0 0 20px rgba(61, 255, 162, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
