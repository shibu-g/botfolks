export type PlanId = 'free' | 'starter' | 'growth' | 'agency';

export const ANSWERS_PER_CHAT = 6;        // 1 billable chat = up to 6 AI answers
export const CREDIT_USD = 0.01;           // 1 credit = $0.01
export const FREE_BONUS_CREDITS = 25;
export const OVERAGE_PER_CHAT_USD = 0.008;

// Included-chat and credit-pack counts below are sized so net revenue (price,
// minus 18% GST) clears 2.5x OVERAGE_PER_CHAT_USD at full usage — see the
// 2026-11-27 margin audit. Re-derive rather than eyeball if price changes.
export const PLANS: Record<PlanId, {
  name: string; monthly: number; yearly: number; chats: number; bots: number;
  fileTraining: boolean; whiteLabel: boolean; leadCapture: boolean; alwaysOnline: boolean; customColor: boolean;
}> = {
  free:    { name: 'Free',    monthly: 0,   yearly: 0,    chats: 0,    bots: 1,  fileTraining: false, whiteLabel: false, leadCapture: false, alwaysOnline: false, customColor: false },
  starter: { name: 'Starter', monthly: 19,  yearly: 199,  chats: 805,  bots: 5,  fileTraining: true,  whiteLabel: false, leadCapture: true,  alwaysOnline: true,  customColor: true },
  growth:  { name: 'Growth',  monthly: 49,  yearly: 529,  chats: 2076, bots: 10, fileTraining: true,  whiteLabel: false, leadCapture: true,  alwaysOnline: true,  customColor: true },
  agency:  { name: 'Agency',  monthly: 149, yearly: 1599, chats: 6314, bots: 15, fileTraining: true,  whiteLabel: true,  leadCapture: true,  alwaysOnline: true,  customColor: true },
};

export const CREDIT_PACKS = [
  { id: 'pack_2',  usd: 2,  credits: 85 },
  { id: 'pack_5',  usd: 5,  credits: 212 },
  { id: 'pack_10', usd: 10, credits: 424 },
  { id: 'pack_25', usd: 25, credits: 1059 },
] as const;

// Voice chat (OpenAI Realtime API, gpt-realtime-2.1-mini) — gated to Growth/Agency,
// metered from the same credit wallet used for chat overage.
export const VOICE_ENABLED_PLANS: PlanId[] = ['growth', 'agency'];
export const VOICE_COST_PER_MIN_USD = 0.03;          // blended estimate — retune from the OpenAI usage dashboard once live
export const VOICE_MARKUP = 2.5;
export const VOICE_RATE_PER_MIN_USD = VOICE_COST_PER_MIN_USD * VOICE_MARKUP;   // $0.075/min charged to the customer
export const VOICE_CREDITS_PER_MIN = VOICE_RATE_PER_MIN_USD / CREDIT_USD;      // 7.5 credits/min
export const VOICE_MAX_SESSION_SECONDS = 15 * 60;    // hard cap per call, regardless of balance
export const VOICE_MIN_SESSION_SECONDS = 30;         // don't bother starting a call for less than this

export function creditsForVoiceSeconds(seconds: number) {
  return Math.ceil((seconds / 60) * VOICE_CREDITS_PER_MIN);
}

export function voiceSecondsAffordable(creditBalance: number) {
  return Math.floor((creditBalance / VOICE_CREDITS_PER_MIN) * 60);
}
