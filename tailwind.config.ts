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
        DEFAULT: 'rgba(15, 23, 42, 0.09)',
        white: 'rgba(15, 23, 42, 0.9)',
      },
      colors: {
        // Inverted slate color family for instant light theme typography
        slate: {
          50:  '#0f172a', // Slate-900 (darkest)
          100: '#0f172a',
          200: '#1e293b', // Slate-800
          300: '#334155', // Slate-700
          400: '#475569', // Slate-600
          500: '#64748b', // Slate-500
          600: '#94a3b8', // Slate-400
          700: '#cbd5e1', // Slate-300
          800: '#e2e8f0', // Slate-200
          900: '#f1f5f9', // Slate-100 (lightest)
        },
        // Vibrant Indigo/Purple brand palette
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Light surfaces driven by CSS variables
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
          purple: '#8b5cf6',
          blue:   '#2563eb',
          green:  '#10b981',
          red:    '#ef4444',
          yellow: '#f59e0b',
          pink:   '#ec4899',
        },
        // Stream colors
        jee:  '#2563eb',
        neet: '#10b981',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':    'linear-gradient(135deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%)',
        'brand-gradient':   'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #818cf8 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(37,99,241,0.05) 0%, rgba(59,130,246,0.02) 100%)',
        'jee-gradient':     'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'neet-gradient':    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
          '50%':      { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.6)' },
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
        glass:   '0 8px 32px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
        brand:   '0 4px 20px rgba(37,99,241,0.15)',
        'brand-lg': '0 10px 40px rgba(37,99,241,0.25)',
        card:    '0 4px 20px rgba(15,23,42,0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
