import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, Settings, CreditCard, LogOut, HelpCircle } from 'lucide-react';
import { post } from '../../lib/api';
import type { Me } from '../../lib/types';
import { PLANS } from '@botfolks/shared';

function initials(me: Me) {
  const source = me.name?.trim() || me.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ me }: { me: Me }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = itemRefs.current.filter(Boolean) as HTMLElement[];
        const current = items.findIndex((el) => el === document.activeElement);
        const next = e.key === 'ArrowDown' ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    itemRefs.current[0]?.focus();
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    document.dispatchEvent(new Event('botfolks:logout-start'));
    try {
      await post('/auth/logout', {});
      qc.setQueryData(['me'], null);
      qc.invalidateQueries();
    } finally {
      // Keep the overlay up briefly so it reads as a transition rather than a flash,
      // even when the request resolves near-instantly.
      setTimeout(() => document.dispatchEvent(new Event('botfolks:logout-end')), 450);
    }
  }

  let idx = -1;
  const ref = (el: HTMLAnchorElement | HTMLButtonElement | null) => {
    idx += 1;
    itemRefs.current[idx] = el;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--accent-grad)] text-[13px] font-bold text-white outline-none transition-transform duration-150 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {initials(me)}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] origin-top-right overflow-hidden rounded-lg border border-line bg-surface-2 shadow-elevated animate-scale-in"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[image:var(--accent-grad)] text-[13px] font-bold text-white">
              {initials(me)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-text">{me.name || 'Your account'}</p>
              <p className="truncate text-[13px] text-muted">{me.email}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-[13px] font-semibold text-muted">
              {PLANS[me.plan].name}
            </span>
          </div>
          <div className="flex flex-col p-1.5">
            <Link
              ref={ref}
              role="menuitem"
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-text outline-none transition-colors hover:bg-white/[.06] focus-visible:bg-white/[.06]"
            >
              <User size={16} className="text-muted" /> Profile
            </Link>
            <Link
              ref={ref}
              role="menuitem"
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-text outline-none transition-colors hover:bg-white/[.06] focus-visible:bg-white/[.06]"
            >
              <Settings size={16} className="text-muted" /> Settings
            </Link>
            <Link
              ref={ref}
              role="menuitem"
              to="/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-text outline-none transition-colors hover:bg-white/[.06] focus-visible:bg-white/[.06]"
            >
              <CreditCard size={16} className="text-muted" /> Billing &amp; plans
            </Link>
            <a
              ref={ref}
              role="menuitem"
              href="https://docs.botfolks.in"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-text outline-none transition-colors hover:bg-white/[.06] focus-visible:bg-white/[.06]"
            >
              <HelpCircle size={16} className="text-muted" /> Help &amp; docs
            </a>
            <div className="my-1 h-px bg-line" />
            <button
              ref={ref}
              role="menuitem"
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 rounded-md bg-transparent px-3 py-2.5 text-left text-[14px] font-medium text-err outline-none transition-colors hover:bg-err/10 focus-visible:bg-err/10"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
