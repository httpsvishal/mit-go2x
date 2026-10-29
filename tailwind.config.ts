import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './plugins/**/*.{js,ts,jsx,tsx,mdx}',
    './core/**/*.{js,ts,jsx,tsx,mdx}',
    './theme/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        go2x: {
          bg: 'var(--go2x-bg)',
          surface: 'var(--go2x-surface)',
          'surface-alt': 'var(--go2x-surface-alt)',
          border: 'var(--go2x-border)',
          text: 'var(--go2x-text)',
          'text-muted': 'var(--go2x-text-muted)',
          accent: 'var(--go2x-accent)',
          'accent-contrast': 'var(--go2x-accent-contrast)',
          'accent-soft': 'var(--go2x-accent-soft)',
          'focus-ring': 'var(--go2x-focus-ring)',
          status: {
            ok: 'var(--go2x-status-ok)',
            'ok-text': 'var(--go2x-status-ok-text)',
            'ok-soft': 'var(--go2x-status-ok-soft)',
            warn: 'var(--go2x-status-warn)',
            'warn-text': 'var(--go2x-status-warn-text)',
            'warn-soft': 'var(--go2x-status-warn-soft)',
            bad: 'var(--go2x-status-bad)',
            'bad-text': 'var(--go2x-status-bad-text)',
            'bad-soft': 'var(--go2x-status-bad-soft)',
            neutral: 'var(--go2x-status-neutral)',
            'neutral-text': 'var(--go2x-status-neutral-text)',
            'neutral-soft': 'var(--go2x-status-neutral-soft)',
          },
        },
      },
      fontFamily: {
        heading: 'var(--go2x-font-heading)',
        body: 'var(--go2x-font-body)',
        mono: 'var(--go2x-font-mono)',
      },
      borderRadius: {
        'go2x-sm': 'var(--go2x-radius-sm)',
        'go2x-md': 'var(--go2x-radius-md)',
        'go2x-lg': 'var(--go2x-radius-lg)',
        'go2x-xl': 'var(--go2x-radius-xl)',
        'go2x-2xl': 'var(--go2x-radius-2xl)',
        'go2x-full': 'var(--go2x-radius-full)',
        sm: 'var(--go2x-radius-sm)',
        md: 'var(--go2x-radius-md)',
        lg: 'var(--go2x-radius-lg)',
        xl: 'var(--go2x-radius-xl)',
        '2xl': 'var(--go2x-radius-2xl)',
        full: 'var(--go2x-radius-full)',
      },
      boxShadow: {
        'go2x-sm': 'var(--go2x-shadow-sm)',
        'go2x-md': 'var(--go2x-shadow-md)',
        sm: 'var(--go2x-shadow-sm)',
        md: 'var(--go2x-shadow-md)',
      },
      borderWidth: {
        DEFAULT: '1px',
        thin: '1px',
      },
    },
  },
  plugins: [],
};

export default config;
