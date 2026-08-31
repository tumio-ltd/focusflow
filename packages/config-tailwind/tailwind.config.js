/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        panel: {
          DEFAULT: 'rgb(var(--panel) / <alpha-value>)',
          foreground: 'rgb(var(--foreground) / <alpha-value>)',
          border: 'rgb(var(--border) / <alpha-value>)',
        },
        canvas: {
          DEFAULT: 'rgb(var(--canvas) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'keycap': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'keycap-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 2px 6px 0 rgba(0, 0, 0, 0.45)',
        'keycap-active': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'keycap-cyan': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.35), 0 4px 14px 0 rgba(56, 189, 248, 0.25)',
        'keycap-cyan-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.45), 0 6px 20px 0 rgba(56, 189, 248, 0.35)',
        'elevation-modal': '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'elevation-dropdown': '0 12px 28px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
