import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  elevated,
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { elevated?: boolean; children: ReactNode }) {
  return (
    <div
      className={`rounded-lg border border-line ${elevated ? 'bg-surface-2 shadow-elevated' : 'bg-surface shadow-card'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
