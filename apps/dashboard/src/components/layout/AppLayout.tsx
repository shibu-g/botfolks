import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../ui/Toast';
import type { Me } from '../../lib/types';

const COLLAPSE_KEY = 'botfolks.sidebarCollapsed';
const THEME_KEY = 'botfolks.theme';

export default function AppLayout({ me }: { me: Me }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'dark');

  useEffect(() => {
    const onThemeChange = (e: Event) => setTheme((e as CustomEvent<string>).detail);
    document.addEventListener('botfolks:theme', onThemeChange);
    return () => document.removeEventListener('botfolks:theme', onThemeChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Esc closes the mobile drawer from anywhere.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <ToastProvider>
      <div className="app-shell min-h-screen bg-bg text-text" data-theme={theme}>
        <Header me={me} onMenuClick={() => setMobileOpen(true)} onToggleCollapse={() => setCollapsed((c) => !c)} />
        <Sidebar me={me} collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main
          className={`relative transition-[padding] duration-[250ms] ease-out ${collapsed ? 'lg:pl-[var(--sidebar-w-collapsed)]' : 'lg:pl-[var(--sidebar-w)]'}`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.12]"
            style={{ background: 'radial-gradient(640px 320px at 30% 0%, var(--accent), transparent 70%)' }}
          />
          <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
            <Outlet context={{ me } satisfies { me: Me }} />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
