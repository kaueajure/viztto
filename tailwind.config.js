/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-elevated': 'var(--surface-elevated)',
        ink: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        disabled: 'var(--text-disabled)',
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          active: 'var(--brand-primary-active)',
          soft: 'var(--brand-soft)',
          'soft-hover': 'var(--brand-soft-hover)',
          contrast: 'var(--brand-contrast)',
        },
        approval: {
          DEFAULT: 'var(--approval)',
          hover: 'var(--approval-hover)',
          dark: 'var(--approval-dark)',
          soft: 'var(--approval-soft)',
        },
        revision: {
          DEFAULT: 'var(--revision)',
          hover: 'var(--revision-hover)',
          dark: 'var(--revision-dark)',
          soft: 'var(--revision-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent-secondary)',
          hover: 'var(--accent-secondary-hover)',
          soft: 'var(--accent-secondary-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          dark: 'var(--warning-dark)',
          soft: 'var(--warning-soft)',
        },
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          subtle: 'var(--border-subtle)',
        },
        overlay: 'var(--overlay)',
      },
      fontFamily: { sans: ['Instrument Sans', 'sans-serif'], serif: ['Instrument Serif', 'serif'] },
      borderRadius: { sm: '8px', md: '12px', lg: '18px', xl: '26px' },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        raised: 'var(--shadow-raised)',
      },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [],
}
