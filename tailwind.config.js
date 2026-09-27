/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1d1d1f',
          soft: '#3a3a3c',
          muted: '#6e6e73',
          faint: '#86868b',
        },
        accent: {
          DEFAULT: '#0071e3',
          hover: '#0077ed',
          soft: '#e8f1ff',
        },
        success: {
          DEFAULT: '#34c759',
          soft: '#e8f9ee',
        },
        warning: {
          DEFAULT: '#ff9f0a',
          soft: '#fff4e5',
        },
        error: {
          DEFAULT: '#ff3b30',
          soft: '#ffEBEE',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f5f5f7',
          raised: '#fbfbfd',
          border: '#d2d2d7',
          hairline: '#e8e8ed',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.022em',
        tighter: '-0.016em',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)',
        cardHover: '0 1px 3px rgba(0,0,0,0.05), 0 16px 40px -12px rgba(0,0,0,0.14)',
        focus: '0 0 0 4px rgba(0,113,227,0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
