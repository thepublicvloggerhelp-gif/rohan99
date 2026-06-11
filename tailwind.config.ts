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
      colors: {
        // YPSdudes brand palette
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
        // Discord-inspired dark backgrounds
        surface: {
          1: '#0a0a0f',
          2: '#111118',
          3: '#16161f',
          4: '#1c1c28',
          5: '#22223a',
          6: '#2a2a45',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          hover:   'rgba(255,255,255,0.08)',
          border:  'rgba(255,255,255,0.08)',
        },
        // Semantic
        accent: {
          purple: '#6366f1',
          blue:   '#3b82f6',
          green:  '#22c55e',
          red:    '#ef4444',
          yellow: '#f59e0b',
          pink:   '#ec4899',
        },
        // Stream colors
        jee:  '#6366f1',
        neet: '#22c55e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':    'linear-gradient(135deg, #0a0a0f 0%, #16161f 40%, #1a1a2e 100%)',
        'brand-gradient':   'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        'card-gradient':    'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
        'jee-gradient':     'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'neet-gradient':    'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
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
        glass:   '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        brand:   '0 0 30px rgba(99,102,241,0.3)',
        'brand-lg': '0 0 60px rgba(99,102,241,0.4)',
        card:    '0 4px 24px rgba(0,0,0,0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
