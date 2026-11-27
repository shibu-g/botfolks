import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import AppLayout from './components/layout/AppLayout';
import { LogoutOverlay } from './components/layout/LogoutOverlay';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuyNow from './pages/BuyNow';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Bots from './pages/Bots';
import BotWizard from './pages/BotWizard';
import BotDetail from './pages/BotDetail';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/ConversationDetail';
import Leads from './pages/Leads';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  const location = useLocation();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me') });
  const [loggingOut, setLoggingOut] = useState(false);

  // Rendered here (outside the authed/unauthed route split below) so it stays
  // mounted through the swap from AppLayout to Login instead of unmounting
  // with it.
  useEffect(() => {
    const onStart = () => setLoggingOut(true);
    const onEnd = () => setLoggingOut(false);
    document.addEventListener('botfolks:logout-start', onStart);
    document.addEventListener('botfolks:logout-end', onEnd);
    return () => {
      document.removeEventListener('botfolks:logout-start', onStart);
      document.removeEventListener('botfolks:logout-end', onEnd);
    };
  }, []);

  if (me.isLoading) return <div className="center">Loading…</div>;
  const authed = !!me.data;
  // Once authed flips true, this re-render replaces /login's element with this
  // Navigate before Login's own post-submit redirect ever gets a chance to run
  // (the route's element itself changes, unmounting Login) — so this is the one
  // place that actually has to know where to send the user back to.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  return (
    <>
      <Routes>
        <Route path="/login" element={authed ? <Navigate to={from} replace /> : <Login />} />
        <Route path="/signup" element={authed ? <Navigate to={from} replace /> : <Signup />} />
        <Route path="/buy/:planId" element={authed ? <Navigate to="/billing" replace /> : <BuyNow />} />
        {authed ? (
          <Route element={<AppLayout me={me.data} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bots" element={<Bots />} />
            <Route path="/bots/new" element={<BotWizard />} />
            <Route path="/bots/:id/edit" element={<BotWizard />} />
            <Route path="/bots/:id" element={<BotDetail />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/conversations/:id" element={<ConversationDetail />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
          </>
        )}
      </Routes>
      {loggingOut && <LogoutOverlay />}
    </>
  );
}
