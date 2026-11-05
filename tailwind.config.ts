import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        panel: 'var(--panel)',
        hairline: 'var(--hairline)',
        paper: 'var(--paper)',
        ash: 'var(--ash)',
        ember: 'var(--ember)',
        signal: 'var(--signal)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '8px' },
    },
  },
  plugins: [],
};
export default config;
