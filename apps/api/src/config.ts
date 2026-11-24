function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  vectorMode: (process.env.VECTOR_MODE ?? 'native') as 'native' | 'js',
  queueMode: (process.env.QUEUE_MODE ?? 'redis') as 'redis' | 'local',
  port: Number(process.env.API_PORT ?? 4000),
  appUrl: req('APP_URL', 'http://localhost:5173'),
  jwtSecret: req('JWT_SECRET', 'dev-secret'),
  db: {
    host: req('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    database: req('DB_NAME', 'botfolks'),
    user: req('DB_USER', 'botfolks'),
    password: req('DB_PASSWORD', 'botfolks_pass'),
  },
  redisUrl: req('REDIS_URL', 'redis://localhost:6379'),
  dodo: {
    apiKey: process.env.DODO_API_KEY ?? '',
    webhookSecret: process.env.DODO_WEBHOOK_SECRET ?? '',
    environment: ((process.env.DODO_API_KEY ?? '').startsWith('dodo_live_') ? 'live_mode' : 'test_mode') as 'live_mode' | 'test_mode',
    products: {
      starter: process.env.DODO_PRODUCT_STARTER ?? '',
      growth: process.env.DODO_PRODUCT_GROWTH ?? '',
      agency: process.env.DODO_PRODUCT_AGENCY ?? '',
    },
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    chatModel: req('CHAT_MODEL', 'anthropic/claude-haiku-5.5'),
    fallbackModel: req('CHAT_MODEL_FALLBACK', 'google/gemini-2.5-flash-lite'),
    embedModel: req('EMBED_MODEL', 'baai/bge-m3'),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    realtimeModel: process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime-2.1-mini',
    voice: process.env.OPENAI_REALTIME_VOICE ?? 'marin',
  },
};
