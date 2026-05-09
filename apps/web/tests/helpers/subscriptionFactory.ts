import { ASAAS_SUB_ID_MONTHLY, ASAAS_SUB_ID_YEARLY } from './asaasPayloads'

export function makeMonthlySubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-db-uuid-monthly',
    user_id: 'user-uuid-001',
    billing_cycle: 'monthly',
    status: 'active',
    asaas_subscription_id: ASAAS_SUB_ID_MONTHLY,
    current_period_start: '2026-01-15T12:00:00.000Z',
    current_period_end: null,
    next_credit_reset_at: null,
    cancel_at_period_end: false,
    ...overrides,
  }
}

export function makeYearlySubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-db-uuid-yearly',
    user_id: 'user-uuid-002',
    billing_cycle: 'yearly',
    status: 'active',
    asaas_subscription_id: ASAAS_SUB_ID_YEARLY,
    current_period_start: '2026-01-15T12:00:00.000Z',
    current_period_end: null,
    next_credit_reset_at: null,
    cancel_at_period_end: false,
    ...overrides,
  }
}
