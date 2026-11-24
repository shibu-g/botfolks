import { Link } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';

export function CreateBotTile({ locked, limit }: { locked?: boolean; limit?: number }) {
  if (locked) {
    return (
      <Link
        to="/billing"
        className="group flex h-[250px] w-[250px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line p-5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/[.04]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[.06] text-muted transition-transform duration-150 group-hover:scale-105">
          <Lock size={20} />
        </span>
        <span className="text-[16px] font-semibold text-text">Bot limit reached</span>
        <span className="text-[13px] leading-snug text-muted">
          Your plan allows {limit} bot{limit === 1 ? '' : 's'}. Upgrade for more.
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/bots/new"
      className="group flex h-[250px] w-[250px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-line-strong p-5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/[.04]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-150 group-hover:scale-105">
        <Plus size={22} />
      </span>
      <span className="text-[16px] font-semibold text-text">Create new bot</span>
      <span className="text-[13px] leading-snug text-muted">Train &amp; embed in minutes</span>
    </Link>
  );
}
