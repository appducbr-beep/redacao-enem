import { shouldCancelImmediately } from '@/lib/billingRules'

export const FREE_CREDITS_ON_DOWNGRADE = 3

export type ActiveSubForCancellation = {
  id: string
  user_id: string
  asaas_subscription_id: string
  current_period_start: string | null
  current_period_end: string | null
  billing_cycle: string
}

export type CancellationDeps = {
  now(): Date
  cancelAsaasSubscription(asaasId: string): Promise<void>
  updateSub(id: string, data: Record<string, unknown>): Promise<void>
  updateProfile(userId: string, plan: string): Promise<void>
  setCreditBalance(userId: string, available: number, reason: string): Promise<void>
}

export type CancellationResult = { type: 'immediate' } | { type: 'scheduled' }

export async function processUserCancellation(
  sub: ActiveSubForCancellation,
  deps: CancellationDeps
): Promise<CancellationResult> {
  const now = deps.now()
  const startDate = sub.current_period_start ? new Date(sub.current_period_start) : null

  if (shouldCancelImmediately(startDate, now)) {
    await deps.cancelAsaasSubscription(sub.asaas_subscription_id)
    await deps.updateSub(sub.id, {
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      cancel_at_period_end: false,
      refund_required: true,
      refund_reason: '7_day_guarantee',
    })
    await deps.updateProfile(sub.user_id, 'free')
    await deps.setCreditBalance(
      sub.user_id,
      FREE_CREDITS_ON_DOWNGRADE,
      'cancel_within_7_days_return_to_free'
    )
    return { type: 'immediate' }
  }

  await deps.updateSub(sub.id, {
    cancel_at_period_end: true,
    cancelled_at: now.toISOString(),
  })
  return { type: 'scheduled' }
}
