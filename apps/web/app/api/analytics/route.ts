import { NextRequest, NextResponse } from 'next/server'
import { isAllowedAnalyticsEvent } from '@/lib/analyticsEvents'
import { sanitizeProperties } from '@/lib/analytics'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  const { event, properties } = body as { event?: unknown; properties?: unknown }

  if (typeof event !== 'string' || !isAllowedAnalyticsEvent(event)) {
    return NextResponse.json({ error: 'unknown event' }, { status: 400 })
  }

  const sanitized =
    properties && typeof properties === 'object' && !Array.isArray(properties)
      ? sanitizeProperties(properties as Record<string, unknown>)
      : {}

  const payload = {
    event,
    properties: sanitized,
    timestamp: new Date().toISOString(),
    source: 'client',
  }
  console.log('[analytics]', JSON.stringify(payload))

  return NextResponse.json({ ok: true })
}
