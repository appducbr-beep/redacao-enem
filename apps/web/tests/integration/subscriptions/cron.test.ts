import { describe, it, expect, vi, type Mock } from 'vitest'
import {
  processExpirations,
  processCreditResets,
  type CronDeps,
  type CronSubRow,
} from '@/lib/subscriptionCronProcessor'
import { makeMonthlySubscription, makeYearlySubscription } from '@/tests/helpers/subscriptionFactory'

const NOW = new Date('2026-02-20T12:00:00.000Z')

function makeDeps(overrides: Partial<CronDeps> = {}): CronDeps {
  return {
    now: () => NOW,
    findExpiringSubscriptions: vi.fn(async () => []),
    findSubsForCreditReset: vi.fn(async () => []),
    expireSub: vi.fn(async () => {}),
    resetSubCredits: vi.fn(async () => {}),
    ...overrides,
  }
}

// ─── Expiração de assinatura ─────────────────────────────────────────────────

describe('processExpirations', () => {
  it('expira assinatura com cancel_at_period_end e período vencido', async () => {
    const sub = makeMonthlySubscription({
      cancel_at_period_end: true,
      current_period_end: '2026-02-01T12:00:00.000Z',
    }) as unknown as CronSubRow

    const deps = makeDeps({
      findExpiringSubscriptions: vi.fn(async () => [sub]),
    })

    const count = await processExpirations(deps)

    expect(count).toBe(1)
    expect(deps.expireSub as Mock).toHaveBeenCalledWith(sub, NOW)
  })

  it('plan vira free ao expirar (expireSub chamado com a sub correta)', async () => {
    const sub = makeMonthlySubscription({ cancel_at_period_end: true }) as unknown as CronSubRow
    const deps = makeDeps({
      findExpiringSubscriptions: vi.fn(async () => [sub]),
    })

    await processExpirations(deps)

    expect(deps.expireSub as Mock).toHaveBeenCalledWith(
      expect.objectContaining({ id: sub.id, user_id: sub.user_id }),
      NOW
    )
  })

  it('não expira se não há assinaturas vencidas', async () => {
    const deps = makeDeps()
    const count = await processExpirations(deps)
    expect(count).toBe(0)
    expect(deps.expireSub as Mock).not.toHaveBeenCalled()
  })

  it('expira múltiplas assinaturas em um único cron', async () => {
    const sub1 = makeMonthlySubscription({ id: 'sub-1' }) as unknown as CronSubRow
    const sub2 = makeYearlySubscription({ id: 'sub-2' }) as unknown as CronSubRow
    const deps = makeDeps({
      findExpiringSubscriptions: vi.fn(async () => [sub1, sub2]),
    })

    const count = await processExpirations(deps)

    expect(count).toBe(2)
    expect(deps.expireSub as Mock).toHaveBeenCalledTimes(2)
  })
})

// ─── Reset mensal de créditos (anual) ────────────────────────────────────────

const yearlyWithExpiredReset = makeYearlySubscription({
  next_credit_reset_at: '2026-02-15T12:00:00.000Z', // vencido: 5 dias atrás
}) as unknown as CronSubRow

describe('processCreditResets', () => {
  it('reseta créditos de sub anual com next_credit_reset_at vencido', async () => {
    const deps = makeDeps({
      findSubsForCreditReset: vi.fn(async () => [yearlyWithExpiredReset]),
    })

    const count = await processCreditResets(deps)

    expect(count).toBe(1)
    expect(deps.resetSubCredits as Mock).toHaveBeenCalledTimes(1)
  })

  it('next_credit_reset_at avança +1 mês (fev → mar)', async () => {
    const deps = makeDeps({
      findSubsForCreditReset: vi.fn(async () => [yearlyWithExpiredReset]),
    })

    await processCreditResets(deps)

    const [, nextResetAt] = (deps.resetSubCredits as Mock).mock.calls[0]
    expect(nextResetAt.getMonth()).toBe(2) // março (0-indexed)
    expect(nextResetAt.getFullYear()).toBe(2026)
    expect(nextResetAt.getDate()).toBe(15)
  })

  it('sub correta é passada para resetSubCredits', async () => {
    const deps = makeDeps({
      findSubsForCreditReset: vi.fn(async () => [yearlyWithExpiredReset]),
    })

    await processCreditResets(deps)

    expect(deps.resetSubCredits as Mock).toHaveBeenCalledWith(
      expect.objectContaining({ id: yearlyWithExpiredReset.id }),
      expect.any(Date)
    )
  })

  it('não reseta se não há subs elegíveis', async () => {
    const deps = makeDeps()
    const count = await processCreditResets(deps)
    expect(count).toBe(0)
    expect(deps.resetSubCredits as Mock).not.toHaveBeenCalled()
  })
})
