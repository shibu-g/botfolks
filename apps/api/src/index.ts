import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { auth } from './routes/auth.js';
import { bots } from './routes/bots.js';
import { widget } from './routes/widget.js';
import { billing } from './routes/billing.js';
import { health } from './routes/health.js';
import { errorHandler } from './middleware/errors.js';

declare global { namespace Express { interface Request { rawBody?: Buffer } } }

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
// `verify` stashes the raw bytes so the Dodo webhook route can check the HMAC
// signature against the exact payload Dodo sent (JSON.stringify can reorder/
// reformat and would break verification).
app.use(express.json({ limit: '1mb', verify: (req, _res, buf) => { (req as express.Request).rawBody = buf; } }));
app.use(cookieParser());

// Public widget API (any origin, rate limited per IP)
app.use('/v1/widget', rateLimit({ windowMs: 60_000, limit: 30 }), widget);

// Dashboard API (only our app origin)
app.use(cors({ origin: config.appUrl, credentials: true }));
app.use('/v1/auth', rateLimit({ windowMs: 15 * 60_000, limit: 50 }), auth);
app.use('/v1/bots', bots);
app.use('/v1/billing', billing);
app.use('/health', health);

app.use(errorHandler);
app.listen(config.port, () => console.log(`Botfolks API on :${config.port}`));
