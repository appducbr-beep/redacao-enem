import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Protected by CRON_SECRET header.
// Intended to run daily — configure in Vercel Dashboard or call manually.
// Usage: GET /api/cron/subscriptions  (header x-cron-secret: <CRON_SECRET>)
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    console.warn('[cron/subscriptions] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, number | string> = {}

  // 1. Monthly credit resets for annual subscriptions
  try {
    const { data, error } = await supabaseAdmin.rpc('process_subscription_credit_resets')
    if (error) throw error
    results.credit_resets = (data as number) ?? 0
  } catch (err) {
    console.error('[cron/subscriptions] credit_resets error:', err)
    results.credit_resets_error = String(err)
  }

  // 2. Expire subscriptions with cancel_at_period_end past current_period_end
  // Note: for subscriptions not yet cancelled in Asaas (after-guarantee cancellations),
  //       a future task should call DELETE /subscriptions/{id} in Asaas here before expiring.
  try {
    const { data, error } = await supabaseAdmin.rpc('process_subscription_expirations')
    if (error) throw error
    results.expirations = (data as number) ?? 0
  } catch (err) {
    console.error('[cron/subscriptions] expirations error:', err)
    results.expirations_error = String(err)
  }

  console.log('[cron/subscriptions]', results)
  return NextResponse.json({ ok: true, ...results })
}
