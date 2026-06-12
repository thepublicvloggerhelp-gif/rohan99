import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      borderColor: {
        DEFAULT: 'rgba(255, 255, 255, 0.07)',
      },
      colors: {
        // Cinematic slate — dark theme, white text hierarchy
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Brand: Electric Blue
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Crimson accent
        crimson: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        // Dark surfaces via CSS variables
        surface: {
          1: 'var(--bg-primary)',
          2: 'var(--bg-secondary)',
          3: 'var(--bg-tertiary)',
          4: 'var(--bg-card)',
          5: 'var(--bg-elevated)',
          6: 'var(--bg-elevated-hover)',
        },
        glass: {
          DEFAULT: 'var(--glass-bg)',
          hover:   'var(--glass-bg-hover)',
          border:  'var(--glass-border)',
        },
        // Semantic
        accent: {
          blue:   '#2563eb',
          red:    '#dc2626',
          green:  '#10b981',
          yellow: '#f59e0b',
          purple: '#8b5cf6',
          pink:   '#ec4899',
        },
        jee:  '#2563eb',
        neet: '#10b981',
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['Syne', 'var(--font-display)', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient':   'linear-gradient(135deg, #08090E 0%, #0D0F1A 50%, #111420 100%)',
        'brand-gradient':  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #3b82f6 100%)',
        'red-gradient':    'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(13,15,26,0.3) 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37,99,235,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(37,99,235,0.6)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':           { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        shimmer:           'shimmer 2s linear infinite',
        float:             'float 3s ease-in-out infinite',
        glow:              'glow 2s ease-in-out infinite',
        'slide-in-right':  'slide-in-right 0.3s ease-out',
        'slide-in-up':     'slide-in-up 0.3s ease-out',
        'fade-in':         'fade-in 0.3s ease-out',
        'pulse-slow':      'pulse-slow 2s ease-in-out infinite',
        'bounce-dot':      'bounce-dot 1.4s ease-in-out infinite',
        'bounce-dot-2':    'bounce-dot 1.4s ease-in-out 0.16s infinite',
        'bounce-dot-3':    'bounce-dot 1.4s ease-in-out 0.32s infinite',
      },
      boxShadow: {
        glass:      '0 8px 32px rgba(0,0,0,0.5)',
        brand:      '0 4px 20px rgba(37,99,235,0.3)',
        'brand-lg': '0 10px 40px rgba(37,99,235,0.4)',
        red:        '0 4px 20px rgba(220,38,38,0.3)',
        card:       '0 4px 24px rgba(0,0,0,0.4)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
