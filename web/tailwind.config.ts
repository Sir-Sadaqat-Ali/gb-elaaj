import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Brand — locked palette from PROJECT_PLAN §1
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ge: {
          primary: "var(--ge-primary)",
          "primary-2": "var(--ge-primary-2)",
          "primary-3": "var(--ge-primary-3)",
          "bg-blue": "var(--ge-bg-blue)",
          navy: "var(--ge-navy)",
          ink: "var(--ge-ink)",
          muted: "var(--ge-muted)",
          border: "var(--ge-border)",
          "soft-bg": "var(--ge-soft-bg)",
          "blue-tint": "var(--ge-blue-tint)",
          star: "var(--ge-star)",
          accent: "var(--ge-accent)",
          "accent-bg": "var(--ge-accent-bg)",
          "chip-bg": "var(--ge-chip-bg)",
          success: "var(--ge-success)",
          warning: "var(--ge-warning)",
          danger: "var(--ge-danger)",
        },
        // shadcn-compatible aliases (so shadcn primitives still resolve)
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
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        urdu: ["var(--font-nastaliq)", "serif"],
      },
      borderRadius: {
        lg: "14px",
        md: "12px",
        sm: "8px",
        "4xl": "32px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(16, 32, 51, .04), 0 0 0 1px rgba(16, 32, 51, .03)",
        sm: "0 2px 4px rgba(16, 32, 51, .04), 0 1px 2px rgba(16, 32, 51, .03)",
        md: "0 6px 16px -4px rgba(16, 32, 51, .08), 0 2px 6px -2px rgba(16, 32, 51, .04)",
        lg: "0 18px 40px -12px rgba(16, 32, 51, .14), 0 6px 16px -8px rgba(16, 32, 51, .08)",
        card: "0 35px 55px -12px rgba(10, 37, 64, .10)",
        "card-soft": "0 20px 40px -16px rgba(10, 37, 64, .06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in .35s cubic-bezier(.2,.8,.2,1)",
        shimmer: "shimmer 1.4s linear infinite",
        marquee: "marquee 42s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
