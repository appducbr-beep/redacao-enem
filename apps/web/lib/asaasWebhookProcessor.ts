import { trackServerEvent } from './analytics'
import { logInfo, logError } from './logger'

const PRO_CREDITS_PER_CYCLE = 20

const CREDIT_REASON_BY_BILLING_CYCLE: Record<string, string> = {
  monthly: 'asaas_payment_confirmed_monthly_reset',
  yearly: 'asaas_payment_confirmed_annual_monthly_allowance',
}

export type PaymentPayload = {
  id: string
  subscription?: string
  status: string
  value: number
}

export type SubscriptionPayload = {
  id: string
  status: string
  customer: string
}

export type WebhookBody = {
  id?: string
  event: string
  payment?: PaymentPayload
  subscription?: SubscriptionPayload
}

export type SubRow = {
  id: string
  user_id: string
  billing_cycle: string
  status: string
}

export type WebhookProcessorDeps = {
  now(): Date
  insertWebhookLog(
    event: string,
    eventId: string | null,
    payload: unknown
  ): Promise<{ logId: string } | { duplicate: true } | { dbError: true }>
  updateWebhookLog(
    logId: string,
    result: { ok: true } | { errorMessage: string }
  ): Promise<void>
  findSubByAsaasId(asaasId: string): Promise<SubRow | null>
  updateSub(id: string, data: Record<string, unknown>): Promise<void>
  updateProfile(userId: string, plan: string): Promise<void>
  upsertPayment(data: Record<string, unknown>): Promise<void>
  setCreditBalance(userId: string, available: number, reason: string): Promise<void>
}

export type WebhookResult = {
  ok: boolean
  duplicate?: true
  error?: string
}

export async function processWebhookEvent(
  body: WebhookBody,
  deps: WebhookProcessorDeps
): Promise<WebhookResult> {
  const { event } = body
  const eventId = body.id ?? body.payment?.id ?? null

  const logResult = await deps.insertWebhookLog(event, eventId, body)
  if ('duplicate' in logResult) return { ok: true, duplicate: true }
  const logId = 'logId' in logResult ? logResult.logId : null

  let processingError: string | null = null
  try {
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      await processPaymentConfirmed(body.payment, deps)
    } else if (event === 'SUBSCRIPTION_CANCELLED' || event === 'SUBSCRIPTION_DELETED') {
      const subId = body.subscription?.id ?? body.payment?.subscription
      if (subId) await processSubscriptionCancelled(subId, deps)
    } else {
      logInfo('webhook event unhandled', { event })
    }
  } catch (err) {
    processingError = String(err)
    logError('webhook event processing error', { event, event_id: eventId, error: processingError })
  }

  if (logId) {
    await deps.updateWebhookLog(
      logId,
      processingError ? { errorMessage: processingError } : { ok: true }
    )
  }

  return { ok: processingError === null, error: processingError ?? undefined }
}

export async function processPaymentConfirmed(
  payment: PaymentPayload | undefined,
  deps: WebhookProcessorDeps
): Promise<void> {
  if (!payment?.subscription) return

  const asaasSubscriptionId = payment.subscription
  const sub = await deps.findSubByAsaasId(asaasSubscriptionId)
  if (!sub) return

  await deps.upsertPayment({
    user_id: sub.user_id,
    asaas_payment_id: payment.id,
    asaas_subscription_id: asaasSubscriptionId,
    amount: payment.value,
    status: 'confirmed',
    type: 'subscription',
  })

  const now = deps.now()
  const billingCycle = sub.billing_cycle
  const isYearly = billingCycle === 'yearly'
  const periodEnd = new Date(now)
  if (isYearly) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }
  const nextCreditReset = new Date(now)
  nextCreditReset.setMonth(nextCreditReset.getMonth() + 1)

  await deps.updateSub(sub.id, {
    status: 'active',
    cancel_at_period_end: false,
    refund_required: false,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    next_credit_reset_at: isYearly ? nextCreditReset.toISOString() : null,
  })

  await deps.updateProfile(sub.user_id, 'pro')
  trackServerEvent('subscription_confirmed', sub.user_id, { billing_cycle: billingCycle })

  const creditReason =
    CREDIT_REASON_BY_BILLING_CYCLE[billingCycle] ?? CREDIT_REASON_BY_BILLING_CYCLE.monthly
  await deps.setCreditBalance(sub.user_id, PRO_CREDITS_PER_CYCLE, creditReason)
}

export async function processSubscriptionCancelled(
  asaasSubscriptionId: string,
  deps: WebhookProcessorDeps
): Promise<void> {
  const sub = await deps.findSubByAsaasId(asaasSubscriptionId)
  if (!sub) return

  await deps.updateSub(sub.id, {
    status: 'cancelled',
    cancelled_at: deps.now().toISOString(),
  })

  await deps.updateProfile(sub.user_id, 'free')
  trackServerEvent('subscription_cancelled', sub.user_id, { source: 'webhook' })
}
