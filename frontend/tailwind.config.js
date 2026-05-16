/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Forest greens (primary)
        leaf: {
          50:  '#f0f7f0',
          100: '#dbecdb',
          200: '#b7d8b7',
          300: '#8bc08b',
          400: '#5fa45f',
          500: '#3f853f',
          600: '#2f6b2f',
          700: '#275627',
          800: '#1f441f',
          900: '#173317',
          950: '#0c1f0c',
        },
        // Warm earthy accents
        earth: {
          50:  '#fbf6ee',
          100: '#f3e9d4',
          200: '#e7d0a1',
          300: '#d9b06d',
          400: '#cd9347',
          500: '#bd7d38',
          600: '#9d622d',
          700: '#7c4e29',
          800: '#65402a',
          900: '#553626',
        },
        ember: {
          50: '#fdf3f0',
          100: '#fbe1d9',
          300: '#f3a48d',
          500: '#df6342',
          600: '#cd4828',
          700: '#a83820',
        },
        // Cream/canvas background like the screenshot
        canvas: {
          DEFAULT: '#f7f3ea',
          subtle: '#efe9dc',
          warm:   '#f9f1e0',
        },
      },
      boxShadow: {
        'soft':   '0 1px 2px rgba(23, 51, 23, 0.04), 0 4px 16px -4px rgba(23, 51, 23, 0.08)',
        'lifted': '0 8px 32px -8px rgba(23, 51, 23, 0.2)',
        'glow-leaf': '0 0 0 4px rgba(63, 133, 63, 0.18)',
      },
      keyframes: {
        'fade-up':   { '0%': { opacity: 0, transform: 'translateY(8px)' },   '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in':   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'scan':      { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(100%)' } },
        'pulse-soft': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scan': 'scan 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
