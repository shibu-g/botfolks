import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-line-strong sm:p-7">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</span>
      </div>
      <div className="mt-3 text-[26px] font-bold tabular-nums leading-none text-text">{value}</div>
      {hint && <div className="mt-2 text-[13px] text-muted">{hint}</div>}
    </div>
  );
}
