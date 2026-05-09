export const PRO_CREDITS_RESET = 20

export type CronSubRow = {
  id: string
  user_id: string
  asaas_subscription_id: string
  billing_cycle: string
  current_period_end: string | null
  next_credit_reset_at: string | null
}

export type CronDeps = {
  now(): Date
  findExpiringSubscriptions(now: Date): Promise<CronSubRow[]>
  findSubsForCreditReset(now: Date): Promise<CronSubRow[]>
  expireSub(sub: CronSubRow, now: Date): Promise<void>
  resetSubCredits(sub: CronSubRow, nextResetAt: Date): Promise<void>
}

export async function processExpirations(deps: CronDeps): Promise<number> {
  const now = deps.now()
  const subs = await deps.findExpiringSubscriptions(now)
  for (const sub of subs) {
    await deps.expireSub(sub, now)
  }
  return subs.length
}

export async function processCreditResets(deps: CronDeps): Promise<number> {
  const now = deps.now()
  const subs = await deps.findSubsForCreditReset(now)
  for (const sub of subs) {
    const base = new Date(sub.next_credit_reset_at!)
    const nextResetAt = new Date(base)
    nextResetAt.setMonth(nextResetAt.getMonth() + 1)
    await deps.resetSubCredits(sub, nextResetAt)
  }
  return subs.length
}
