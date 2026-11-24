import { css } from './styles';

type Config = { name: string; welcome: string; theme: { color?: string }; leadCapture: boolean; hideBranding: boolean; voice: boolean };

const script = (document.currentScript ?? document.querySelector('script[data-bot]')) as HTMLScriptElement;
const BOT = script?.dataset.bot ?? '';
const API = script?.dataset.api ?? 'https://api.botfolks.in';

function visitorId() {
  try {
    let id = localStorage.getItem('botfolks_vid');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('botfolks_vid', id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

async function init() {
  if (!BOT) return console.warn('[Botfolks] missing data-bot attribute');
  const cfg: Config = await fetch(`${API}/v1/widget/config/${BOT}`).then((r) => r.json());
  const color = cfg.theme?.color ?? '#8b7cff';

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>${css(color)}</style>
    <div class="panel" part="panel">
      <div class="head"></div>
      <div class="msgs"></div>
      <form>
        <input placeholder="Type your message…" maxlength="2000" />
        ${cfg.voice ? `<button type="button" class="mic" aria-label="Voice chat"><svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg></button>` : ''}
        <button class="send">Send</button>
      </form>
      ${cfg.hideBranding ? '' : '<div class="brand">Powered by <a href="https://botfolks.in" target="_blank">Botfolks</a></div>'}
      ${cfg.voice ? `
      <div class="call">
        <div class="call-orb"><svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg></div>
        <div class="call-status">Connecting…</div>
        <div class="call-caption"></div>
        <button type="button" class="call-end">End call</button>
      </div>` : ''}
    </div>
    <button class="launcher" aria-label="Open chat"><svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg></button>`;

  const panel = root.querySelector('.panel')!;
  const msgs = root.querySelector('.msgs') as HTMLDivElement;
  const form = root.querySelector('form')!;
  const input = root.querySelector('input')!;
  (root.querySelector('.head') as HTMLElement).textContent = cfg.name;

  const add = (text: string, who: 'bot' | 'me') => {
    const el = document.createElement('div');
    el.className = `m ${who}`;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  };
  add(cfg.welcome, 'bot');

  root.querySelector('.launcher')!.addEventListener('click', () => { panel.classList.toggle('open'); input.focus(); });

  let conversationId: number | undefined;
  let busy = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true; input.value = '';
    add(text, 'me');
    const out = add('…', 'bot');

    try {
      const r = await fetch(`${API}/v1/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey: BOT, visitorId: visitorId(), conversationId, message: text, pageUrl: location.href }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({}));
        out.textContent = j.error ?? 'Sorry, something went wrong. Please try again.';
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '', answer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const ev of events) {
          const type = /event: (\w+)/.exec(ev)?.[1];
          const data = /data: (.*)/s.exec(ev)?.[1];
          if (!data) continue;
          const payload = JSON.parse(data);
          if (type === 'meta') conversationId = payload.conversationId;
          if (type === 'token') { answer += payload; out.textContent = answer; msgs.scrollTop = msgs.scrollHeight; }
          if (type === 'error') out.textContent = 'Sorry, something went wrong.';
        }
      }
    } catch {
      out.textContent = 'Connection problem. Please try again.';
    } finally { busy = false; }
  });

  if (!cfg.voice) return;
  setupVoice(root, API, BOT, () => conversationId, (id) => { conversationId = id; });
}

function setupVoice(
  root: ShadowRoot, API: string, BOT: string,
  getConvId: () => number | undefined, setConvId: (id: number) => void,
) {
  const callEl = root.querySelector('.call') as HTMLDivElement;
  const orbEl = root.querySelector('.call-orb') as HTMLDivElement;
  const statusEl = root.querySelector('.call-status') as HTMLDivElement;
  const captionEl = root.querySelector('.call-caption') as HTMLDivElement;
  const micBtn = root.querySelector('.mic') as HTMLButtonElement;
  const endBtn = root.querySelector('.call-end') as HTMLButtonElement;

  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let localStream: MediaStream | null = null;
  let sessionId: number | undefined;
  let startedAt = 0;
  let ending = false;

  async function endCall(bill = true) {
    if (ending) return;
    ending = true;
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    try { dc?.close(); } catch { /* noop */ }
    try { pc?.close(); } catch { /* noop */ }
    localStream?.getTracks().forEach((t) => t.stop());
    pc = null; dc = null; localStream = null;
    callEl.classList.remove('active');

    const sid = sessionId;
    sessionId = undefined;
    ending = false;
    if (bill && sid) {
      try {
        await fetch(`${API}/v1/widget/voice/session/${sid}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botKey: BOT, seconds }),
          keepalive: true,
        });
      } catch { /* best effort */ }
    }
  }

  async function runTool(name: string, args: string, callId: string) {
    let result = 'Tool failed.';
    try {
      const r = await fetch(`${API}/v1/widget/voice/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey: BOT, conversationId: getConvId(), name, arguments: args }),
      });
      const j = await r.json();
      result = j.result ?? result;
    } catch { /* keep default error result */ }
    dc?.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: result } }));
    dc?.send(JSON.stringify({ type: 'response.create' }));
  }

  function onRealtimeEvent(evt: any) {
    if (evt.type === 'response.created') { orbEl.classList.add('speaking'); statusEl.textContent = 'Speaking…'; captionEl.textContent = ''; }
    if (evt.type === 'response.audio_transcript.delta') captionEl.textContent = (captionEl.textContent ?? '') + evt.delta;
    if (evt.type === 'response.done') {
      orbEl.classList.remove('speaking');
      statusEl.textContent = 'Listening…';
      const calls = (evt.response?.output ?? []).filter((o: any) => o.type === 'function_call');
      for (const c of calls) runTool(c.name, c.arguments, c.call_id);
    }
  }

  async function startCall() {
    callEl.classList.add('active');
    statusEl.textContent = 'Connecting…';
    captionEl.textContent = '';
    try {
      const r = await fetch(`${API}/v1/widget/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey: BOT, visitorId: visitorId(), conversationId: getConvId(), pageUrl: location.href }),
      });
      const j = await r.json();
      if (!r.ok) { statusEl.textContent = j.error ?? 'Voice chat unavailable.'; return; }
      setConvId(j.conversationId);
      sessionId = j.sessionId;
      startedAt = Date.now();

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc = new RTCPeerConnection();
      pc.addTrack(localStream.getTracks()[0], localStream);

      const audioEl = new Audio();
      audioEl.autoplay = true;
      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      dc = pc.createDataChannel('oai-events');
      dc.addEventListener('message', (e) => { try { onRealtimeEvent(JSON.parse(e.data)); } catch { /* ignore */ } });
      dc.addEventListener('open', () => { statusEl.textContent = 'Listening…'; });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${j.clientSecret}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!sdpRes.ok) { statusEl.textContent = 'Could not connect.'; await endCall(false); return; }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch {
      statusEl.textContent = 'Could not start voice chat.';
      await endCall(false);
    }
  }

  micBtn?.addEventListener('click', () => { if (pc) endCall(); else startCall(); });
  endBtn?.addEventListener('click', () => endCall());
  window.addEventListener('pagehide', () => endCall());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
