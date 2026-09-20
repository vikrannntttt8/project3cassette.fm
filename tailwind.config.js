/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // ─── Nordic Nocturne — from Stitch "Pulse Dark Music Web App" ───
        background:    '#131315',
        surface: {
          DEFAULT:  '#201f22',
          dim:      '#131315',
          bright:   '#39393b',
          lowest:   '#09090B',
          low:      '#1c1b1d',
          high:     '#2a2a2c',
          highest:  '#353437',
          variant:  '#353437',
        },
        'on-surface':          '#e5e1e4',
        'on-surface-variant':  '#cbc3d7',
        'inverse-surface':     '#e5e1e4',
        'inverse-on-surface':  '#313032',

        // Primary: Electric Violet
        primary: {
          DEFAULT:   '#d0bcff',
          container: '#a078ff',
          fixed:     '#e9ddff',
          'fixed-dim':'#d0bcff',
        },
        'on-primary':               '#3c0091',
        'on-primary-container':     '#340080',
        'on-primary-fixed':         '#23005c',
        'on-primary-fixed-variant': '#5516be',
        'inverse-primary':          '#6d3bd7',

        // Secondary: Neon Pink
        secondary: {
          DEFAULT:   '#ffb0cd',
          container: '#aa0266',
          fixed:     '#ffd9e4',
          'fixed-dim':'#ffb0cd',
        },
        'on-secondary':               '#640039',
        'on-secondary-container':     '#ffbad3',
        'on-secondary-fixed':         '#3e0022',
        'on-secondary-fixed-variant': '#8c0053',

        // Tertiary: Electric Cyan
        tertiary: {
          DEFAULT:   '#4cd7f6',
          container: '#009eb9',
          fixed:     '#acedff',
          'fixed-dim':'#4cd7f6',
        },
        'on-tertiary':               '#003640',
        'on-tertiary-container':     '#002f38',
        'on-tertiary-fixed':         '#001f26',
        'on-tertiary-fixed-variant': '#004e5c',

        // Status
        error:            '#ffb4ab',
        'error-container':'#93000a',
        'on-error':       '#690005',
        'on-error-container':'#ffdad6',

        // Outline
        outline:         '#958ea0',
        'outline-variant':'#494454',
        'surface-tint':  '#d0bcff',

        // Brand shortcuts (matching Stitch overrides)
        brand: {
          violet: '#8B5CF6',
          pink:   '#EC4899',
          cyan:   '#06B6D4',
        },

        // Neo-Brutalism Theme Palette (Infused with Somnath Mahanta DM reference)
        neo: {
          bg:        '#0a0b0f',
          card:      '#13141a',
          'card-alt':'#1a1c24',
          'card-high':'#222530',
          lime:      '#CCFF00',
          mint:      '#86EFAC',
          pink:      '#FF2E93',
          rose:      '#FDA4AF',
          cyan:      '#00F0FF',
          sky:       '#7DD3FC',
          yellow:    '#FFE600',
          cream:     '#FEF08A',
          orange:    '#FF6B00',
          peach:     '#FDBA74',
          violet:    '#A855F7',
          lavender:  '#C4B5FD',
          border:    '#18181b',
          white:     '#FFFFFF',
        },
      },
      boxShadow: {
        'neo-sm':    '2px 2px 0px 0px #000000',
        'neo':       '3px 3px 0px 0px #000000',
        'neo-md':    '4px 4px 0px 0px #000000',
        'neo-lg':    '6px 6px 0px 0px #000000',
        'neo-xl':    '8px 8px 0px 0px #000000',
        'neo-lime':  '4px 4px 0px 0px #CCFF00',
        'neo-mint':  '4px 4px 0px 0px #86EFAC',
        'neo-pink':  '4px 4px 0px 0px #FF2E93',
        'neo-rose':  '4px 4px 0px 0px #FDA4AF',
        'neo-cyan':  '4px 4px 0px 0px #00F0FF',
        'neo-sky':   '4px 4px 0px 0px #7DD3FC',
        'neo-yellow':'4px 4px 0px 0px #FFE600',
        'neo-lavender':'4px 4px 0px 0px #C4B5FD',
        'neo-white': '4px 4px 0px 0px #ffffff',
      },
      borderRadius: {
        sm:      '4px',
        DEFAULT: '8px',
        md:      '12px',
        lg:      '16px',
        xl:      '24px',
        '2xl':   '28px',
        full:    '9999px',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        gutter:     '1.5rem',
        margin:     '2rem',
      },
      fontSize: {
        'label-sm':           ['10px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '600' }],
        'label-md':           ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-lg':           ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'body-sm':            ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px', letterSpacing: '0em',    fontWeight: '400' }],
        'body-lg':            ['16px', { lineHeight: '24px', letterSpacing: '-0.01em',fontWeight: '400' }],
        'headline-sm':        ['18px', { lineHeight: '24px', letterSpacing: '-0.01em',fontWeight: '600' }],
        'headline-md':        ['24px', { lineHeight: '32px', letterSpacing: '-0.02em',fontWeight: '600' }],
        'headline-lg':        ['36px', { lineHeight: '44px', letterSpacing: '-0.025em',fontWeight:'600' }],
        'headline-lg-mobile': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em',fontWeight: '600' }],
        'headline-xl':        ['48px', { lineHeight: '56px', letterSpacing: '-0.03em',fontWeight: '700' }],
        'headline-xl-mobile': ['32px', { lineHeight: '40px', letterSpacing: '-0.025em',fontWeight:'700' }],
      },
      backdropBlur: {
        xs:  '4px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '32px',
        '2xl': '40px',
        '3xl': '60px',
      },
      animation: {
        'pulse-slow': 'pulse 6s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow': 'glow-pulse 6s ease-in-out infinite',
        'marquee': 'marquee 18s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%':      { opacity: '0.30', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
