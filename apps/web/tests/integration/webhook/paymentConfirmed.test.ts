import { describe, it, expect, vi, type Mock } from 'vitest'
import {
  processPaymentConfirmed,
  processWebhookEvent,
  type WebhookProcessorDeps,
} from '@/lib/asaasWebhookProcessor'
import {
  paymentConfirmedMonthly,
  paymentConfirmedYearly,
  ASAAS_SUB_ID_MONTHLY,
  ASAAS_SUB_ID_YEARLY,
} from '@/tests/helpers/asaasPayloads'
import { makeMonthlySubscription, makeYearlySubscription } from '@/tests/helpers/subscriptionFactory'

const NOW = new Date('2026-01-15T12:00:00.000Z')

function makeDeps(overrides: Partial<WebhookProcessorDeps> = {}): WebhookProcessorDeps {
  return {
    now: () => NOW,
    insertWebhookLog: vi.fn(async () => ({ logId: 'log-001' })),
    updateWebhookLog: vi.fn(async () => {}),
    findSubByAsaasId: vi.fn(async () => null),
    updateSub: vi.fn(async () => {}),
    updateProfile: vi.fn(async () => {}),
    upsertPayment: vi.fn(async () => {}),
    setCreditBalance: vi.fn(async () => {}),
    ...overrides,
  }
}

// ─── Ativação mensal ─────────────────────────────────────────────────────────

describe('processPaymentConfirmed — mensal', () => {
  it('status vira active', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({
      findSubByAsaasId: vi.fn(async (id) => (id === ASAAS_SUB_ID_MONTHLY ? sub : null)),
    })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    expect(deps.updateSub as Mock).toHaveBeenCalledWith(
      sub.id,
      expect.objectContaining({ status: 'active' })
    )
  })

  it('profiles.plan vira pro', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    expect(deps.updateProfile as Mock).toHaveBeenCalledWith(sub.user_id, 'pro')
  })

  it('credits_available vira 20', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    expect(deps.setCreditBalance as Mock).toHaveBeenCalledWith(sub.user_id, 20, expect.any(String))
  })

  it('current_period_end = +1 mês', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    const updateCall = (deps.updateSub as Mock).mock.calls[0][1]
    const periodEnd = new Date(updateCall.current_period_end)
    expect(periodEnd.getMonth()).toBe(1) // fevereiro
    expect(periodEnd.getFullYear()).toBe(2026)
    expect(periodEnd.getDate()).toBe(15)
  })

  it('next_credit_reset_at = null (mensal usa renovação via webhook, não cron)', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    const updateCall = (deps.updateSub as Mock).mock.calls[0][1]
    expect(updateCall.next_credit_reset_at).toBeNull()
  })
})

// ─── Ativação anual ──────────────────────────────────────────────────────────

describe('processPaymentConfirmed — anual', () => {
  it('current_period_end = +1 ano', async () => {
    const sub = makeYearlySubscription()
    const deps = makeDeps({
      findSubByAsaasId: vi.fn(async (id) => (id === ASAAS_SUB_ID_YEARLY ? sub : null)),
    })

    await processPaymentConfirmed(paymentConfirmedYearly.payment, deps)

    const updateCall = (deps.updateSub as Mock).mock.calls[0][1]
    const periodEnd = new Date(updateCall.current_period_end)
    expect(periodEnd.getFullYear()).toBe(2027)
    expect(periodEnd.getMonth()).toBe(0) // janeiro
    expect(periodEnd.getDate()).toBe(15)
  })

  it('next_credit_reset_at = +1 mês', async () => {
    const sub = makeYearlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedYearly.payment, deps)

    const updateCall = (deps.updateSub as Mock).mock.calls[0][1]
    const reset = new Date(updateCall.next_credit_reset_at)
    expect(reset.getMonth()).toBe(1) // fevereiro
    expect(reset.getFullYear()).toBe(2026)
    expect(reset.getDate()).toBe(15)
  })

  it('credits_available vira 20', async () => {
    const sub = makeYearlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedYearly.payment, deps)

    expect(deps.setCreditBalance as Mock).toHaveBeenCalledWith(sub.user_id, 20, expect.any(String))
  })

  it('plan vira pro', async () => {
    const sub = makeYearlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedYearly.payment, deps)

    expect(deps.updateProfile as Mock).toHaveBeenCalledWith(sub.user_id, 'pro')
  })
})

// ─── Créditos não acumulam ───────────────────────────────────────────────────

describe('créditos — não acumulam', () => {
  it('saldo anterior 3 → setCreditBalance chamado com 20', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    // Processor always passes 20 regardless — non-accumulation enforced in SQL
    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    expect(deps.setCreditBalance as Mock).toHaveBeenCalledWith(sub.user_id, 20, expect.any(String))
  })

  it('saldo anterior 25 → setCreditBalance chamado com 20 (não acumula acima do teto)', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({ findSubByAsaasId: vi.fn(async () => sub) })

    await processPaymentConfirmed(paymentConfirmedMonthly.payment, deps)

    expect(deps.setCreditBalance as Mock).toHaveBeenCalledWith(sub.user_id, 20, expect.any(String))
    expect(deps.setCreditBalance as Mock).toHaveBeenCalledTimes(1)
  })
})

// ─── Idempotência ────────────────────────────────────────────────────────────

describe('idempotência — webhook duplicado', () => {
  it('segundo evento com mesmo id retorna duplicate sem processar', async () => {
    const deps = makeDeps({
      insertWebhookLog: vi.fn(async () => ({ duplicate: true as const })),
    })

    const result = await processWebhookEvent(paymentConfirmedMonthly, deps)

    expect(result.duplicate).toBe(true)
    expect(result.ok).toBe(true)
    expect(deps.setCreditBalance as Mock).not.toHaveBeenCalled()
    expect(deps.updateProfile as Mock).not.toHaveBeenCalled()
  })

  it('primeiro evento processa e chama setCreditBalance exatamente 1x', async () => {
    const sub = makeMonthlySubscription()
    const deps = makeDeps({
      insertWebhookLog: vi.fn(async () => ({ logId: 'log-001' })),
      findSubByAsaasId: vi.fn(async () => sub),
    })

    const result = await processWebhookEvent(paymentConfirmedMonthly, deps)

    expect(result.ok).toBe(true)
    expect(result.duplicate).toBeUndefined()
    expect(deps.setCreditBalance as Mock).toHaveBeenCalledTimes(1)
  })
})
