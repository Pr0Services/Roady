// ============================================================
// ROADY Construction - Tailwind CSS Configuration
// frontend/tailwind.config.js
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  darkMode: 'class',
  
  theme: {
    extend: {
      // Custom colors - ROADY Brand
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Main brand color
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        construction: {
          orange: '#F97316',
          yellow: '#EAB308',
          steel: '#64748B',
          concrete: '#9CA3AF',
        },
      },
      
      // Typography - Hierarchy
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],    // 48px
        'h1': ['2rem', { lineHeight: '1.25', fontWeight: '700' }],        // 32px
        'h2': ['1.5rem', { lineHeight: '1.33', fontWeight: '600' }],      // 24px
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],      // 20px
        'h4': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],         // 16px
        'body': ['0.875rem', { lineHeight: '1.43', fontWeight: '400' }],  // 14px
        'small': ['0.75rem', { lineHeight: '1.33', fontWeight: '400' }],  // 12px
        'tiny': ['0.625rem', { lineHeight: '1.4', fontWeight: '500' }],   // 10px
      },
      
      // Font families
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      // Spacing - Menu dimensions
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px - Sidebar collapsed
        '22': '5.5rem',     // 88px
        '70': '17.5rem',    // 280px - Sidebar width
        '84': '21rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      
      // Sizing for menus
      height: {
        'topbar': '4rem',         // 64px
        'menu-item': '2.75rem',   // 44px
        'menu-sub': '2.25rem',    // 36px
        'logo': '2.5rem',         // 40px
      },
      
      width: {
        'sidebar': '17.5rem',     // 280px
        'sidebar-collapsed': '4.5rem', // 72px
      },
      
      // Border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      // Box shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      
      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
      
      // Transitions
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    
    // Custom plugin for menu components
    function({ addComponents, theme }) {
      addComponents({
        // Menu item styles
        '.menu-item': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.3'),
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.body')[0],
          fontWeight: '500',
          transition: 'all 150ms ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: theme('colors.gray.100'),
          },
          '&.active': {
            backgroundColor: theme('colors.primary.500'),
            color: 'white',
          },
        },
        
        // Primary menu item (larger)
        '.menu-item-primary': {
          height: theme('height.menu-item'),
          fontWeight: '600',
        },
        
        // Secondary menu item
        '.menu-item-secondary': {
          height: '2.5rem',
          fontWeight: '500',
        },
        
        // Tertiary menu item (smaller)
        '.menu-item-tertiary': {
          height: theme('height.menu-sub'),
          fontSize: theme('fontSize.small')[0],
          fontWeight: '400',
          color: theme('colors.gray.600'),
        },
        
        // Card styles
        '.card': {
          backgroundColor: 'white',
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.card'),
          border: `1px solid ${theme('colors.gray.100')}`,
        },
        
        // KPI card
        '.kpi-card': {
          padding: theme('spacing.4'),
          borderRadius: theme('borderRadius.xl'),
          backgroundColor: 'white',
          boxShadow: theme('boxShadow.soft'),
        },
      });
    },
  ],
};


// ============================================================
// frontend/postcss.config.js
// ============================================================

/*
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
*/
