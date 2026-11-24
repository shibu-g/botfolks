import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, hint, trailing, className = '', id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-muted">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3 flex text-muted">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-md border bg-[var(--field-bg)] px-3 text-[14.5px] text-text placeholder:text-muted/70
            transition-colors duration-150 outline-none
            ${icon ? 'pl-9' : ''} ${trailing ? 'pr-10' : ''}
            ${error ? 'border-err focus:border-err focus:ring-2 focus:ring-err/20' : 'border-line focus:border-accent focus:ring-2 focus:ring-accent/20'}
            ${className}`}
          {...rest}
        />
        {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
      </div>
      {error ? (
        <span className="text-[13px] text-err">{error}</span>
      ) : hint ? (
        <span className="text-[13px] text-muted">{hint}</span>
      ) : null}
    </div>
  );
});
