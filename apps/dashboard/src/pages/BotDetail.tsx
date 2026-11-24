import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Code2, Copy, Check, Globe, FileUp, HelpCircle, Users, Link2, Mic, Database, Pause, Play, Pencil } from 'lucide-react';
import { VOICE_ENABLED_PLANS } from '@botfolks/shared';
import { api, post, patch } from '../lib/api';
import { formatDate } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Toggle } from '../components/ui/Toggle';
import { useToast } from '../components/ui/Toast';

const WIDGET_URL = import.meta.env.VITE_WIDGET_URL ?? 'https://widget.botfolks.in/v1.js';
const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.botfolks.in';

function SectionCard({
  title,
  description,
  icon,
  children,
  delayMs = 0,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: React.ReactNode;
  delayMs?: number;
}) {
  return (
    <section
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'backwards' }}
      className="animate-scale-in rounded-lg border border-line bg-surface p-5 shadow-card transition-colors duration-200 hover:border-line-strong sm:p-7"
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-[18px] font-semibold text-text">{title}</h2>
          {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200
        ${live ? 'border-ok/30 bg-ok/10 text-ok' : 'border-line-strong bg-white/[.03] text-muted'}`}
    >
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-ok' : 'bg-muted'}`} />
      </span>
      {live ? 'Live' : 'Paused'}
    </span>
  );
}

export default function BotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { show } = useToast();
  const bot = useQuery({ queryKey: ['bot', id], queryFn: () => api<any>(`/bots/${id}`), refetchInterval: 5000 });
  const leads = useQuery({ queryKey: ['leads', id], queryFn: () => api<any[]>(`/bots/${id}/leads`) });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<any>('/auth/me') });
  const [copied, setCopied] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [addingFile, setAddingFile] = useState(false);
  const [savingQa, setSavingQa] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [savingLive, setSavingLive] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ['bot', id] });

  async function run(fn: () => Promise<unknown>, ok: string, setBusy?: (v: boolean) => void) {
    setBusy?.(true);
    try {
      await fn();
      show(ok);
      refresh();
    } catch (e: any) {
      show(e.message, 'error');
    } finally {
      setBusy?.(false);
    }
  }

  if (!bot.data) {
    return <div className="h-40 animate-pulse-soft rounded-lg border border-line bg-surface" />;
  }

  const b = bot.data;
  const embed = `<script src="${WIDGET_URL}" data-bot="${b.public_key}" data-api="${API_URL}" async></script>`;
  const voiceAllowedByPlan = me.data?.plan && VOICE_ENABLED_PLANS.includes(me.data.plan);

  function copyEmbed() {
    navigator.clipboard.writeText(embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function toggleVoice(next: boolean) {
    run(() => patch(`/bots/${id}`, { voiceEnabled: next }), next ? 'Voice calls enabled.' : 'Voice calls disabled.', setSavingVoice);
  }

  function toggleLive(next: boolean) {
    run(() => patch(`/bots/${id}`, { isLive: next }), next ? 'Bot is live — answering visitors.' : 'Bot paused.', setSavingLive);
  }

  const isLive = !!b.is_live;

  return (
    <div className="flex flex-col gap-10">
      <div className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-br from-surface to-surface-2 p-6 shadow-card sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[image:var(--accent-grad)] text-white shadow-glow-accent">
              <Bot size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[26px] font-bold tracking-[-0.02em] text-text sm:text-[30px]">{b.name}</h1>
                <StatusBadge status={b.status} />
              </div>
              <p className="mt-1 text-[13px] text-muted">Created {formatDate(b.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LiveIndicator live={isLive} />
            <Button variant="outline" icon={<Pencil size={15} />} onClick={() => navigate(`/bots/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant={isLive ? 'outline' : 'primary'}
              icon={isLive ? <Pause size={15} /> : <Play size={15} />}
              loading={savingLive}
              onClick={() => toggleLive(!isLive)}
            >
              {isLive ? 'Pause' : 'Go live'}
            </Button>
          </div>
        </div>
      </div>

      <SectionCard
        title="Embed on your website"
        description="Paste this snippet before the closing </body> tag on every page."
        icon={<Code2 size={18} />}
        delayMs={40}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <pre className="flex-1 overflow-x-auto rounded-md border border-line bg-[var(--field-bg)] p-3 text-[13px] text-text">{embed}</pre>
          <Button variant="secondary" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copyEmbed} className="shrink-0">
            {copied ? 'Copied' : 'Copy code'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Voice calls"
        icon={<Mic size={18} />}
        delayMs={80}
        description={
          voiceAllowedByPlan
            ? 'Visitors get chat by default and can start a voice call with the mic button. Voice minutes are metered from your credit wallet at 2.5x the underlying call cost.'
            : 'Available on the Growth and Agency plans.'
        }
      >
        <Toggle
          label="Enable voice calls for this bot"
          description={voiceAllowedByPlan ? undefined : 'Upgrade your plan to turn this on.'}
          checked={!!b.voice_enabled}
          disabled={!voiceAllowedByPlan || savingVoice}
          onChange={toggleVoice}
        />
      </SectionCard>

      <SectionCard
        title="Training sources"
        description="Websites and files Botfolks has crawled to train this bot."
        icon={<Database size={18} />}
        delayMs={120}
      >
        <div className="flex flex-col gap-6">
          {b.sources.length === 0 ? (
            <EmptyState icon={<Code2 size={22} />} title="No sources yet" description="Add a website or upload a file below to start training this bot." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[480px] border-collapse text-[14px]">
                <thead>
                  <tr className="border-b border-line text-left text-[13px] font-medium text-muted">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {b.sources.map((s: any) => (
                    <tr key={s.id} className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-white/[.025]">
                      <td className="whitespace-nowrap px-4 py-3 capitalize text-text">{s.type}</td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-text">
                        {s.type === 'file' ? s.meta_json?.name ?? 'file' : s.ref}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const url = new FormData(form).get('url');
                run(() => post(`/bots/${id}/sources/url`, { url }), 'Website added — training started.', setAddingUrl).then(() => form.reset());
              }}
            >
              <div className="flex-1">
                <Input name="url" type="url" icon={<Globe size={16} />} placeholder="https:// page or site to crawl" required aria-label="Website URL" />
              </div>
              <Button type="submit" variant="outline" loading={addingUrl} icon={<Link2 size={15} />} className="shrink-0">
                Add website
              </Button>
            </form>

            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                run(() => post(`/bots/${id}/sources/file`, new FormData(form)), 'File uploaded — training started.', setAddingFile).then(() =>
                  form.reset(),
                );
              }}
            >
              <input
                name="file"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                required
                aria-label="Training file"
                className="h-11 flex-1 rounded-md border border-line bg-[var(--field-bg)] px-3 text-[13px] text-text file:mr-3 file:h-full file:cursor-pointer file:rounded-l-md file:border-0 file:bg-surface-2 file:px-3 file:text-[13px] file:font-semibold file:text-text"
              />
              <Button type="submit" variant="outline" loading={addingFile} icon={<FileUp size={15} />} className="shrink-0">
                Upload file
              </Button>
            </form>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Custom Q&A"
        description="Exact answers for common questions — these always win over website content."
        icon={<HelpCircle size={18} />}
        delayMs={160}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget));
            run(() => post(`/bots/${id}/qa`, f), 'Q&A saved.', setSavingQa);
            e.currentTarget.reset();
          }}
        >
          <Input name="question" icon={<HelpCircle size={16} />} placeholder="Question, e.g. What is your refund policy?" required aria-label="Question" />
          <textarea
            name="answer"
            placeholder="Answer"
            rows={3}
            required
            aria-label="Answer"
            className="w-full rounded-md border border-line bg-[var(--field-bg)] p-3 text-[14px] text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <div>
            <Button type="submit" loading={savingQa}>Save Q&amp;A</Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title={`Leads (${leads.data?.length ?? 0})`}
        description="Contact details visitors have shared with this bot."
        icon={<Users size={18} />}
        delayMs={200}
      >
        {!leads.data || leads.data.length === 0 ? (
          <EmptyState icon={<Users size={22} />} title="No leads yet" description="Leads captured by this bot will show up here." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-[13px] font-medium text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Need</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.data.map((l) => (
                  <tr key={l.id} className="border-b border-line transition-colors duration-150 last:border-0 hover:bg-white/[.025]">
                    <td className="whitespace-nowrap px-4 py-3 text-text">{l.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text">{l.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text">{l.phone}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-text">{l.need}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
