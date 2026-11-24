import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[16px] font-semibold text-text">{title}</h3>
        {description && <p className="max-w-sm text-[14px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
