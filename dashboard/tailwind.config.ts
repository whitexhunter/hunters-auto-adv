import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dark: { 900: '#0a0a0a', 800: '#111111', 700: '#1a1a1a', 600: '#222222', 500: '#2a2a2a', 400: '#333333', 300: '#444444', 200: '#666666', 100: '#888888' },
        accent: { DEFAULT: '#d4d4d4', dark: '#a3a3a3', gold: '#c9a84c' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
