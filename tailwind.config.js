/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        ink: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          soft: 'var(--brand-soft)',
        },
        approval: {
          DEFAULT: 'var(--approval)',
          dark: 'var(--approval-dark)',
          soft: 'var(--approval-soft)',
        },
        revision: {
          DEFAULT: 'var(--revision)',
          dark: 'var(--revision-dark)',
          soft: 'var(--revision-soft)',
        },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        line: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)' },
      },
      fontFamily: { sans: ['Instrument Sans', 'sans-serif'], serif: ['Instrument Serif', 'serif'] },
      borderRadius: { sm: '8px', md: '12px', lg: '18px', xl: '26px' },
      boxShadow: {
        soft: '0 12px 36px rgba(17,19,24,.07)',
        raised: '0 18px 60px rgba(17,19,24,.12)',
      },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [],
}
