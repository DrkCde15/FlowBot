import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        bg: "#f6f7f9",
        surface: "#ffffff",
        "surface-2": "#f1f3f7",
        line: "#e6e8ee",
        ink: "#0f172a",
        muted: "#64748b",
        accent: {
          DEFAULT: "#5b5bd6",
          strong: "#4f46e5",
          soft: "#eef0fd",
          fg: "#ffffff",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)",
        card: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -12px rgba(15,23,42,0.10)",
        glow: "0 8px 30px -8px rgba(91,91,214,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
