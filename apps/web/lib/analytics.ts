import { isAllowedAnalyticsEvent, type AnalyticsEventName } from './analyticsEvents'

const SENSITIVE_KEYS = ['cpf', 'phone', 'token', 'api_key', 'password', 'secret', 'cvv', 'card']

export function sanitizeProperties(
  props: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) continue
    result[key] = value
  }
  return result
}

export function trackServerEvent(
  eventName: AnalyticsEventName,
  userId?: string,
  properties?: Record<string, unknown>
): void {
  const payload = {
    event: eventName,
    userId: userId ?? null,
    properties: properties ? sanitizeProperties(properties) : {},
    timestamp: new Date().toISOString(),
  }
  console.log('[analytics]', JSON.stringify(payload))
}

export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!isAllowedAnalyticsEvent(eventName)) return
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, properties }),
      })
      if (res.ok) return
      if (res.status < 500) return // client error — don't retry
    } catch {
      // network error — retry once
    }
  }
}
