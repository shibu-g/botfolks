import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Type, Globe, MessageSquare, User, Lock, AlertCircle } from 'lucide-react';
import { api, post, patch } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const BOT_TYPES = [
  {
    id: 'support',
    label: 'Customer support',
    description: 'Answers questions and resolves issues using your website content.',
    systemPrompt: 'You are a helpful customer support assistant. Answer questions using the provided website content. Be concise and friendly.',
  },
  {
    id: 'sales',
    label: 'Sales assistant',
    description: 'Helps visitors compare plans and nudges them toward a purchase.',
    systemPrompt: 'You are a sales assistant. Help visitors understand the product, compare plans, and guide them toward purchasing. Be persuasive but honest.',
  },
  {
    id: 'leads',
    label: 'Lead generation',
    description: 'Collects visitor contact details and what they need.',
    systemPrompt: 'You are a lead-generation assistant. Engage visitors, answer basic questions, and collect their name, email and needs for follow-up.',
  },
  {
    id: 'docs',
    label: 'Docs / FAQ helper',
    description: 'Answers questions from your documentation or FAQ.',
    systemPrompt: "You are a documentation assistant. Answer questions precisely using the provided content, and say when you don't know.",
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Start from scratch and write your own instructions.',
    systemPrompt: '',
  },
] as const;

const COLOR_PRESETS = ['#7C5CFF', '#6366F1', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
const DEFAULT_COLOR = COLOR_PRESETS[0];

const STEPS = [
  { n: 1, label: 'Basics' },
  { n: 2, label: 'Personality' },
  { n: 3, label: 'Preview' },
];

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-10 flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors duration-150
                ${step > s.n ? 'border-accent bg-accent text-white' : step === s.n ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'}`}
            >
              {step > s.n ? <Check size={16} /> : s.n}
            </div>
            <span className={`whitespace-nowrap text-[13px] font-medium ${step >= s.n ? 'text-text' : 'text-muted'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-3 h-px flex-1 transition-colors duration-150 ${step > s.n ? 'bg-accent' : 'bg-line'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className="text-right text-[14px] font-medium text-text">{value}</span>
    </div>
  );
}

export default function BotWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { show } = useToast();
  const { id } = useParams();
  const isEdit = !!id;

  const existing = useQuery({
    queryKey: ['bot', id],
    queryFn: () => api<any>(`/bots/${id}`),
    enabled: isEdit,
  });
  const hydrated = useRef(false);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Step 1
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');

  // Step 2
  const [botType, setBotType] = useState<(typeof BOT_TYPES)[number]['id']>('support');
  const [instructions, setInstructions] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Prefill from the existing bot once it loads — only once, so a background
  // refetch doesn't clobber edits the user is mid-typing.
  useEffect(() => {
    if (!isEdit || !existing.data || hydrated.current) return;
    hydrated.current = true;
    const b = existing.data;
    setName(b.name ?? '');
    const langs = parseJsonField<string[]>(b.languages, ['en']);
    setLanguage(langs[0] ?? 'en');
    setBotType('custom');
    setInstructions(b.system_prompt ?? '');
    const theme = parseJsonField<{ primaryColor?: string }>(b.theme_json, {});
    setColor(theme.primaryColor || DEFAULT_COLOR);
  }, [isEdit, existing.data]);

  const selectedType = BOT_TYPES.find((t) => t.id === botType)!;
  const selectedLanguage = LANGUAGES.find((l) => l.value === language)!;

  function handleNext() {
    if (step === 1) {
      setNameError('');
      setUrlError('');
      let hasError = false;
      if (!name.trim()) {
        setNameError('Bot name is required.');
        hasError = true;
      }
      if (!isValidUrl(websiteUrl)) {
        setUrlError('Enter a valid URL, e.g. https://example.com');
        hasError = true;
      }
      if (hasError) return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  async function confirmCreate() {
    setSubmitError('');
    setSubmitting(true);
    try {
      const systemPrompt = instructions.trim() || selectedType.systemPrompt || undefined;
      const { id: newId } = await post<{ id: number }>('/bots', {
        name: name.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        languages: [language],
        systemPrompt,
      });
      if (color !== DEFAULT_COLOR) {
        try {
          await patch(`/bots/${newId}`, { theme: { primaryColor: color } });
        } catch {
          // Theme is a nice-to-have — don't block bot creation on it.
        }
      }
      qc.invalidateQueries({ queryKey: ['bots'] });
      show(websiteUrl ? 'Bot created — training started.' : 'Bot created.');
      navigate(`/bots/${newId}`);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit() {
    setSubmitError('');
    setSubmitting(true);
    try {
      const systemPrompt = instructions.trim() || selectedType.systemPrompt || '';
      await patch(`/bots/${id}`, {
        name: name.trim(),
        systemPrompt,
        languages: [language],
        theme: { primaryColor: color },
      });
      qc.invalidateQueries({ queryKey: ['bot', id] });
      qc.invalidateQueries({ queryKey: ['bots'] });
      show('Bot updated.');
      navigate(`/bots/${id}`);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && !existing.data) {
    return <div className="mx-auto h-96 max-w-[840px] animate-pulse-soft rounded-lg border border-line bg-surface" />;
  }

  return (
    <div className="mx-auto max-w-[840px]">
      <button
        type="button"
        onClick={() => navigate(isEdit ? `/bots/${id}` : '/bots')}
        className="mb-6 flex items-center gap-1.5 bg-transparent text-[13px] font-medium text-muted outline-none transition-colors hover:text-text"
      >
        <ArrowLeft size={15} /> {isEdit ? 'Back to bot' : 'Back to bots'}
      </button>

      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">{isEdit ? 'Edit bot' : 'Create a new bot'}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {isEdit ? 'Update your bot’s details, personality and branding.' : 'Set up your bot in three quick steps.'}
        </p>
      </div>

      <Stepper step={step} />

      <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-[18px] font-semibold text-text">The basics</h2>
            <Input
              label="Bot name"
              icon={<Type size={16} />}
              placeholder="e.g. Acme Support Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              autoFocus
            />
            {!isEdit && (
              <Input
                label="Website URL"
                icon={<Globe size={16} />}
                type="url"
                placeholder="https://yourwebsite.com (to train on)"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                error={urlError}
                hint="Optional — Botfolks will crawl it to train your bot. You can also add sources later."
              />
            )}
            <Select label="Primary language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-[18px] font-semibold text-text">Personality &amp; branding</h2>
              <p className="mt-1 text-[14px] text-muted">Choose what your bot does and how it looks to visitors.</p>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-muted">Bot type</label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {BOT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setBotType(t.id)}
                    className={`flex flex-col gap-1 whitespace-normal rounded-md border p-3.5 text-left transition-colors duration-150
                      ${botType === t.id ? 'border-accent bg-accent/[.08]' : 'border-line bg-transparent hover:border-line-strong'}`}
                  >
                    <span className="text-[14px] font-semibold text-text">{t.label}</span>
                    <span className="text-[13px] leading-snug text-muted">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="instructions" className="mb-2 block text-[13px] font-semibold text-muted">
                Custom instructions <span className="text-subtle">(optional)</span>
              </label>
              <textarea
                id="instructions"
                rows={3}
                placeholder={selectedType.systemPrompt || 'Tell your bot how to behave…'}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full rounded-md border border-line bg-[var(--field-bg)] p-3 text-[14px] text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-muted">Brand color</label>
              <div className="flex flex-wrap items-center gap-2.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 shrink-0 rounded-full transition-transform duration-150 hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                    style={{ background: c, ['--tw-ring-color' as any]: c }}
                  />
                ))}
                <label className="ml-1 flex h-8 items-center gap-2 rounded-md border border-line bg-[var(--field-bg)] px-2.5 text-[13px] text-muted">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer appearance-none overflow-hidden rounded-full border-0 bg-transparent p-0"
                  />
                  <span className="tabular-nums">{color}</span>
                </label>
              </div>
            </div>

            <div className="rounded-md border border-line bg-[var(--field-bg)]/40 p-4">
              <p className="text-[14px] font-semibold text-text">Bot admin login</p>
              <p className="mt-1 text-[13px] text-muted">
                Set credentials for this bot's own admin panel — wiring this up to a real login is coming soon.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  icon={<User size={16} />}
                  placeholder="Admin username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  aria-label="Bot admin username"
                />
                <Input
                  icon={<Lock size={16} />}
                  type="password"
                  placeholder="Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  aria-label="Bot admin password"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-[18px] font-semibold text-text">{isEdit ? 'Preview & save' : 'Preview & confirm'}</h2>
              <p className="mt-1 text-[14px] text-muted">This is roughly how your bot will greet visitors.</p>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-err/30 bg-err/10 px-4 py-3 text-[14px] text-err">
                <AlertCircle size={17} className="shrink-0" /> {submitError}
              </div>
            )}

            <div className="flex flex-col items-start gap-8 sm:flex-row sm:justify-center">
              <div className="flex shrink-0 flex-col items-center gap-4 self-center">
                <div className="flex h-[320px] w-[260px] flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-elevated">
                  <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: color }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[13px] font-bold">
                      {name.slice(0, 1).toUpperCase() || 'B'}
                    </span>
                    <span className="truncate text-[14px] font-semibold">{name || 'Your bot'}</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/[.06] px-3 py-2 text-[13px] leading-snug text-text">
                      Hi! I'm {name || 'your bot'} 👋 {selectedType.id !== 'custom' ? selectedType.description : 'How can I help you today?'}
                    </div>
                  </div>
                  <div className="border-t border-line p-3">
                    <div className="h-9 w-full rounded-full bg-[var(--field-bg)]" />
                  </div>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-elevated"
                  style={{ background: color }}
                  aria-hidden="true"
                >
                  <MessageSquare size={20} />
                </div>
              </div>

              <div className="w-full max-w-sm flex-1 rounded-md border border-line p-5">
                <SummaryRow label="Name" value={name} />
                {!isEdit && <SummaryRow label="Website" value={websiteUrl || 'Not set'} />}
                <SummaryRow label="Language" value={selectedLanguage.label} />
                <SummaryRow label="Bot type" value={selectedType.label} />
                <SummaryRow
                  label="Brand color"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: color }} />
                      {color}
                    </span>
                  }
                />
                <SummaryRow label="Admin login" value={adminUsername || 'Not set yet'} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => (step === 1 ? navigate(isEdit ? `/bots/${id}` : '/bots') : setStep((s) => s - 1))}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>Continue</Button>
        ) : (
          <Button loading={submitting} onClick={isEdit ? saveEdit : confirmCreate}>
            {isEdit ? 'Save changes' : 'Confirm & create bot'}
          </Button>
        )}
      </div>
    </div>
  );
}
