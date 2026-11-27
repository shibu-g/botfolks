import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { VOICE_ENABLED_PLANS, FREE_BONUS_CREDITS, OVERAGE_PER_CHAT_USD, type PlanId } from '@botfolks/shared';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

function scrollToPricing(e: MouseEvent) {
  e.preventDefault();
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const FEATURES = [
  {
    title: 'Trained on your content',
    body: 'Paste your URL — we read your pages, PDFs and Q&A.',
    emoji: '📚',
    icon: <Icon><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M9.5 12.5h5M9.5 16h5" /></Icon>,
  },
  {
    title: 'One-line install',
    body: 'Copy one script tag into any site: WordPress, Shopify, Wix or custom.',
    emoji: '🔌',
    icon: <Icon><path d="M8 9 4 12l4 3" /><path d="m16 9 4 3-4 3" /><path d="m13 6-2 12" /></Icon>,
  },
  {
    title: 'Captures leads',
    body: 'Collects name, email and phone when visitors need a human.',
    emoji: '🧲',
    icon: <Icon><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M17 8h3M18.5 6.5v3" /></Icon>,
  },
  {
    title: 'Any language',
    body: "Replies in the visitor's language automatically.",
    emoji: '🌍',
    icon: <Icon><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" /></Icon>,
  },
  {
    title: 'Multiple bots',
    body: 'One bot per site, brand or department.',
    emoji: '🤖',
    icon: <Icon><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Icon>,
  },
  {
    title: 'White-label for agencies',
    body: 'Your logo, your brand — resell to your clients.',
    emoji: '🏷️',
    icon: <Icon><path d="M12 3 4 6.5v5c0 5 3.4 8 8 9.5 4.6-1.5 8-4.5 8-9.5v-5Z" /><path d="m9 12 2 2 4-4" /></Icon>,
  },
];

const STATS = [
  { value: '<2 min', label: 'to train a bot', emoji: '⏱️' },
  { value: '24/7', label: 'always answering', emoji: '🌙' },
  { value: '30+', label: 'languages replied in', emoji: '🌐' },
  { value: '30 days', label: 'money-back, any reason', emoji: '💸' },
];

const PLATFORMS = ['WordPress', 'Shopify', 'Wix', 'Webflow', 'Squarespace', 'Custom HTML'];

const WEEK_DATA = [
  { day: 'Mon', value: 58 },
  { day: 'Tue', value: 64 },
  { day: 'Wed', value: 61 },
  { day: 'Thu', value: 73 },
  { day: 'Fri', value: 78 },
  { day: 'Sat', value: 70 },
  { day: 'Sun', value: 86 },
];

const INSIGHT_STATS = [
  { label: 'Auto-resolved', value: '92%', pct: 92, color: 'var(--ok)' },
  { label: 'Avg first reply', value: '4s', pct: 95, color: 'var(--accent)' },
  { label: 'Leads captured', value: '312 / mo', pct: 68, color: 'var(--warn)' },
];

function Sparkline() {
  return (
    <svg viewBox="0 0 120 40" className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7cff" stopOpacity=".4" />
          <stop offset="100%" stopColor="#8b7cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,32 L17,29 L34,30 L51,22 L68,24 L85,14 L102,16 L120,6 L120,40 L0,40 Z" fill="url(#sparkFill)" stroke="none" />
      <path d="M0,32 L17,29 L34,30 L51,22 L68,24 L85,14 L102,16 L120,6" fill="none" stroke="#8b7cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineChart({ data }: { data: { day: string; value: number }[] }) {
  const w = 560;
  const h = 180;
  const pad = 20;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (d.value - min) / range) * (h - pad * 2),
    ...d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${h - pad} L${pts[0].x.toFixed(1)},${h - pad} Z`;
  const gridLines = [0, 0.33, 0.66, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="insight-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b7cff" stopOpacity=".32" />
          <stop offset="100%" stopColor="#8b7cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={pad + g * (h - pad * 2)} y2={pad + g * (h - pad * 2)} className="grid-line" />
      ))}
      <path d={areaPath} fill="url(#chartFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#8b7cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={p.day} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4.5 : 3} fill={i === pts.length - 1 ? '#8b7cff' : '#121a33'} stroke="#8b7cff" strokeWidth="2" />
      ))}
      <text x={pts[0].x} y={pts[0].y - 12} className="chart-label">{pts[0].value}%</text>
      <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 12} textAnchor="end" className="chart-label">{pts[pts.length - 1].value}%</text>
      {pts.map((p) => (
        <text key={`${p.day}-axis`} x={p.x} y={h - 2} textAnchor="middle" className="chart-axis-label">{p.day}</text>
      ))}
    </svg>
  );
}

function StatBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="insight-stat">
      <div className="insight-stat-top"><span className="muted small">{label}</span><b>{value}</b></div>
      <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

const HERO_BADGES = [
  { label: 'No setup fees', emoji: '🎉' },
  { label: 'No code to write', emoji: '🧑‍💻' },
  { label: 'No missed chats', emoji: '💬' },
];

function HeroVisual() {
  return (
    <div className="hero-visual">
      <div className="polaroid-stack">
        <div className="polaroid side side-a">
          <div className="polaroid-photo niche-a"><Icon><path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8Z" /><path d="M8 7V5.5a4 4 0 0 1 8 0V7" /></Icon></div>
          <span className="polaroid-caption">🛍️ E-commerce</span>
        </div>
        <div className="polaroid side side-b">
          <div className="polaroid-photo niche-b"><Icon><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" /></Icon></div>
          <span className="polaroid-caption">🏡 Real estate</span>
          <span className="washi-tape tape-lime" />
        </div>
        <div className="polaroid main">
          <div className="polaroid-photo mock-browser">
            <div className="mock-browser-bar">
              <span className="mock-dot r" /><span className="mock-dot y" /><span className="mock-dot g" />
              <div className="mock-url">yourstore.com</div>
            </div>
            <div className="mock-chat">
              <div className="mock-msg bot">
                <span className="mock-avatar"><Logo size={16} /></span>
                <p>👋 Hi! I'm trained on your site — ask me anything.</p>
              </div>
              <div className="mock-msg user"><p>Do you ship to Canada? 🇨🇦</p></div>
              <div className="mock-msg bot">
                <span className="mock-avatar"><Logo size={16} /></span>
                <p>✅ Yes — standard shipping takes 3–5 days. Want the full rate chart?</p>
              </div>
              <div className="mock-typing"><span /><span /><span /></div>
            </div>
          </div>
          <span className="polaroid-caption">🟢 Live on your site</span>
          <span className="washi-tape tape-purple" />
        </div>
      </div>
      <div className="float-card float-niche">
        <span className="niche-icon"><Icon><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></Icon></span>
        <div>
          <b>One bot</b>
          <span className="muted small">Any website, any niche 🌐</span>
        </div>
      </div>
      <div className="float-card float-stat">
        <span className="muted small">💬 Chats this week</span>
        <b>1,284</b>
        <Sparkline />
        <span className="float-badge up">📈 +128%</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const q = useQuery({ queryKey: ['plans'], queryFn: () => api('/billing/plans') });
  const plans: Record<string, any> = q.data?.plans ?? {};
  const packs: { id: string; usd: number; credits: number }[] = q.data?.packs ?? [];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Anonymized market comparison — figures describe a typical AI chat-widget
  // tool's public starting plan, not any named competitor.
  const typical = { price: 39, replies: 50 };
  const ours = { price: 19, chats: 805 };
  const typicalPerUnit = typical.price / typical.replies;
  const oursPerUnit = ours.price / ours.chats;
  const maxPerUnit = Math.max(typicalPerUnit, oursPerUnit);
  const oursBarPct = Math.max(6, (oursPerUnit / maxPerUnit) * 100);

  return (
    <div className="landing">
      <div className="landing-glow" />
      <div className="landing-orb orb-a" />
      <div className="landing-orb orb-b" />
      <div className="landing-inner">
        <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
          <div className="logo"><Logo size={26} />Bot<span>folks</span></div>
          <div className="navlinks">
            <a className="navlink-section" href="#insights">Product</a>
            <a className="navlink-section" href="#pricing">Pricing</a>
            <a className="navlink-section" href="#compare">Why us</a>
            <Link className="navlink-login" to="/login">Log in</Link>
            <a className="btn" href="#pricing" onClick={scrollToPricing}>Buy now</a>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-bg-grid" />
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="badge-row">
                {HERO_BADGES.map((b) => (
                  <span key={b.label} className="pill-badge"><span className="pill-dot" />{b.emoji} {b.label}</span>
                ))}
              </div>
              <h1>Your website's own <span className="pop">AI support agent</span> 🤖</h1>
              <p>Train a chatbot on your website, files and FAQs in minutes. It answers customers 24/7 🌙, in their language 🌍, and turns visitors into leads 🧲.</p>
              <div className="ctas">
                <Link className="btn" to="/signup">✨ Create your free bot</Link>
                <a className="btn ghost" href="#pricing" onClick={scrollToPricing}>💰 See pricing</a>
              </div>
              <div className="fineline">🎁 25 free credits on sign-up · no credit card required · cancel anytime</div>
            </div>
            <HeroVisual />
          </div>
        </section>

        <div className="platform-row">
          <span className="muted small">🔗 Works with any website</span>
          <div className="platform-badges">
            {PLATFORMS.map((p) => (
              <span key={p} className="platform-badge">
                <Icon><path d="M8 4 3 12l5 8M16 4l5 8-5 8" /></Icon>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="stat-strip">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <b>{s.emoji} {s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="icon-chip">{f.icon}</div>
              <h2>{f.emoji} {f.title}</h2>
              <p className="muted">{f.body}</p>
            </div>
          ))}
        </div>

        <section className="section insights" id="insights">
          <div className="landing-glow glow-insights" />
          <div className="section-head">
            <h2>📊 Real conversations, <span className="grad">real results</span></h2>
            <p className="muted">Every bot ships with a live dashboard — see what visitors ask, how fast you reply and how many turn into leads. 🚀</p>
          </div>
          <div className="insights-panel">
            <div className="insights-chart-wrap">
              <div className="insights-chart-head">
                <span className="muted small">💬 Conversations auto-resolved this week</span>
                <span className="float-badge up">📈 +18% vs last week</span>
              </div>
              <LineChart data={WEEK_DATA} />
            </div>
            <div className="insights-stats">
              {INSIGHT_STATS.map((s) => <StatBar key={s.label} {...s} />)}
            </div>
          </div>
        </section>

        <section className="section" id="compare">
          <div className="section-head">
            <h2>💰 Why Botfolks costs less</h2>
            <p className="muted">Most AI chat widgets charge a flat fee for a small bucket of replies. Here's how a typical tool's starting plan stacks up against ours — no brand names, just the math.</p>
          </div>
          <div className="compare">
            <div className="vs-card">
              <div className="who">😐 Typical AI chat tool</div>
              <div className="big">${typical.price}/mo</div>
              <div className="sub">for about {typical.replies} AI replies<br />≈ ${typicalPerUnit.toFixed(2)} per reply</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(typicalPerUnit / maxPerUnit) * 100}%` }} /></div>
            </div>
            <div className="compare-arrow">vs</div>
            <div className="vs-card us">
              <div className="who">🚀 Botfolks Starter</div>
              <div className="big">${ours.price}/mo</div>
              <div className="sub">for {ours.chats.toLocaleString()} AI chats<br />≈ ${oursPerUnit.toFixed(2)} per chat</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${oursBarPct}%` }} /></div>
            </div>
          </div>
          <div className="takeaway-banner">
            🎯 That's <b>{Math.round(ours.chats / typical.replies)}× the monthly volume</b>, for <b>under half the price</b> — roughly <b>{Math.round(typicalPerUnit / oursPerUnit)}× cheaper</b> per reply.
          </div>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 14 }}>Figures describe a typical chat-widget tool's publicly listed starting plan at the time of writing; check current pricing before relying on this comparison.</p>
        </section>

        <section className="section" id="pricing">
          <div className="section-head">
            <h2>💳 Simple pricing, no surprises</h2>
            <p className="muted">Start free. Pay per chat with credits, or pick a monthly plan with a bundle of chats included.</p>
          </div>
          <div className="grid pricing-grid">
            {Object.entries(plans).map(([id, p]) => (
              <div key={id} className={`card plan${id === 'growth' ? ' popular' : ''}`}>
                {id === 'growth' && <span className="plan-badge">🔥 Most popular</span>}
                <h2>{p.name}</h2>
                <div className="price">${p.monthly}<small>/mo</small></div>
                {p.monthly > 0 && <div className="muted small">or ${p.yearly}/year</div>}
                <ul>
                  {id === 'free' && <li>🎁 {FREE_BONUS_CREDITS} bonus credits to try it out</li>}
                  <li>{p.chats > 0 ? `💬 ${p.chats.toLocaleString()} AI chats every month` : '💳 Pay only for what you use, from $2'}</li>
                  <li>🤖 Run up to {p.bots} chatbot{p.bots > 1 ? 's' : ''}</li>
                  <li className={p.fileTraining ? '' : 'off'}>📚 Trained on your website, documents &amp; files</li>
                  <li className={p.leadCapture ? '' : 'off'}>🎯 Capture visitor leads automatically</li>
                  <li className={p.alwaysOnline ? '' : 'off'}>🌙 Answers customers 24/7, instantly</li>
                  <li className={p.customColor ? '' : 'off'}>🎨 Customized widget colors to match your brand</li>
                  <li className={VOICE_ENABLED_PLANS.includes(id as PlanId) ? '' : 'off'}>🎙️ Voice chat support</li>
                  <li className={p.whiteLabel ? '' : 'off'}>🏷️ White-label — your own name &amp; branding, shown to your customers</li>
                </ul>
                <Link className="btn" to={id === 'free' ? '/signup' : `/buy/${id}`}>{id === 'free' ? '✨ Start free' : '🚀 Buy now'}</Link>
              </div>
            ))}
            <div className="card plan">
              <h2>🤝 Custom</h2>
              <div className="price">Let's talk</div>
              <div className="muted small">&nbsp;</div>
              <ul>
                <li>📈 Higher chat volume &amp; bot limits</li>
                <li>🤝 Partnership &amp; reseller terms</li>
                <li>🛟 Dedicated support</li>
              </ul>
              <a className="btn ghost" href="mailto:hello@botfolks.in?subject=Partnership%20%2F%20custom%20plan">💬 Talk to us</a>
            </div>
          </div>
          <p className="muted small">
            Extra chats beyond your plan: ${OVERAGE_PER_CHAT_USD.toFixed(3)} each, with a monthly cap you set. Credit packs: {packs.map((p) => `$${p.usd} = ${p.credits}`).join(' · ')} (1 credit = $0.01).
          </p>

          <div className="guarantee">
            <div className="shield"><Icon><path d="M12 3 4.5 6.5v5c0 5 3.3 8 7.5 9.5 4.2-1.5 7.5-4.5 7.5-9.5v-5Z" /><path d="m9 12 2 2 4-4" /></Icon></div>
            <div>
              <h3>🛡️ 30-day money-back guarantee</h3>
              <p>Not working out for any reason in your first 30 days? Email us and we'll refund your plan in full — no questions asked. 🤝</p>
            </div>
          </div>
        </section>

        <footer className="landing-footer muted">
          <div className="logo footer-logo"><Logo size={20} />Bot<span>folks</span></div>
          <span>© Botfolks · <a href="mailto:hello@botfolks.in">💌 hello@botfolks.in</a></span>
        </footer>
      </div>
    </div>
  );
}
