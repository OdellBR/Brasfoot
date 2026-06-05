/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system — dark football aesthetic
        pitch: {
          50:  '#e8f5e9',
          100: '#c8e6c9',
          500: '#2e7d32',
          600: '#1b5e20',
        },
        night: {
          900: '#0a0f1e',  // bg principal
          800: '#0f172a',  // bg cards
          700: '#1e293b',  // bg elevated
          600: '#334155',  // borders
          500: '#475569',  // muted
          400: '#64748b',  // placeholder
          300: '#94a3b8',  // secondary text
          200: '#cbd5e1',  // primary text muted
          100: '#e2e8f0',  // primary text
          50:  '#f8fafc',  // white
        },
        accent: {
          gold:   '#f59e0b',  // destaques premium
          green:  '#10b981',  // positivo / gols
          red:    '#ef4444',  // negativo / cartões
          blue:   '#3b82f6',  // neutro / info
          orange: '#f97316',  // alerta
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'slide-up':    'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideRight: {
          '0%':   { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'glow':   '0 0 20px rgba(245,158,11,0.15)',
        'inner-t': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
