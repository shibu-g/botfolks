import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Moon, Sun, Copy, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { Select } from '../components/ui/Select';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import type { BotListItem } from '../components/BotCard';

const THEME_KEY = 'botfolks.theme';
const WIDGET_URL = import.meta.env.VITE_WIDGET_URL ?? 'https://widget.botfolks.in/v1.js';
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.botfolks.in';

const TABS = ['General', 'Notifications', 'API & Embed', 'Danger zone'] as const;
type Tab = (typeof TABS)[number];

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'bf_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function GeneralTab() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem(THEME_KEY) as 'dark' | 'light') ?? 'dark');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.dispatchEvent(new CustomEvent('botfolks:theme', { detail: theme }));
  }, [theme]);

  return (
    <div className="flex flex-col divide-y divide-line">
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="text-[14.5px] font-medium text-text">Appearance</p>
          <p className="text-[13px] text-muted">Switch between dark and light for the dashboard.</p>
        </div>
        <div className="flex rounded-md border border-line p-1">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${theme === 'dark' ? 'bg-white/[.08] text-text' : 'bg-transparent text-muted'}`}
          >
            <Moon size={14} /> Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${theme === 'light' ? 'bg-white/[.08] text-text' : 'bg-transparent text-muted'}`}
          >
            <Sun size={14} /> Light
          </button>
        </div>
      </div>
      <div className="py-4">
        <Select label="Language" defaultValue="en" options={[{ value: 'en', label: 'English' }]} />
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [botTraining, setBotTraining] = useState(true);
  const [newLeads, setNewLeads] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  return (
    <div className="flex flex-col divide-y divide-line">
      <Toggle label="Bot training updates" description="Email me when a bot finishes training or fails." checked={botTraining} onChange={setBotTraining} />
      <Toggle label="New leads" description="Email me when a visitor leaves their contact details." checked={newLeads} onChange={setNewLeads} />
      <Toggle label="Product updates & tips" description="Occasional emails about new features." checked={productUpdates} onChange={setProductUpdates} />
    </div>
  );
}

function ApiEmbedTab() {
  const { show } = useToast();
  const bots = useQuery({ queryKey: ['bots'], queryFn: () => api<BotListItem[]>('/bots') });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('botfolks.apiKey') || randomKey());
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => localStorage.setItem('botfolks.apiKey', apiKey), [apiKey]);

  const firstBot = bots.data?.[0];
  const snippet = firstBot
    ? `<script src="${WIDGET_URL}" data-bot="${firstBot.public_key}" data-api="${API_URL}" async></script>`
    : '';

  function copy(text: string, mark: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    mark(true);
    setTimeout(() => mark(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[14.5px] font-medium text-text">API key</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={apiKey} className="font-mono text-[13px]" aria-label="API key" />
          <div className="flex gap-2">
            <Button variant="secondary" icon={copiedKey ? <Check size={14} /> : <Copy size={14} />} onClick={() => copy(apiKey, setCopiedKey)}>
              {copiedKey ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              icon={<RefreshCw size={14} />}
              onClick={() => { setApiKey(randomKey()); show('API key regenerated.'); }}
            >
              Regenerate
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-muted">Keep this key secret. Regenerating it invalidates the previous key.</p>
      </div>

      <div>
        <p className="mb-2 text-[14.5px] font-medium text-text">Embed snippet</p>
        {firstBot ? (
          <>
            <pre className="overflow-x-auto rounded-md border border-line bg-[var(--field-bg)] p-3 text-[13px] text-text">{snippet}</pre>
            <Button
              className="mt-3"
              variant="secondary"
              size="sm"
              icon={copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
              onClick={() => copy(snippet, setCopiedSnippet)}
            >
              {copiedSnippet ? 'Copied' : 'Copy snippet'}
            </Button>
          </>
        ) : (
          <p className="text-[13.5px] text-muted">Create a bot first to get its embed snippet.</p>
        )}
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="rounded-lg border border-err/30 bg-err/[.04] p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-err" />
        <div>
          <p className="text-[14.5px] font-semibold text-text">Delete account</p>
          <p className="mt-1 text-[13.5px] text-muted">
            Permanently delete your account, all bots and their data. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>Delete account</Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <p className="text-[13.5px] text-muted">
          This will permanently delete your workspace, bots and training data. Type <strong className="text-text">DELETE</strong> to confirm.
        </p>
        <Input className="mt-3" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" autoFocus />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" disabled={confirmText !== 'DELETE'} title="Coming soon">Delete my account</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('General');

  return (
    <>
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Settings</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Configure your workspace preferences.</p>
      </div>

      <div role="tablist" aria-label="Settings sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 whitespace-nowrap bg-transparent px-4 py-3 text-[14px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50
              ${tab === t ? 'text-text' : 'text-muted hover:text-text'}`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[image:var(--accent-grad)]" />}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        {tab === 'General' && <GeneralTab />}
        {tab === 'Notifications' && <NotificationsTab />}
        {tab === 'API & Embed' && <ApiEmbedTab />}
        {tab === 'Danger zone' && <DangerZoneTab />}
      </div>
    </>
  );
}
