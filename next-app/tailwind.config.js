/** @type {import('tailwindcss').Config} */
module.exports = {
  // The app toggles dark mode via `body.dark` (see Toggle Theme), which the
  // class strategy picks up for `dark:` variants.
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      // Semantic tokens defined in app/globals.css (:root + body.dark),
      // so utilities follow the theme toggle automatically. Opacity
      // modifiers (e.g. bg-background/95) are no-ops on var() colors.
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--input-border)",
        ring: "var(--color-ring)",
      },
      fontFamily: {
        display: ["var(--font-prata)", "serif"],
        body: ["var(--font-lora)", "serif"],
        stamp: ["var(--font-kalam)", "cursive"],
        sans: ["var(--font-lora)", "serif"],
      },
    },
  },
  plugins: [],
};
