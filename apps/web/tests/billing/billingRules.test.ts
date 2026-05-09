import { describe, it, expect } from 'vitest'
import {
  isWithinGuaranteePeriod,
  getPeriodEnd,
  getNextCreditResetDate,
  getCreditBalanceAfterProActivation,
  getCreditBalanceAfterFreeDowngrade,
  shouldCancelImmediately,
  shouldKeepAccessUntilPeriodEnd,
} from '@/lib/billingRules'

const DAY_MS = 86_400_000

// Fixed reference point so tests are deterministic
const BASE = new Date('2026-01-15T12:00:00.000Z')

describe('isWithinGuaranteePeriod', () => {
  it('1 dia após início → true', () => {
    const now = new Date(BASE.getTime() + 1 * DAY_MS)
    expect(isWithinGuaranteePeriod(BASE, now)).toBe(true)
  })

  it('exatamente 7 dias → true (limite inclusivo)', () => {
    const now = new Date(BASE.getTime() + 7 * DAY_MS)
    expect(isWithinGuaranteePeriod(BASE, now)).toBe(true)
  })

  it('8 dias → false', () => {
    const now = new Date(BASE.getTime() + 8 * DAY_MS)
    expect(isWithinGuaranteePeriod(BASE, now)).toBe(false)
  })

  it('7 dias + 1ms → false', () => {
    const now = new Date(BASE.getTime() + 7 * DAY_MS + 1)
    expect(isWithinGuaranteePeriod(BASE, now)).toBe(false)
  })
})

describe('shouldCancelImmediately', () => {
  it('dentro de 7 dias → immediate', () => {
    const now = new Date(BASE.getTime() + 3 * DAY_MS)
    expect(shouldCancelImmediately(BASE, now)).toBe(true)
  })

  it('após 7 dias → não immediate', () => {
    const now = new Date(BASE.getTime() + 10 * DAY_MS)
    expect(shouldCancelImmediately(BASE, now)).toBe(false)
  })

  it('startDate null → fallback conservador (immediate)', () => {
    const now = new Date(BASE.getTime() + 30 * DAY_MS)
    expect(shouldCancelImmediately(null, now)).toBe(true)
  })
})

describe('shouldKeepAccessUntilPeriodEnd', () => {
  it('após 7 dias → manter acesso até period_end', () => {
    const now = new Date(BASE.getTime() + 10 * DAY_MS)
    expect(shouldKeepAccessUntilPeriodEnd(BASE, now)).toBe(true)
  })

  it('dentro de 7 dias → não manter (cancelamento imediato)', () => {
    const now = new Date(BASE.getTime() + 3 * DAY_MS)
    expect(shouldKeepAccessUntilPeriodEnd(BASE, now)).toBe(false)
  })

  it('startDate null → false (sem período a manter)', () => {
    const now = new Date(BASE.getTime() + 30 * DAY_MS)
    expect(shouldKeepAccessUntilPeriodEnd(null, now)).toBe(false)
  })
})

describe('getPeriodEnd', () => {
  it('mensal: current_period_end = +1 mês', () => {
    const start = new Date('2026-01-15T12:00:00.000Z')
    const end = getPeriodEnd(start, 'monthly')
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(1) // fevereiro (0-indexed)
    expect(end.getDate()).toBe(15)
  })

  it('anual: current_period_end = +1 ano', () => {
    const start = new Date('2026-01-15T12:00:00.000Z')
    const end = getPeriodEnd(start, 'yearly')
    expect(end.getFullYear()).toBe(2027)
    expect(end.getMonth()).toBe(0) // janeiro
    expect(end.getDate()).toBe(15)
  })

  it('não muta o startDate original', () => {
    const start = new Date('2026-03-01T12:00:00.000Z')
    const original = start.getTime()
    getPeriodEnd(start, 'monthly')
    expect(start.getTime()).toBe(original)
  })
})

describe('getNextCreditResetDate', () => {
  it('anual: next_credit_reset = +1 mês', () => {
    const start = new Date('2026-01-15T12:00:00.000Z')
    const reset = getNextCreditResetDate(start, 'yearly')
    expect(reset).not.toBeNull()
    expect(reset!.getMonth()).toBe(1) // fevereiro
    expect(reset!.getDate()).toBe(15)
  })

  it('mensal: next_credit_reset = null', () => {
    const start = new Date('2026-01-15T12:00:00.000Z')
    expect(getNextCreditResetDate(start, 'monthly')).toBeNull()
  })
})

describe('créditos — valores fixos', () => {
  it('Pro activation → saldo = 20 (independente de saldo anterior)', () => {
    expect(getCreditBalanceAfterProActivation()).toBe(20)
  })

  it('Pro activation com saldo 0 → 20', () => {
    const currentBalance = 0
    expect(getCreditBalanceAfterProActivation()).toBeGreaterThan(currentBalance)
    expect(getCreditBalanceAfterProActivation()).toBe(20)
  })

  it('Pro activation com saldo 3 → 20 (não acumula)', () => {
    expect(getCreditBalanceAfterProActivation()).toBe(20)
  })

  it('Pro activation com saldo 25 → 20 (não acumula acima do teto)', () => {
    expect(getCreditBalanceAfterProActivation()).toBe(20)
  })

  it('não acumula: ativar Pro duas vezes ainda resulta em 20', () => {
    const first = getCreditBalanceAfterProActivation()
    const second = getCreditBalanceAfterProActivation()
    expect(first).toBe(second)
    expect(second).toBe(20)
  })

  it('Free downgrade → 3 créditos', () => {
    expect(getCreditBalanceAfterFreeDowngrade()).toBe(3)
  })
})
