import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        midnight: {
          50: '#f0f1f8',
          100: '#d4d7ec',
          200: '#a9afd9',
          300: '#7e87c6',
          400: '#535fb3',
          500: '#3a4599',
          600: '#2d3577',
          700: '#202555',
          800: '#131533',
          900: '#0a0c1a',
          950: '#05060d',
        },
        gold: {
          50: '#fef9ec',
          100: '#fcf0c8',
          200: '#f9e091',
          300: '#f5cb4a',
          400: '#f2ba1e',
          500: '#e39c0b',
          600: '#c97807',
          700: '#a7550a',
          800: '#88430e',
          900: '#71370f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1.2s ease-out',
        'fade-in-slow': 'fadeIn 2s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
