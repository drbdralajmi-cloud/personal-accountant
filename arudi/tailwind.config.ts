import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0b9ca',
          400: '#8593ac',
          500: '#657592',
          600: '#505d78',
          700: '#424c61',
          800: '#394152',
          900: '#333947',
          950: '#22252e',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f4ecd2',
          200: '#e8d7a5',
          300: '#dabc70',
          400: '#cfa249',
          500: '#c28c36',
          600: '#a76e2c',
          700: '#8b5427',
          800: '#724426',
          900: '#5f3922',
          950: '#361d10',
        },
        teal: {
          50: '#eefbf6',
          100: '#d5f5e8',
          200: '#aeead4',
          300: '#79d8ba',
          400: '#44be9b',
          500: '#20a382',
          600: '#128369',
          700: '#0e6957',
          800: '#0e5346',
          900: '#0d453b',
          950: '#042722',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
