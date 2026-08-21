import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        neon: {
          DEFAULT: '#C8FF00',
          dim: 'rgba(200, 255, 0, 0.16)',
          muted: '#5a6b00',
        },
        rh: {
          black: '#171717',
          red: '#DC2626',
        },
      },
    },
  },
  plugins: [],
}
export default config
