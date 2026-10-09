/** @type {import('tailwindcss').Config} */
// Colours are design tokens from src/styles/tokens.css, so every class works in light and dark.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        card: token('card'),
        border: token('border'),
        input: token('input'),
        foreground: token('foreground'),
        muted: token('muted'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          foreground: token('primary-foreground'),
        },
        link: token('link'),
        gold: {
          DEFAULT: token('gold'),
          soft: token('gold-soft'),
          ink: token('gold-ink'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: {
          DEFAULT: token('danger'),
          solid: token('danger-solid'),
          'solid-foreground': token('danger-solid-foreground'),
        },
        ring: token('ring'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '12px',
        panel: '16px',
      },
      boxShadow: {
        // Not named "card": that would clash with the card colour and turn the shadow white.
        soft: '0 1px 2px rgb(19 34 74 / 0.06), 0 1px 3px rgb(19 34 74 / 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
