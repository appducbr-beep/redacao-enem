import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PRO_CREDITS_PER_CYCLE = 20

const CREDIT_REASON_BY_BILLING_CYCLE: Record<string, string> = {
  monthly: 'asaas_payment_confirmed_monthly_reset',
  yearly:  'asaas_payment_confirmed_annual_monthly_allowance',
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
  const receivedToken = request.headers.get('asaas-access-token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  console.log('[webhook/asaas] token received:', Boolean(receivedToken))

  if (!expectedToken || receivedToken !== expectedToken) {
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

  // Non-accumulative: set balance to exactly PRO_CREDITS_PER_CYCLE regardless of current balance
  const billingCycle = (sub as { billing_cycle: string }).billing_cycle
  const creditReason = CREDIT_REASON_BY_BILLING_CYCLE[billingCycle] ?? CREDIT_REASON_BY_BILLING_CYCLE.monthly

  const { error: rpcError } = await supabaseAdmin.rpc('set_credit_balance', {
    target_user_id:    sub.user_id,
    available_credits: PRO_CREDITS_PER_CYCLE,
    reason:            creditReason,
  })

  if (rpcError) {
    console.error('[webhook/asaas] set_credit_balance failed:', rpcError)
    throw new Error(`set_credit_balance: ${rpcError.message}`)
  }

  console.log(
    `[webhook/asaas] Activated sub ${sub.id} user=${sub.user_id} billing_cycle=${billingCycle} credits=>${PRO_CREDITS_PER_CYCLE}`
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
