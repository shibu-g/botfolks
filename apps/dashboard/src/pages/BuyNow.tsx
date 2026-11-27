import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { VOICE_ENABLED_PLANS, type PlanId } from '@botfolks/shared';
import { api, post } from '../lib/api';
import { formatMoney } from '../lib/format';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { AuthBackground } from '../components/AuthBackground';

const BUYABLE_PLANS: PlanId[] = ['starter', 'growth', 'agency'];

export default function BuyNow() {
  const { planId } = useParams<{ planId: string }>();
  const q = useQuery({ queryKey: ['plans'], queryFn: () => api('/billing/plans') });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!planId || !BUYABLE_PLANS.includes(planId as PlanId)) return <Navigate to="/signup" replace />;

  const plan = q.data?.plans?.[planId];
  const emailTaken = /already has an account/i.test(err);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const body = { ...Object.fromEntries(new FormData(e.currentTarget)), planId };
      const { url } = await post<{ url: string }>('/billing/public-checkout', body);
      window.location.href = url;
    } catch (x: any) {
      setErr(x.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthBackground />
      <Link to="/" className="auth-back">
        <Icon size={15}><path d="M12 19l-7-7 7-7" /><path d="M5 12h14" /></Icon>
        Back to home
      </Link>
      <div className="auth-card">
        <div className="auth-logo"><Logo size={38} /></div>
        <h1>Get {plan ? plan.name : 'started'}</h1>
        <p className="auth-sub">
          {plan ? <>{formatMoney(plan.monthly)}/mo &middot; create your account and pay securely with Dodo Payments.</> : 'Loading plan details…'}
        </p>

        {plan && (
          <div className="auth-perk">
            <Icon size={15}><path d="m4 12 5 5L20 6" /></Icon>
            {plan.bots} bot{plan.bots > 1 ? 's' : ''} &middot; {plan.chats.toLocaleString()} chats/month
            {VOICE_ENABLED_PLANS.includes(planId as PlanId) ? ' · voice chat' : ''}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="buy-name">Your name</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon size={16}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></Icon>
              </span>
              <input id="buy-name" name="name" placeholder="Jane Doe" autoComplete="name" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="buy-email">Email</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon size={16}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Icon>
              </span>
              <input id="buy-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="buy-password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon size={16}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Icon>
              </span>
              <input
                id="buy-password" name="password" type={showPw ? 'text' : 'password'}
                placeholder="8+ characters" autoComplete="new-password" className="has-toggle" minLength={8} required
              />
              <button type="button" className="toggle-visibility" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw
                  ? <Icon size={16}><path d="M3 3l18 18" /><path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c5 0 9 4.5 9 7 0 .9-.5 2-1.4 3.1M6.1 6.9C4 8.3 3 10.1 3 12c0 2.5 4 7 9 7 1.1 0 2.1-.2 3-.6" /></Icon>
                  : <Icon size={16}><path d="M2.5 12S5.5 5.5 12 5.5 21.5 12 21.5 12 18.5 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Icon>}
              </button>
            </div>
          </div>

          {err && (
            <div className="auth-alert">
              <Icon size={15}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></Icon>
              <span>{err}{emailTaken && <> <Link to="/login">Log in</Link></>}</span>
            </div>
          )}

          <button className="btn-primary" disabled={loading || !plan}>
            {loading && <span className="spinner" />}
            {loading ? 'Redirecting to payment…' : 'Continue to payment'}
          </button>
        </form>

        <p className="auth-footer-link">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
