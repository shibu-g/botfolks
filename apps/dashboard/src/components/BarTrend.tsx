import { useState } from 'react';

export interface BarTrendPoint {
  label: string;
  value: number;
}

/**
 * Minimal single-series bar trend: one hue (accent), hover/focus tooltip per
 * bar, sparing axis labels. Not a generic charting component — built for the
 * handful of compact usage trends on the dashboard overview.
 */
export function BarTrend({ data, formatTooltip }: { data: BarTrendPoint[]; formatTooltip?: (p: BarTrendPoint) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-28 items-end gap-1.5 border-b border-line pb-0">
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        const isActive = active === i;
        return (
          <div
            key={i}
            tabIndex={0}
            role="img"
            aria-label={formatTooltip ? formatTooltip(d) : `${d.label}: ${d.value}`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end outline-none"
          >
            {isActive && (
              <div className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-md border border-line-strong bg-surface-2 px-2 py-1 text-[12px] font-semibold text-text shadow-elevated">
                {formatTooltip ? formatTooltip(d) : d.value}
              </div>
            )}
            <div
              className={`w-full max-w-[22px] rounded-t-[4px] bg-accent transition-colors duration-150 ${isActive ? 'bg-accent-2' : ''}`}
              style={{ height: `${pct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
