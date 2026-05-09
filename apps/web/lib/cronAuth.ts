export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401; error: 'Unauthorized' }
  | { ok: false; status: 500; error: 'CRON_SECRET not configured' }

/**
 * Validates a cron request against the expected secret.
 * Accepts two auth methods:
 *   1. Vercel Cron:    Authorization: Bearer <secret>
 *   2. Manual/CI:      x-cron-secret: <secret>
 */
export function validateCronRequest(
  headers: { get(name: string): string | null },
  cronSecret: string | undefined
): CronAuthResult {
  if (!cronSecret) {
    return { ok: false, status: 500, error: 'CRON_SECRET not configured' }
  }

  const authorization = headers.get('authorization')
  if (authorization === `Bearer ${cronSecret}`) {
    return { ok: true }
  }

  const manualSecret = headers.get('x-cron-secret')
  if (manualSecret === cronSecret) {
    return { ok: true }
  }

  return { ok: false, status: 401, error: 'Unauthorized' }
}
