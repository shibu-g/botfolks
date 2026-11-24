import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUES, type TrainJob } from '@botfolks/shared';
import { config } from '../config.js';

const isLocal = config.queueMode === 'local';

export const redis = isLocal ? null : new Redis(config.redisUrl, { maxRetriesPerRequest: null });

// Local dev: no broker. The source row is inserted with status='pending' and the
// worker polls MySQL for it directly (see apps/worker/src/index.ts), so there's nothing to enqueue.
export const trainQueue: { add: (name: string, data: TrainJob) => Promise<unknown> } = isLocal
  ? { add: async () => undefined }
  : new Queue<TrainJob>(QUEUES.train, { connection: redis! });
