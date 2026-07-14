/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand purple (from the A1 Deal logo mark, #6628B0) — overrides
        // Tailwind's built-in blue/sky palettes so every `blue-*` and
        // `sky-*` utility class renders as brand purple instead of blue.
        blue: {
          50: '#f7f3fc',
          100: '#e9def7',
          200: '#d1b8ef',
          300: '#b187e4',
          400: '#8e51d7',
          500: '#792fd0',
          600: '#6628b0',
          700: '#542191',
          800: '#441a74',
          900: '#331457',
          950: '#220d3a',
        },
        sky: {
          50: '#f7f3fc',
          100: '#e9def7',
          200: '#d1b8ef',
          300: '#b187e4',
          400: '#8e51d7',
          500: '#792fd0',
          600: '#6628b0',
          700: '#542191',
          800: '#441a74',
          900: '#331457',
          950: '#220d3a',
        },
        primary: '#451886',
        'primary-container': '#6236ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#e3dbff',
        secondary: '#d6198f',
        'secondary-container': '#ff4fa6',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#5c0033',
        surface: '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#484456',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        outline: '#797488',
        'outline-variant': '#c9c3da',
        'surface-tint': '#5d2ffa',
        tertiary: '#484a5a',
        'tertiary-container': '#606273',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#dddff2',
        background: '#f8f9ff',
        'on-background': '#0b1c30',

        // Portal accent colors — one signature hue per portal, used for
        // sidebar strips, active-nav pills, and dashboard hero gradients.
        portal: {
          buyer: '#451886',
          broker: '#ff5a5f',
          developer: '#6628B0',
          investor: '#10b981',
          admin: '#484a5a',
          team: '#06b6d4',
          bank: '#f59e0b',
          master: '#d6198f',
        },

        // Property/listing category colors — consistent badge/border color
        // per listing type across cards, filters, and section headers.
        category: {
          deal: '#f59e0b',
          partner: '#6236ff',
          auction: '#f43f5e',
          launch: '#10b981',
        },

        // Status colors — shared across property, booking, and user status
        // chips so the same state always reads the same color everywhere.
        status: {
          available: '#10b981',
          negotiation: '#f59e0b',
          auction: '#f97316',
          sold: '#8b5cf6',
          withdrawn: '#94a3b8',
          pending: '#eab308',
          suspended: '#f43f5e',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'level-2': '0px 4px 12px rgba(26,29,43,0.08)',
        'level-3': '0px 12px 32px rgba(26,29,43,0.15)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.25 },
        },
        sparkle: {
          '0%, 100%': {
            opacity: 0.3, transform: 'scale(0.6) rotate(0deg)',
            filter: 'brightness(1) drop-shadow(0 0 0px #ffd54f)',
          },
          '50%': {
            opacity: 1, transform: 'scale(1.3) rotate(90deg)',
            filter: 'brightness(1.8) drop-shadow(0 0 6px #ffd54f)',
          },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Splash screen: logo pops in with a soft bounce on app launch.
        splashPop: {
          '0%':   { opacity: 0, transform: 'scale(0.82)' },
          '60%':  { opacity: 1, transform: 'scale(1.04)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        // Splash screen: loading dots gently bounce.
        splashDot: {
          '0%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
          '50%':      { opacity: 1, transform: 'translateY(-4px)' },
        },
      },
      animation: {
        blink: 'blink 1.2s ease-in-out infinite',
        sparkle: 'sparkle 1.4s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
        'splash-pop': 'splashPop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'splash-dot': 'splashDot 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
