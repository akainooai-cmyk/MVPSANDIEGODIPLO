import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SDDC Brand Colors
        'primary-blue': '#1E3A5F',
        'primary-blue-light': '#2D5A87',
        'accent-orange': '#E85D04',
        'accent-red': '#C1292E',

        // Neutrals
        gray: {
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
        },

        // Semantic colors
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#0284C7',
      },
      backgroundColor: {
        'primary': '#FFFFFF',
        'secondary': '#F8FAFC',
        'tertiary': '#F1F5F9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
