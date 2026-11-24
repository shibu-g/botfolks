/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight is disabled on purpose: Landing/Login/Signup/BotDetail rely on the
  // existing hand-rolled element defaults in styles.css (button, input, h1…).
  // Resetting them here would change those pages' look even though they're out of scope.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        subtle: 'var(--text-subtle)',
        // rgb(var(--x-rgb) / <alpha-value>) lets Tailwind generate opacity
        // modifiers (bg-accent/10, text-err/50, …) for these CSS-var colors.
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2-rgb) / <alpha-value>)',
        ok: 'rgb(var(--ok-rgb) / <alpha-value>)',
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        err: 'rgb(var(--err-rgb) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,.03) inset, 0 12px 28px -16px rgba(0,0,0,.45)',
        elevated: '0 1px 0 0 rgba(255,255,255,.04) inset, 0 24px 48px -20px rgba(0,0,0,.55)',
        'glow-accent': '0 0 0 1px rgba(139,124,255,.25), 0 16px 36px -16px rgba(139,124,255,.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': { from: { opacity: 0, transform: 'scale(.96) translateY(-4px)' }, to: { opacity: 1, transform: 'scale(1) translateY(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-up-sheet': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'pulse-soft': { '0%, 100%': { opacity: 1 }, '50%': { opacity: .45 } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'scale-in': 'scale-in .16s cubic-bezier(.2,.9,.3,1.2)',
        'slide-in-left': 'slide-in-left .2s cubic-bezier(.2,.8,.3,1)',
        'slide-up-sheet': 'slide-up-sheet .22s cubic-bezier(.2,.8,.3,1)',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
