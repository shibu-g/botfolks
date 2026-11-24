export const env = {
  vectorMode: (process.env.VECTOR_MODE ?? 'native') as 'native' | 'js',
  queueMode: (process.env.QUEUE_MODE ?? 'redis') as 'redis' | 'local',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? 'botfolks',
    user: process.env.DB_USER ?? 'botfolks',
    password: process.env.DB_PASSWORD ?? 'botfolks_pass',
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  openrouterKey: process.env.OPENROUTER_API_KEY ?? '',
  embedModel: process.env.EMBED_MODEL ?? 'baai/bge-m3',
  maxPages: Number(process.env.CRAWL_MAX_PAGES ?? 50),
};
