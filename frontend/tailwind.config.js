/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        "surface-muted": "hsl(var(--surface-muted))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-hover": "hsl(var(--primary-hover))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        "primary-soft": "hsl(var(--primary-soft))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        card: "0 1px 3px rgb(16 24 40 / 0.06), 0 8px 24px -12px rgb(16 24 40 / 0.12)",
        lift: "0 12px 32px -12px rgb(16 24 40 / 0.22)",
      },
    },
  },
  plugins: [],
};
