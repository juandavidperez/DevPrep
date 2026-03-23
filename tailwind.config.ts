import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "surface-lowest": "var(--surface-lowest)",
        "surface-container": "var(--surface-container)",
        "surface-highest": "var(--surface-highest)",
        "border-subtle": "var(--border-subtle)",
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(124, 58, 237, 0.3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
