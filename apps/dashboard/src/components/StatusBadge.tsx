type BotStatus = 'draft' | 'training' | 'ready' | 'error';

const META: Record<BotStatus, { label: string; dot: string; text: string; bg: string; pulse?: boolean }> = {
  draft: { label: 'Draft', dot: 'bg-muted', text: 'text-muted', bg: 'bg-white/[.06]' },
  training: { label: 'Training', dot: 'bg-[#60a5fa]', text: 'text-[#93c5fd]', bg: 'bg-[#60a5fa]/10', pulse: true },
  ready: { label: 'Live', dot: 'bg-ok', text: 'text-ok', bg: 'bg-ok/10' },
  error: { label: 'Error', dot: 'bg-err', text: 'text-err', bg: 'bg-err/10' },
};

export function StatusBadge({ status }: { status: string }) {
  const m = META[status as BotStatus] ?? META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium ${m.bg} ${m.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${m.pulse ? 'animate-pulse-soft' : ''}`} />
      {m.label}
    </span>
  );
}
