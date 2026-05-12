import { describe, it, expect } from 'vitest'
import {
  ANALYTICS_EVENTS,
  isAllowedAnalyticsEvent,
} from '@/lib/analyticsEvents'
import { sanitizeProperties } from '@/lib/analytics'

describe('ANALYTICS_EVENTS', () => {
  it('is a non-empty readonly array', () => {
    expect(ANALYTICS_EVENTS.length).toBeGreaterThan(0)
  })

  it('contains expected core events', () => {
    expect(ANALYTICS_EVENTS).toContain('signup_completed')
    expect(ANALYTICS_EVENTS).toContain('essay_submitted')
    expect(ANALYTICS_EVENTS).toContain('subscription_confirmed')
  })
})

describe('isAllowedAnalyticsEvent', () => {
  it('returns true for known events', () => {
    expect(isAllowedAnalyticsEvent('signup_completed')).toBe(true)
    expect(isAllowedAnalyticsEvent('plans_viewed')).toBe(true)
    expect(isAllowedAnalyticsEvent('ocr_failed')).toBe(true)
  })

  it('returns false for unknown events', () => {
    expect(isAllowedAnalyticsEvent('unknown_event')).toBe(false)
    expect(isAllowedAnalyticsEvent('')).toBe(false)
    expect(isAllowedAnalyticsEvent('pageview')).toBe(false)
  })
})

describe('sanitizeProperties', () => {
  it('passes through safe properties', () => {
    const result = sanitizeProperties({ plan: 'pro', userId: '123', billingCycle: 'monthly' })
    expect(result).toEqual({ plan: 'pro', userId: '123', billingCycle: 'monthly' })
  })

  it('strips phone key', () => {
    const result = sanitizeProperties({ phone: '11999999999', plan: 'pro' })
    expect(result).not.toHaveProperty('phone')
    expect(result).toHaveProperty('plan')
  })

  it('strips token key', () => {
    const result = sanitizeProperties({ token: 'abc', userId: '1' })
    expect(result).not.toHaveProperty('token')
    expect(result).toHaveProperty('userId')
  })

  it('strips api_key key', () => {
    const result = sanitizeProperties({ api_key: 'secret', x: 1 })
    expect(result).not.toHaveProperty('api_key')
  })

  it('strips password key', () => {
    const result = sanitizeProperties({ password: 'hunter2', email: 'a@b.com' })
    expect(result).not.toHaveProperty('password')
    expect(result).toHaveProperty('email')
  })

  it('strips cpf key', () => {
    const result = sanitizeProperties({ cpf: '12345678900', amount: 99 })
    expect(result).not.toHaveProperty('cpf')
    expect(result).toHaveProperty('amount')
  })

  it('strips keys that contain sensitive substrings (case-insensitive)', () => {
    const result = sanitizeProperties({ accessToken: 'x', userPhone: '11999', name: 'Ana' })
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('userPhone')
    expect(result).toHaveProperty('name')
  })

  it('returns empty object for empty input', () => {
    expect(sanitizeProperties({})).toEqual({})
  })
})
