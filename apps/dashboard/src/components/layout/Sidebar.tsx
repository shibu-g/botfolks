import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bot, CreditCard, Settings, MessageSquare, Users, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavEntry =
  | { kind: 'link'; to: string; end: boolean; label: string; icon: LucideIcon }
  | { kind: 'soon'; label: string; icon: LucideIcon };

const GROUPS: { label: string; items: NavEntry[] }[] = [
  {
    label: 'Workspace',
    items: [
      { kind: 'link', to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
      { kind: 'link', to: '/bots', end: false, label: 'Bots', icon: Bot },
      { kind: 'soon', label: 'Conversations', icon: MessageSquare },
      { kind: 'soon', label: 'Leads', icon: Users },
    ],
  },
  {
    label: 'Account',
    items: [
      { kind: 'link', to: '/billing', end: false, label: 'Billing & plans', icon: CreditCard },
      { kind: 'link', to: '/settings', end: false, label: 'Settings', icon: Settings },
    ],
  },
];

function GroupLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="mx-3 my-2 h-px bg-line" aria-hidden="true" />;
  return (
    <p className="mb-1.5 px-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-subtle">{children}</p>
  );
}

function NavItems({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex flex-col gap-5 px-3">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <GroupLabel collapsed={collapsed}>{group.label}</GroupLabel>
          <div className="flex flex-col gap-1">
            {group.items.map((item) =>
              item.kind === 'link' ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-[15px] font-medium outline-none
                     transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/50
                     ${collapsed ? 'justify-center' : ''}
                     ${isActive ? 'bg-accent/[.12] text-text' : 'text-muted hover:bg-white/[.04] hover:text-text'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[image:var(--accent-grad)]" />}
                      <item.icon size={20} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ) : (
                <div
                  key={item.label}
                  title={collapsed ? `${item.label} — coming soon` : undefined}
                  className={`flex h-11 cursor-not-allowed items-center gap-3 rounded-[10px] px-3.5 text-[15px] font-medium text-subtle
                    ${collapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={20} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && (
                    <span className="whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-[13px] font-semibold uppercase tracking-wide text-subtle">
                      Soon
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UpgradeCard({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="mx-3 rounded-lg border border-accent/25 bg-gradient-to-b from-accent/[.1] to-transparent p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
        <Sparkles size={16} />
      </div>
      <p className="text-[14px] font-semibold text-text">You're on the Free plan</p>
      <p className="mt-1 text-[13px] leading-snug text-muted">Upgrade for more chats, bots and file training.</p>
      <NavLink
        to="/billing"
        className="mt-3 flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-[image:var(--accent-grad)] text-[13px] font-semibold text-white transition-transform duration-150 hover:-translate-y-px"
      >
        Upgrade plan
      </NavLink>
    </div>
  );
}

export function Sidebar({
  me,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  me: { plan: string };
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-line bg-surface pt-[var(--header-h)]
          transition-[width] duration-[250ms] ease-out lg:flex ${collapsed ? 'w-[var(--sidebar-w-collapsed)]' : 'w-[var(--sidebar-w)]'}`}
      >
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-5">
          <NavItems collapsed={collapsed} />
        </div>
        <div className="flex flex-col gap-3 pb-5">{me.plan === 'free' && <UpgradeCard collapsed={collapsed} />}</div>
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onCloseMobile} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative z-10 flex h-full w-[min(84vw,300px)] animate-slide-in-left flex-col border-r border-line bg-surface py-5"
          >
            <div className="mb-4 px-4">
              <span className="logo flex items-center gap-2 text-[19px]">Bot<span>folks</span></span>
            </div>
            <NavItems collapsed={false} />
            <div className="mt-auto px-0">{me.plan === 'free' && <UpgradeCard collapsed={false} />}</div>
          </div>
        </div>
      )}
    </>
  );
}
