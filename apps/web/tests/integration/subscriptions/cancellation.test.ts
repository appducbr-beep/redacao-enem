import { describe, it, expect, vi, type Mock } from 'vitest'
import {
  processUserCancellation,
  FREE_CREDITS_ON_DOWNGRADE,
  type CancellationDeps,
} from '@/lib/subscriptionCancellationProcessor'
import { makeMonthlySubscription } from '@/tests/helpers/subscriptionFactory'

// now = 2026-01-20. 2 dias após o início → dentro da garantia.
const NOW = new Date('2026-01-20T12:00:00.000Z')
const START_WITHIN_GUARANTEE = '2026-01-18T12:00:00.000Z'

// 19 dias atrás → fora da garantia.
const START_AFTER_GUARANTEE = '2026-01-01T12:00:00.000Z'

function makeDeps(overrides: Partial<CancellationDeps> = {}): CancellationDeps {
  return {
    now: () => NOW,
    cancelAsaasSubscription: vi.fn(async () => {}),
    updateSub: vi.fn(async () => {}),
    updateProfile: vi.fn(async () => {}),
    setCreditBalance: vi.fn(async () => {}),
    ...overrides,
  }
}

// ─── Dentro de 7 dias ────────────────────────────────────────────────────────

describe('cancelamento dentro de 7 dias', () => {
  it('tipo = immediate', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const result = await processUserCancellation(sub, makeDeps())
    expect(result.type).toBe('immediate')
  })

  it('plan vira free', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.updateProfile as Mock).toHaveBeenCalledWith(sub.user_id, 'free')
  })

  it('credits = 3 (FREE_CREDITS_ON_DOWNGRADE)', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.setCreditBalance as Mock).toHaveBeenCalledWith(
      sub.user_id,
      FREE_CREDITS_ON_DOWNGRADE,
      'cancel_within_7_days_return_to_free'
    )
  })

  it('refund_required = true', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.updateSub as Mock).toHaveBeenCalledWith(
      sub.id,
      expect.objectContaining({ refund_required: true, refund_reason: '7_day_guarantee' })
    )
  })

  it('cancela imediatamente no Asaas', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.cancelAsaasSubscription as Mock).toHaveBeenCalledWith(sub.asaas_subscription_id)
  })

  it('status vira cancelled', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_WITHIN_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.updateSub as Mock).toHaveBeenCalledWith(
      sub.id,
      expect.objectContaining({ status: 'cancelled' })
    )
  })
})

// ─── Após 7 dias ─────────────────────────────────────────────────────────────

describe('cancelamento após 7 dias', () => {
  it('tipo = scheduled', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_AFTER_GUARANTEE })
    const result = await processUserCancellation(sub, makeDeps())
    expect(result.type).toBe('scheduled')
  })

  it('cancel_at_period_end = true', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_AFTER_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.updateSub as Mock).toHaveBeenCalledWith(
      sub.id,
      expect.objectContaining({ cancel_at_period_end: true })
    )
  })

  it('plan permanece pro (updateProfile não chamado)', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_AFTER_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.updateProfile as Mock).not.toHaveBeenCalled()
  })

  it('créditos não alterados (setCreditBalance não chamado)', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_AFTER_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.setCreditBalance as Mock).not.toHaveBeenCalled()
  })

  it('Asaas NÃO cancelado agora — será feito pelo cron', async () => {
    const sub = makeMonthlySubscription({ current_period_start: START_AFTER_GUARANTEE })
    const deps = makeDeps()
    await processUserCancellation(sub, deps)
    expect(deps.cancelAsaasSubscription as Mock).not.toHaveBeenCalled()
  })
})
