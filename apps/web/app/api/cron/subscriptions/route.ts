import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateCronRequest } from '@/lib/cronAuth'
import { trackServerEvent } from '@/lib/analytics'
import { logInfo, logError } from '@/lib/logger'

// Accepts two auth methods:
//   Vercel Cron:  Authorization: Bearer <CRON_SECRET>
//   Manual/CI:    x-cron-secret: <CRON_SECRET>
export async function GET(request: NextRequest) {
  const auth = validateCronRequest(request.headers, process.env.CRON_SECRET)

  if (!auth.ok) {
    if (auth.status === 500) {
      logError('cron secret not configured')
      return NextResponse.json({ error: auth.error }, { status: 500 })
    }
    logError('cron unauthorized request')
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const start = Date.now()
  logInfo('cron subscriptions started')
  const results: Record<string, number | string> = {}

  // 1. Monthly credit resets for annual subscriptions
  try {
    const { data, error } = await supabaseAdmin.rpc('process_subscription_credit_resets')
    if (error) throw error
    results.credit_resets = (data as number) ?? 0
  } catch (err) {
    logError('cron credit_resets failed', { error: String(err) })
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
    logError('cron expirations failed', { error: String(err) })
    results.expirations_error = String(err)
  }

  const ms = Date.now() - start
  logInfo('cron subscriptions finished', { ...results, ms })
  trackServerEvent('cron_subscriptions_processed', undefined, results)
  return NextResponse.json({ ok: true, ...results })
}
