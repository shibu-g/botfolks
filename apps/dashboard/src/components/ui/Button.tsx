import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-md border-0 p-0 ' +
  'transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'active:scale-[0.97]';

const variants: Record<Variant, string> = {
  primary:
    'bg-[image:var(--accent-grad)] text-white shadow-glow-accent hover:brightness-[1.07] hover:-translate-y-px active:translate-y-0',
  secondary: 'bg-surface-2 text-text border border-line hover:border-line-strong hover:bg-white/[.04]',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-white/[.05]',
  danger: 'bg-err/10 text-err border border-err/30 hover:bg-err/15',
  outline: 'bg-transparent text-text border border-line hover:border-line-strong hover:bg-white/[.03]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-[52px] px-6 text-[15px]',
};

const iconOnlySizes: Record<Size, string> = {
  sm: 'h-9 w-9 p-0',
  md: 'h-11 w-11 p-0',
  lg: 'h-[52px] w-[52px] p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconOnly, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${iconOnly ? iconOnlySizes[size] : sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : icon}
      {!iconOnly && children}
    </button>
  );
});
