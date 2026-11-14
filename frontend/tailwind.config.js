/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand orange — primary action color
        primary: {
          DEFAULT: '#f97316',
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Legacy dark palette — kept for backward compatibility
        dark: {
          DEFAULT: '#0f172a',
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
        // Brand semantic palette
        brand: {
          bg:            '#F8FAFC',
          surface:       '#FFFFFF',
          dark:          '#111827',
          charcoal:      '#1F2937',
          navy:          '#0f172a',
          orange:        '#F97316',
          'orange-hover':'#EA580C',
          'orange-deep': '#C2410C',
          muted:         '#64748B',
          border:        '#E2E8F0',
          'border-strong':'#CBD5E1',
          success:       '#16A34A',
          warning:       '#D97706',
          error:         '#DC2626',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'display-sm': ['2rem',   { lineHeight: '2.4rem',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '3rem',    letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['3.5rem', { lineHeight: '4rem',    letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-xl': ['4.5rem', { lineHeight: '5rem',    letterSpacing: '-0.04em', fontWeight: '800' }],
      },

      boxShadow: {
        'card':        '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-hover':  '0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'card-raised': '0 8px 20px 0 rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.08)',
        'brand':       '0 4px 14px 0 rgba(249,115,22,0.25)',
        'brand-lg':    '0 8px 24px 0 rgba(249,115,22,0.35)',
        'brand-glow':  '0 0 20px rgba(249,115,22,0.4)',
        'sidebar':     '2px 0 8px 0 rgba(0,0,0,0.06)',
        'modal':       '0 20px 60px 0 rgba(0,0,0,0.20)',
        'inner-brand': 'inset 0 0 0 2px rgba(249,115,22,0.3)',
        'xs':          '0 1px 2px 0 rgba(0,0,0,0.05)',
      },

      animation: {
        'spin-slow':   'spin 3s linear infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.25s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'marquee':     'marquee 40s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },

      borderRadius: {
        xl:   '0.75rem',
        '2xl':'1rem',
        '3xl':'1.5rem',
        '4xl':'2rem',
      },

      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },

      backdropBlur: {
        xs: '2px',
      },

      transitionTimingFunction: {
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      backgroundImage: {
        'gradient-brand':     'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-brand-soft':'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        'gradient-dark':      'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        'gradient-dark-rich': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%)',
        'gradient-orange-glow':'radial-gradient(ellipse at center, rgba(249,115,22,0.15) 0%, transparent 70%)',
        'hero-vignette':      'radial-gradient(ellipse at top, rgba(249,115,22,0.08) 0%, transparent 60%)',
      },

      zIndex: {
        60: '60',
        70: '70',
        80: '80',
      },
    },
  },
  plugins: [],
};
