import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0C1735',
        paper: '#F6F7FB',
        action: '#5C7CFF',
        mint: '#8DE6C2',
        lavender: '#C4B5FD',
      },
      boxShadow: {
        soft: '0 24px 80px rgba(39, 54, 108, 0.12)',
        panel: '0 12px 34px rgba(8, 19, 53, 0.1)',
      },
    },
  },
  plugins: [],
}
export default config
