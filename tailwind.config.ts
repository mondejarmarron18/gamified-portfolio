import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        gold: '#f0c060',
        dark: '#060810',
        accent: '#d4af37',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        crimson: ['Crimson Text', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
