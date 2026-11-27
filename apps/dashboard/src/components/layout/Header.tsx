import { Link } from 'react-router-dom';
import { Menu, Bell, Search, ArrowUpRight } from 'lucide-react';
import { PLANS, type PlanId } from '@botfolks/shared';
import { Logo } from '../Logo';
import { UserMenu } from './UserMenu';
import { CreditsMenu } from './CreditsMenu';
import { Button } from '../ui/Button';
import type { Me } from '../../lib/types';

const PLAN_ORDER: PlanId[] = ['free', 'starter', 'growth', 'agency'];

export function Header({
  me,
  onMenuClick,
  onToggleCollapse,
  hasUnread,
}: {
  me: Me;
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  hasUnread?: boolean;
}) {
  const canUpgrade = PLAN_ORDER.indexOf(me.plan) < PLAN_ORDER.length - 1;

  function handleHamburgerClick() {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      onToggleCollapse();
    } else {
      onMenuClick();
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-[var(--header-h)] w-full items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={handleHamburgerClick}
        aria-label="Toggle sidebar"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-transparent p-0 text-muted outline-none transition-colors hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Menu size={20} />
      </button>

      <Link to="/" className="logo flex shrink-0 items-center gap-2 text-[19px]" aria-label="Botfolks home">
        <Logo size={24} />
        Bot<span>folks</span>
      </Link>

      <div className="hidden flex-1 justify-center lg:flex">
        <div className="relative w-[360px] max-w-full">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Search bots, settings…"
            aria-label="Search"
            className="h-9 w-full rounded-md border border-line bg-[var(--field-bg)] pl-9 pr-16 text-[13px] text-text placeholder:text-subtle outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line-strong px-1.5 py-0.5 text-[13px] font-medium text-subtle">
            Ctrl K
          </span>
        </div>
      </div>
      <div className="flex-1 lg:hidden" />

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <CreditsMenu credits={me.credits} />

        <div className="hidden items-center gap-2 md:flex">
          <span className="whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[13px] font-semibold text-muted">
            {PLANS[me.plan].name}
          </span>
          {canUpgrade && (
            <Button size="sm" onClick={() => (window.location.href = '/billing')} icon={<ArrowUpRight size={14} />}>
              Upgrade
            </Button>
          )}
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-md bg-transparent p-0 text-muted outline-none transition-colors hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Bell size={18} />
          {hasUnread && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />}
        </button>

        <UserMenu me={me} />
      </div>
    </header>
  );
}
