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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        ash: {
          50: "#F7F9FC",
          100: "#EEF2F6",
          200: "#D6DFEA",
          300: "#BCC9DA",
          500: "#5D718D",
          700: "#263A59",
          900: "#102544",
        },
        ember: {
          50: "#FCEBED",
          100: "#F8D6DA",
          500: "#BF2430",
          700: "#931A23",
        },
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
      },
      boxShadow: {
        panel: "0 18px 40px rgba(16, 37, 68, 0.08)",
        soft: "0 10px 24px rgba(16, 37, 68, 0.06)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(34, 63, 108, 0.12), transparent 30%), linear-gradient(180deg, #f9fbfd 0%, #eef2f6 100%)",
        "brand-gradient":
          "linear-gradient(160deg, #0f284b 0%, #173765 55%, #295382 100%)",
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "Trebuchet MS", "sans-serif"],
        display: ["Aptos Display", "Aptos", "Segoe UI", "sans-serif"],
      },
      screens: {
        tablet: "960px",
      },
    },
  },
  plugins: [],
};

export default config;
