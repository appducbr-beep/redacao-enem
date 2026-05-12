import { describe, it, expect } from 'vitest'
import { sanitizePhone, formatPhone, isValidOptionalPhone } from '@/lib/phoneUtils'

describe('sanitizePhone', () => {
  it('remove non-digits from formatted number', () => {
    expect(sanitizePhone('(11) 99999-8888')).toBe('11999998888')
  })
  it('removes dots and spaces', () => {
    expect(sanitizePhone('11 9.9999-8888')).toBe('11999998888')
  })
  it('returns empty string for empty input', () => {
    expect(sanitizePhone('')).toBe('')
  })
  it('returns digits unchanged if already clean', () => {
    expect(sanitizePhone('11999998888')).toBe('11999998888')
  })
})

describe('formatPhone', () => {
  it('formats 11-digit mobile number', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })
  it('formats 10-digit landline number', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
  it('returns raw string if not 10 or 11 digits', () => {
    expect(formatPhone('123')).toBe('123')
  })
  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('')
  })
})

describe('isValidOptionalPhone', () => {
  it('returns true for empty string', () => {
    expect(isValidOptionalPhone('')).toBe(true)
  })
  it('returns true for whitespace-only string', () => {
    expect(isValidOptionalPhone('   ')).toBe(true)
  })
  it('returns true for valid 11-digit formatted mobile', () => {
    expect(isValidOptionalPhone('(11) 99999-8888')).toBe(true)
  })
  it('returns true for valid 10-digit formatted landline', () => {
    expect(isValidOptionalPhone('(11) 3333-4444')).toBe(true)
  })
  it('returns true for valid unformatted 11-digit number', () => {
    expect(isValidOptionalPhone('11999998888')).toBe(true)
  })
  it('returns false for too short number', () => {
    expect(isValidOptionalPhone('11 9999')).toBe(false)
  })
  it('returns false for too long number', () => {
    expect(isValidOptionalPhone('119999988881')).toBe(false)
  })
})
