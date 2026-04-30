import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const CREDITS_BY_BILLING_CYCLE: Record<string, number> = {
  monthly: 30,
  yearly: 360,
}

interface WebhookPayload {
  id?: string
  event: string
  payment?: {
    id: string
    subscription?: string
    status: string
    value: number
  }
  subscription?: {
    id: string
    status: string
    customer: string
  }
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  if (!expectedToken || token !== expectedToken) {
    console.warn('[webhook/asaas] Unauthorized request — invalid token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: WebhookPayload
  try {
    body = (await request.json()) as WebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event } = body
  // Use top-level event ID if present; fall back to payment ID for payment events
  const eventId = body.id ?? body.payment?.id ?? null
  console.log('[webhook/asaas] event:', event, 'id:', eventId)

  // Idempotency: insert log before processing — duplicate asaas_event_id means already handled
  let logId: string | null = null
  const { data: logRow, error: logError } = await supabaseAdmin
    .from('webhook_logs')
    .insert({
      event,
      asaas_event_id: eventId,
      payload: body as unknown as Record<string, unknown>,
    })
    .select('id')
    .single()

  if (logError) {
    if (logError.code === '23505') {
      console.log('[webhook/asaas] Duplicate event, skipping:', eventId)
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[webhook/asaas] Failed to insert webhook log:', logError)
    // Continue — log failure shouldn't block payment activation
  } else {
    logId = logRow.id
  }

  let processingError: string | null = null
  try {
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      await handlePaymentConfirmed(body.payment)
    } else if (event === 'SUBSCRIPTION_CANCELLED' || event === 'SUBSCRIPTION_DELETED') {
      const subId = body.subscription?.id ?? body.payment?.subscription
      await handleSubscriptionCancelled(subId)
    }
    // Other events logged but not actioned
  } catch (err) {
    processingError = String(err)
    console.error('[webhook/asaas] Handler error:', err)
  }

  if (logId) {
    await supabaseAdmin
      .from('webhook_logs')
      .update(
        processingError
          ? { error_message: processingError }
          : { processed: true, processed_at: new Date().toISOString() }
      )
      .eq('id', logId)
  }

  // Always return 200 so Asaas doesn't retry — errors logged for manual review
  return NextResponse.json({ ok: processingError === null, error: processingError ?? undefined })
}

async function handlePaymentConfirmed(payment?: WebhookPayload['payment']) {
  if (!payment?.subscription) {
    console.warn('[webhook/asaas] PAYMENT_CONFIRMED with no subscription id — likely one-time payment, skipping')
    return
  }

  const asaasSubscriptionId = payment.subscription

  const { data: sub, error } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, billing_cycle, status')
    .eq('asaas_subscription_id', asaasSubscriptionId)
    .maybeSingle()

  if (error || !sub) {
    console.warn('[webhook/asaas] Subscription not found:', asaasSubscriptionId)
    return
  }

  // Record payment for audit; upsert prevents duplicate rows if event replayed without eventId
  await supabaseAdmin
    .from('asaas_payments')
    .upsert(
      {
        user_id: sub.user_id,
        asaas_payment_id: payment.id,
        asaas_subscription_id: asaasSubscriptionId,
        amount: payment.value,
        status: 'confirmed',
        type: 'subscription',
      },
      { onConflict: 'asaas_payment_id' }
    )

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', sub.id)

  await supabaseAdmin.from('profiles').update({ plan: 'pro' }).eq('id', sub.user_id)

  const credits = CREDITS_BY_BILLING_CYCLE[(sub as { billing_cycle: string }).billing_cycle] ?? 30

  const { data: wallet } = await supabaseAdmin
    .from('credit_wallets')
    .select('credits_available')
    .eq('user_id', sub.user_id)
    .maybeSingle()

  if (wallet) {
    const current = (wallet as { credits_available: number }).credits_available ?? 0
    await supabaseAdmin
      .from('credit_wallets')
      .update({ credits_available: current + credits })
      .eq('user_id', sub.user_id)
  }

  console.log(
    `[webhook/asaas] Activated sub ${sub.id} user=${sub.user_id} billing_cycle=${(sub as { billing_cycle: string }).billing_cycle} +${credits} credits`
  )
}

async function handleSubscriptionCancelled(asaasSubscriptionId?: string) {
  if (!asaasSubscriptionId) return

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('asaas_subscription_id', asaasSubscriptionId)
    .maybeSingle()

  if (!sub) {
    console.warn('[webhook/asaas] Subscription not found for cancellation:', asaasSubscriptionId)
    return
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', sub.id)

  await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)

  console.log(`[webhook/asaas] Cancelled sub ${sub.id} user=${sub.user_id}`)
}
