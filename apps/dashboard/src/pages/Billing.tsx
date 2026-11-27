import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Zap, Check, X, Receipt } from 'lucide-react';
import { CREDIT_USD, FREE_BONUS_CREDITS, VOICE_ENABLED_PLANS, type PlanId } from '@botfolks/shared';
import { api, post } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatMoney } from '../lib/format';
import type { Me } from '../lib/types';

export default function Billing() {
  const { me } = useOutletContext<{ me: Me }>();
  const q = useQuery({ queryKey: ['plans'], queryFn: () => api('/billing/plans') });
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const justPaid = new URLSearchParams(window.location.search).get('checkout') === 'success';

  async function buyNow(planId: string) {
    setErr('');
    setLoadingPlan(planId);
    try {
      const { url } = await post<{ url: string }>('/billing/checkout', { planId });
      window.location.href = url;
    } catch (e: any) {
      setErr(e.message);
      setLoadingPlan(null);
    }
  }

  if (!q.data) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse-soft rounded-lg border border-line bg-surface" />
        ))}
      </div>
    );
  }

  const { plans, packs } = q.data as { plans: Record<PlanId, any>; packs: any[] };
  const planEntries = Object.entries(plans) as [PlanId, (typeof plans)[PlanId]][];
  const currentPlan = plans[me.plan];
  const creditPct = me.plan === 'free' ? Math.min(100, Math.round((me.credits / FREE_BONUS_CREDITS) * 100)) : null;

  function featureRows(id: PlanId, p: (typeof plans)[PlanId]) {
    return [
      { included: true, label: p.chats > 0 ? `${p.chats.toLocaleString()} AI chats every month` : 'Pay-as-you-go with credits' },
      { included: true, label: `Run up to ${p.bots} chatbot${p.bots > 1 ? 's' : ''}` },
      { included: p.fileTraining, label: 'Trained on your website, documents & files' },
      { included: p.leadCapture, label: 'Capture visitor leads automatically' },
      { included: p.alwaysOnline, label: 'Answers customers 24/7, instantly' },
      { included: p.customColor, label: 'Customized widget colors to match your brand' },
      { included: VOICE_ENABLED_PLANS.includes(id), label: 'Voice chat support' },
      { included: p.whiteLabel, label: 'White-label — your own name & branding, shown to your customers' },
    ];
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Plans &amp; billing</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Manage your subscription, credits and payment history.</p>
      </div>

      {justPaid && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-ok/30 bg-ok/10 px-4 py-3 text-[14px] text-ok">
          <CheckCircle2 size={17} /> Payment received — your plan will update as soon as Dodo confirms it (usually a few seconds).
        </div>
      )}
      {err && (
        <div className="mb-5 flex items-center gap-2 rounded-md border border-err/30 bg-err/10 px-4 py-3 text-[14px] text-err">
          <AlertCircle size={17} /> {err}
        </div>
      )}

      {/* Current plan + credits */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
          <span className="text-[13px] font-medium text-muted">Current plan</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-bold tracking-[-0.02em] text-text">{currentPlan.name}</span>
            {currentPlan.monthly > 0 && <span className="whitespace-nowrap text-[14px] text-muted">{formatMoney(currentPlan.monthly)}/mo</span>}
          </div>
          <p className="mt-2 text-[14px] text-muted">
            {currentPlan.chats > 0 ? `${currentPlan.chats.toLocaleString()} chats / month · ` : ''}
            {currentPlan.bots} bot{currentPlan.bots > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-muted">Credits balance</span>
            <Zap size={16} className="text-accent" />
          </div>
          <div className="mt-1 text-[28px] font-bold tabular-nums tracking-[-0.02em] text-text">{me.credits.toLocaleString()}</div>
          {creditPct !== null ? (
            <>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[.06]">
                <div className="h-full rounded-full bg-[image:var(--accent-grad)]" style={{ width: `${creditPct}%` }} />
              </div>
              <p className="mt-2 text-[13px] text-muted">{me.credits} of {FREE_BONUS_CREDITS} free credits remaining</p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">1 credit = {formatMoney(CREDIT_USD)}</p>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <h2 className="mb-5 text-[22px] font-semibold text-text">Compare plans</h2>
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {planEntries.map(([id, p]) => {
          const isCurrent = id === me.plan;
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-lg border p-5 transition-colors duration-150 sm:p-6
                ${isCurrent ? 'border-accent bg-gradient-to-b from-accent/[.08] to-surface shadow-glow-accent' : 'border-line bg-surface hover:border-line-strong'}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[image:var(--accent-grad)] px-3 py-1 text-[13px] font-bold uppercase tracking-wide text-white">
                  Current plan
                </span>
              )}
              <h3 className="text-[18px] font-semibold text-text">{p.name}</h3>
              <div className="mt-2 text-[32px] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-text">
                {formatMoney(p.monthly)}<small className="text-[14px] font-semibold text-muted">/mo</small>
              </div>
              <div className="mt-1 whitespace-nowrap text-[13px] text-muted">or {formatMoney(p.yearly)}/year</div>
              <ul className="my-5 flex flex-1 flex-col gap-3">
                {featureRows(id, p).map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-[15px] leading-snug ${f.included ? 'text-text' : 'text-muted/60'}`}>
                    {f.included ? (
                      <Check size={17} strokeWidth={2.75} className="mt-0.5 shrink-0 text-ok" />
                    ) : (
                      <X size={17} strokeWidth={2.75} className="mt-0.5 shrink-0 text-muted/40" />
                    )}
                    <span className={f.included ? 'font-medium' : 'line-through'}>{f.label}</span>
                  </li>
                ))}
              </ul>
              {id === 'free' ? (
                <Button variant="outline" disabled className="w-full">{isCurrent ? 'Current plan' : 'Included'}</Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent}
                  loading={loadingPlan === id}
                  onClick={() => buyNow(id)}
                >
                  {isCurrent ? 'Current plan' : loadingPlan === id ? 'Redirecting…' : 'Upgrade'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Credit packs */}
      <h2 className="mb-5 text-[22px] font-semibold text-text">Credit packs (Free plan)</h2>
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {packs.map((p: any) => (
          <div key={p.id} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            <div className="text-[22px] font-bold tabular-nums text-text">{formatMoney(p.usd)}</div>
            <div className="mt-1 text-[14px] text-muted">{p.credits.toLocaleString()} credits</div>
            <Button variant="outline" disabled title="Coming soon" className="mt-4 w-full">Buy</Button>
          </div>
        ))}
      </div>

      {/* Invoice history */}
      <h2 className="mb-5 text-[22px] font-semibold text-text">Invoice history</h2>
      <EmptyState icon={<Receipt size={22} />} title="No invoices yet" description="Your past invoices will show up here once you're on a paid plan." />
    </>
  );
}
