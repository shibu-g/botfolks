import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Code2, Trash2, Bot as BotIcon, Copy, Check } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatDate } from '../lib/format';

const WIDGET_URL = import.meta.env.VITE_WIDGET_URL ?? 'https://widget.botfolks.in/v1.js';
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.botfolks.in';

export interface BotListItem {
  id: number;
  code: string;
  name: string;
  status: string;
  public_key: string;
  created_at: string;
}

export function BotCard({ bot }: { bot: BotListItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const embed = `<script src="${WIDGET_URL}" data-bot="${bot.public_key}" data-api="${API_URL}" async></script>`;

  return (
    <div className="group relative h-[250px] w-[250px] rounded-lg border border-line bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-elevated">
      <div className="absolute right-3 top-3 z-10" ref={menuRef}>
        <button
          type="button"
          aria-label="Bot options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-muted outline-none transition-colors hover:bg-white/[.06] hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <MoreHorizontal size={18} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 overflow-hidden rounded-md border border-line bg-surface-2 py-1 shadow-elevated animate-scale-in"
          >
            <Link
              role="menuitem"
              to={`/bots/${bot.code}/edit`}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 bg-transparent px-3 py-2 text-left text-[13.5px] text-text hover:bg-white/[.06]"
            >
              <Pencil size={15} className="text-muted" /> Edit
            </Link>
            <button
              role="menuitem"
              onClick={() => { setMenuOpen(false); setEmbedOpen(true); }}
              className="flex w-full items-center gap-2.5 bg-transparent px-3 py-2 text-left text-[13.5px] text-text hover:bg-white/[.06]"
            >
              <Code2 size={15} className="text-muted" /> Get embed code
            </button>
            <button
              role="menuitem"
              disabled
              title="Coming soon"
              className="flex w-full cursor-not-allowed items-center gap-2.5 bg-transparent px-3 py-2 text-left text-[13.5px] text-err/50"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </div>

      <Link to={`/bots/${bot.code}`} className="flex h-full flex-col">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[image:var(--accent-grad)] text-[16px] font-bold text-white">
          {bot.name.slice(0, 1).toUpperCase() || <BotIcon size={18} />}
        </span>

        <p className="mt-4 line-clamp-2 pr-6 text-[16px] font-semibold leading-snug text-text">{bot.name}</p>

        <div className="mt-auto flex flex-col gap-2">
          <StatusBadge status={bot.status} />
          <p className="text-[13px] text-muted">Created {formatDate(bot.created_at)}</p>
        </div>
      </Link>

      <Modal open={embedOpen} onClose={() => setEmbedOpen(false)} title="Embed on your website">
        <p className="mb-3 text-[14px] text-muted">Paste this before &lt;/body&gt; on every page.</p>
        <pre className="overflow-x-auto rounded-md border border-line bg-[var(--field-bg)] p-3 text-[13px] text-text">{embed}</pre>
        <Button
          className="mt-3"
          variant="secondary"
          size="sm"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={() => {
            navigator.clipboard.writeText(embed);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copied' : 'Copy code'}
        </Button>
      </Modal>
    </div>
  );
}
