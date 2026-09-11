function withOpacity(variableName) {
  return ({ opacityValue, opacityVariable }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    if (opacityVariable !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(var(${opacityVariable}, 1) * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        panel: {
          DEFAULT: withOpacity('--panel'),
          foreground: withOpacity('--foreground'),
          border: withOpacity('--border'),
        },
        canvas: {
          DEFAULT: withOpacity('--canvas'),
        },
        popover: {
          DEFAULT: withOpacity('--popover'),
          foreground: withOpacity('--popover-foreground'),
        },
        primary: {
          DEFAULT: withOpacity('--primary'),
          foreground: withOpacity('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--secondary'),
          foreground: withOpacity('--secondary-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          hover: withOpacity('--accent-hover'),
          foreground: withOpacity('--accent-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('--destructive'),
          foreground: withOpacity('--destructive-foreground'),
        },
        border: {
          DEFAULT: withOpacity('--border'),
          subtle: withOpacity('--border-subtle'),
        },
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
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
