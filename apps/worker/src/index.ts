import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import type { RowDataPacket } from 'mysql2';
import { QUEUES, type TrainJob } from '@botfolks/shared';
import { env } from './lib/env.js';
import { db } from './lib/db.js';
import { runTrain } from './jobs/train.js';

if (env.queueMode === 'local') {
  // Local dev: no Redis. The API just inserts `sources` rows with status='pending';
  // poll for them here instead of consuming a broker queue.
  const POLL_MS = 2000;

  const tick = async () => {
    try {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT id, bot_id FROM sources WHERE status = 'pending' ORDER BY id LIMIT 5`,
      );
      for (const r of rows as { id: number; bot_id: number }[]) {
        try {
          await runTrain({ botId: r.bot_id, sourceId: r.id });
        } catch (e) {
          console.error(`train job (source ${r.id}) failed:`, e);
        }
      }
    } catch (e) {
      console.error('poll failed:', e);
    }
    setTimeout(tick, POLL_MS);
  };

  console.log('Botfolks worker polling local MySQL for pending sources…');
  tick();
} else {
  const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker<TrainJob>(QUEUES.train, (job) => runTrain(job.data), { connection, concurrency: 2 });

  worker.on('completed', (job) => console.log(`train job ${job.id} done`));
  worker.on('failed', (job, err) => console.error(`train job ${job?.id} failed:`, err.message));
  console.log('Botfolks worker listening for jobs…');
}
