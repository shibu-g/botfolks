import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';
import { config } from '../config.js';

export const dodo = new DodoPayments({
  bearerToken: config.dodo.apiKey,
  environment: config.dodo.environment,
});

// null until DODO_WEBHOOK_SECRET is set (create the webhook endpoint in the
// Dodo dashboard first — it hands you the whsec_... secret).
export const dodoWebhook = config.dodo.webhookSecret ? new Webhook(config.dodo.webhookSecret) : null;
