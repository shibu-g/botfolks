import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { CREDIT_PACKS } from '@botfolks/shared';
import { post } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { Button } from '../ui/Button';

export function CreditsMenu({ credits }: { credits: number }) {
  const [open, setOpen] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function buy(packId: string) {
    setErr('');
    setBuyingId(packId);
    try {
      const { url } = await post<{ url: string }>('/billing/checkout-credits', { packId });
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message);
      setBuyingId(null);
    }
  }

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface-2 px-3 text-[13px] font-medium text-text outline-none transition-colors hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Zap size={14} className="shrink-0 text-accent" />
        {credits.toLocaleString()} credits
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Buy credits"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] origin-top-right rounded-lg border border-line bg-surface-2 p-4 shadow-elevated animate-scale-in"
        >
          <p className="text-[14px] font-semibold text-text">Buy more credits</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">Top up your wallet — used for chat overage and voice minutes.</p>
          {err && <p className="mt-2 text-[13px] text-err">{err}</p>}
          <div className="mt-3 flex flex-col gap-2">
            {CREDIT_PACKS.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                <div>
                  <div className="text-[14px] font-semibold text-text">{formatMoney(p.usd)}</div>
                  <div className="text-[13px] text-muted">{p.credits.toLocaleString()} credits</div>
                </div>
                <Button size="sm" variant="outline" loading={buyingId === p.id} onClick={() => buy(p.id)}>
                  Buy
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
