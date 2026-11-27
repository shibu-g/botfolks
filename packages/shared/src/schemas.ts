import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createBotSchema = z.object({
  name: z.string().min(1).max(120),
  websiteUrl: z.string().url().optional(),
  systemPrompt: z.string().max(4000).optional(),
  languages: z.array(z.string().length(2)).default(['en']),
});

export const chatMessageSchema = z.object({
  botKey: z.string().length(24),
  visitorId: z.string().uuid(),
  conversationId: z.number().int().optional(),
  message: z.string().min(1).max(2000),
  pageUrl: z.string().max(1000).optional(),
});

export const leadSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  need: z.string().max(2000).optional(),
});

export const checkoutSchema = z.object({
  planId: z.enum(['starter', 'growth', 'agency']),
});

export const publicCheckoutSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  planId: z.enum(['starter', 'growth', 'agency']),
});

export const voiceSessionSchema = z.object({
  botKey: z.string().length(24),
  visitorId: z.string().uuid(),
  conversationId: z.number().int().optional(),
  pageUrl: z.string().max(1000).optional(),
});

export const voiceSessionEndSchema = z.object({
  botKey: z.string().length(24),
  seconds: z.number().int().min(0).max(3600),
});

export const voiceToolSchema = z.object({
  botKey: z.string().length(24),
  conversationId: z.number().int().optional(),
  name: z.enum(['search_knowledge_base', 'save_lead']),
  arguments: z.string().max(4000),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type CreateBotInput = z.infer<typeof createBotSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PublicCheckoutInput = z.infer<typeof publicCheckoutSchema>;
export type VoiceSessionInput = z.infer<typeof voiceSessionSchema>;
export type VoiceSessionEndInput = z.infer<typeof voiceSessionEndSchema>;
export type VoiceToolInput = z.infer<typeof voiceToolSchema>;
