/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4900e5',
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
      },
      animation: {
        blink: 'blink 1.2s ease-in-out infinite',
        sparkle: 'sparkle 1.4s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
