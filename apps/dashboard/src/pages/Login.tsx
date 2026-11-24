import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, post } from '../lib/api';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { AuthBackground } from '../components/AuthBackground';

export default function Login() {
  const qc = useQueryClient();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const f = new FormData(e.currentTarget);
    try {
      await post('/auth/login', Object.fromEntries(f));
      // App.tsx owns the post-login redirect (it knows the originally
      // requested page); this just has to get the session into the cache.
      const me = await api('/auth/me');
      qc.setQueryData(['me'], me);
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
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to manage your bots and conversations.</p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon size={16}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Icon>
              </span>
              <input id="login-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon size={16}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Icon>
              </span>
              <input
                id="login-password" name="password" type={showPw ? 'text' : 'password'}
                placeholder="Your password" autoComplete="current-password" className="has-toggle" required
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
              <span>{err}</span>
            </div>
          )}

          <button className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer-link">No account? <Link to="/signup">Start free</Link></p>
      </div>
    </div>
  );
}
