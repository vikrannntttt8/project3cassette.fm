/** @type {import('tailwindcss').Config} */
module.exports = {
  // ── Content: scan ALL source files in the monorepo that may emit Tailwind classes ──
  content: [
    // Mobile app router + local src
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    // Shared workspace packages (e.g. @cassette/core components/hooks)
    "../../packages/**/*.{js,jsx,ts,tsx}",
    // Root-level shared utilities / hooks that may be referenced from mobile
    "../../src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // ── Typography ───────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      // ── Color Tokens (full parity with root tailwind.config.js) ──
      colors: {
        background: '#0e0e0e',

        surface: {
          DEFAULT:  '#18181a',
          dim:      '#0e0e0e',
          bright:   '#28282b',
          lowest:   '#070708',
          low:      '#121214',
          card:     '#18181a',
          elevated: '#222225',
          high:     '#2a2a2e',
          highest:  '#34343a',
          variant:  '#222225',
        },

        'on-surface':         '#f3f3f5',
        'on-surface-variant': '#a1a1aa',
        'inverse-surface':    '#f4f4f5',
        'inverse-on-surface': '#18181b',

        // Primary – Warm Amber
        primary: {
          DEFAULT:   '#f59e0b',
          container: '#b45309',
          fixed:     '#fde68a',
          'fixed-dim': '#fbbf24',
        },
        'on-primary':               '#451a03',
        'on-primary-container':     '#fef3c7',
        'on-primary-fixed':         '#78350f',
        'on-primary-fixed-variant': '#92400e',
        'inverse-primary':          '#d97706',

        // Secondary – Warm Gold
        secondary: {
          DEFAULT:   '#fbbf24',
          container: '#92400e',
          fixed:     '#fef3c7',
          'fixed-dim': '#fcd34d',
        },
        'on-secondary':               '#451a03',
        'on-secondary-container':     '#fde68a',
        'on-secondary-fixed':         '#78350f',
        'on-secondary-fixed-variant': '#b45309',

        // Tertiary – Electric Cyan
        tertiary: {
          DEFAULT:   '#38bdf8',
          container: '#0369a1',
          fixed:     '#bae6fd',
          'fixed-dim': '#7dd3fc',
        },
        'on-tertiary':               '#082f49',
        'on-tertiary-container':     '#e0f2fe',

        // Status
        error:             '#f87171',
        'error-container': '#7f1d1d',
        'on-error':        '#450a0a',
        'on-error-container': '#fee2e2',

        // Outline
        outline:          '#52525b',
        'outline-variant': '#27272a',
        'surface-tint':   '#f59e0b',

        // Accent (used as `text-accent`, `bg-accent` etc. in mobile components)
        // Maps to pure white to match YouTube-Music-style highlight
        accent: {
          DEFAULT: '#ffffff',
          amber:   '#f59e0b',
        },

        // Brand tokens
        brand: {
          amber:     '#f59e0b',
          amberGlow: 'rgba(245, 158, 11, 0.35)',
          charcoal:  '#18181a',
          card:      '#18181a',
          elevated:  '#222225',
          rose:      '#f43f5e',
          violet:    '#a855f7',
          cyan:      '#06b6d4',
          emerald:   '#10b981',
        },
      },

      // ── Border Radius ─────────────────────────────────────────────
      borderRadius: {
        sm:      '6px',
        DEFAULT: '10px',
        md:      '14px',
        lg:      '18px',
        xl:      '22px',
        '2xl':   '26px',
        '3xl':   '32px',
        full:    '9999px',
      },

      // ── Spacing extensions ────────────────────────────────────────
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        gutter:     '1.5rem',
        margin:     '2rem',
      },

      // ── Font Sizes (match PWA typographic scale) ──────────────────
      fontSize: {
        'label-sm':           ['10px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '600' }],
        'label-md':           ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-lg':           ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'body-sm':            ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px', letterSpacing: '0em',    fontWeight: '400' }],
        'body-lg':            ['16px', { lineHeight: '24px', letterSpacing: '-0.01em',fontWeight: '400' }],
        'headline-sm':        ['18px', { lineHeight: '24px', letterSpacing: '-0.01em',fontWeight: '600' }],
        'headline-md':        ['24px', { lineHeight: '32px', letterSpacing: '-0.02em',fontWeight: '600' }],
        'headline-lg':        ['36px', { lineHeight: '44px', letterSpacing: '-0.025em',fontWeight: '600' }],
        'headline-lg-mobile': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em',fontWeight: '600' }],
        'headline-xl':        ['48px', { lineHeight: '56px', letterSpacing: '-0.03em',fontWeight: '700' }],
        'headline-xl-mobile': ['32px', { lineHeight: '40px', letterSpacing: '-0.025em',fontWeight: '700' }],
      },
    },
  },

  plugins: [],
};
