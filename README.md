# Botfolks

AI customer-support chatbot SaaS. A business trains a bot on its website, files and Q&A,
embeds it with one script tag, and the bot answers visitors and captures leads.

## Structure

```
botfolks/
├── apps/
│   ├── api/         Express + TypeScript REST API (auth, bots, training, chat SSE, billing)
│   ├── worker/      BullMQ worker: crawl -> extract -> chunk -> embed (bge-m3) -> MariaDB
│   ├── dashboard/   React + Vite customer dashboard (app.botfolks.in)
│   ├── widget/      Embeddable chat widget, Shadow DOM, builds to dist/v1.js
│   └── site/        Marketing landing page (botfolks.in)
├── packages/
│   └── shared/      Plans, pricing constants, zod schemas, shared types
├── db/migrations/   MariaDB 11.8 schema (VECTOR(1024) + HNSW index) — production
├── db/local/        Plain MySQL schema (JSON-text embeddings) — local dev
├── nginx/           Reverse proxy for botfolks.in, app., api., widget. (Cloudflare Full strict)
├── docker-compose.yml       Full production stack (MariaDB + Redis + api/worker/dashboard + nginx)
└── .env.example
```

## How a chat works

1. Widget sends the visitor's message to `POST /v1/widget/chat`.
2. API embeds the question with `baai/bge-m3` (OpenRouter).
3. Checks `qa_pairs` first (custom answers win), else takes the top 5 `chunks` by cosine distance.
4. Sends context + history to the chat model, streams the reply back over SSE.
5. If the visitor shares contact details, the model calls `save_lead` and it is saved in `leads`.
6. Billing: every 6 AI answers in a conversation = 1 chat. Free plan uses credits; paid plans count against monthly chats.

## Run locally

Needs Node 20+, pnpm (`npm i -g pnpm`) and a local MySQL server. No Docker, no Redis required for local dev.

Local dev uses plain MySQL with two toggles in `.env`:
- `VECTOR_MODE=js` — embeddings stored as JSON text and ranked in Node (see `apps/api/src/services/retrieval.ts`).
- `QUEUE_MODE=local` — the worker polls MySQL for `sources` left in `status='pending'` instead of
  consuming a Redis/BullMQ queue (see `apps/worker/src/index.ts`).

Production flips both: `VECTOR_MODE=native` (MariaDB 11.8's native `VECTOR` type) and `QUEUE_MODE=redis`
(BullMQ) — `docker-compose.yml` sets these explicitly so it's correct regardless of `.env`.

```bash
cp .env.example .env          # set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD for your local MySQL, add OPENROUTER_API_KEY
pnpm install
mysql -h127.0.0.1 -P<DB_PORT> -u<DB_USER> -p <DB_NAME> < db/local/001_init_local.sql
pnpm dev                      # api :4000, worker, dashboard :5173, widget :5174
```

Open http://localhost:5173, sign up, create a bot with your website URL, wait for status **ready**.
To test the widget, put the bot's public key in `apps/widget/index.html` and open http://localhost:5174.
The marketing site (`apps/site`) isn't started by `pnpm dev`; run it on demand with
`pnpm --filter @botfolks/site dev` (port 5175) when you need it.

Schema changes: re-run `db/local/001_init_local.sql` (statements are `CREATE TABLE IF NOT EXISTS`, safe to replay).

## Deploy (VPS, Ubuntu 24.04)

```bash
git clone <repo> botfolks && cd botfolks
cp .env.example .env && nano .env      # production values, NODE_ENV=production
# Cloudflare -> SSL/TLS -> Origin Server -> create cert, save as:
#   nginx/certs/origin.pem  and  nginx/certs/origin-key.pem
pnpm install && pnpm --filter @botfolks/widget build && pnpm --filter @botfolks/site build
docker compose up -d --build
```

DNS in Cloudflare (proxied): `@`, `www`, `app`, `api`, `widget` -> VPS IP.

## Roadmap

- [x] Phase 0-1: monorepo, Docker, schema
- [x] Phase 2: auth + workspaces (25 free credits on signup)
- [x] Phase 3: training pipeline (URL, sitemap, PDF/DOCX/TXT, Q&A)
- [x] Phase 4: RAG chat with streaming + lead capture
- [x] Phase 5: widget
- [ ] Phase 6: dashboard polish (bot settings, theme colour, conversations view, analytics)
- [ ] Phase 7: Dodo Payments checkout + webhooks (`apps/api/src/routes/billing.ts`)
- [ ] Phase 8: white-label (custom domain, logo), email verification, password reset
- [ ] Phase 9: launch: monitoring, backups, per-plan rate limits
