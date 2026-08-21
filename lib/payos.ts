import { NotFoundError, PayOS, type Webhook } from "@payos/node";

export class PayosConfigurationError extends Error {}

let cached: PayOS | undefined;

function required(name: "PAYOS_CLIENT_ID" | "PAYOS_API_KEY" | "PAYOS_CHECKSUM_KEY") {
  const value = process.env[name];
  if (!value) throw new PayosConfigurationError(`Thiếu ${name}.`);
  return value;
}

export function payosClient() {
  if (!cached) {
    cached = new PayOS({
      clientId: required("PAYOS_CLIENT_ID"),
      apiKey: required("PAYOS_API_KEY"),
      checksumKey: required("PAYOS_CHECKSUM_KEY"),
      maxRetries: 1,
      timeout: 10_000,
    });
  }
  return cached;
}

export function isPayosNotFound(error: unknown) {
  return error instanceof NotFoundError;
}

export async function verifyPayosWebhook(payload: unknown) {
  return payosClient().webhooks.verify(payload as Webhook);
}
