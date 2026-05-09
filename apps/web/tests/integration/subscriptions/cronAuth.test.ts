import { describe, it, expect } from 'vitest'
import { validateCronRequest } from '@/lib/cronAuth'

const SECRET = 'test-secret-abc123'

function makeHeaders(map: Record<string, string>) {
  return {
    get: (name: string) => map[name.toLowerCase()] ?? null,
  }
}

describe('validateCronRequest', () => {
  it('Authorization: Bearer correto → autorizado', () => {
    const headers = makeHeaders({ authorization: `Bearer ${SECRET}` })
    const result = validateCronRequest(headers, SECRET)
    expect(result.ok).toBe(true)
  })

  it('x-cron-secret correto → autorizado', () => {
    const headers = makeHeaders({ 'x-cron-secret': SECRET })
    const result = validateCronRequest(headers, SECRET)
    expect(result.ok).toBe(true)
  })

  it('token ausente → 401', () => {
    const headers = makeHeaders({})
    const result = validateCronRequest(headers, SECRET)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    }
  })

  it('Authorization: Bearer errado → 401', () => {
    const headers = makeHeaders({ authorization: 'Bearer wrong-secret' })
    const result = validateCronRequest(headers, SECRET)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(401)
  })

  it('x-cron-secret errado → 401', () => {
    const headers = makeHeaders({ 'x-cron-secret': 'wrong-secret' })
    const result = validateCronRequest(headers, SECRET)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(401)
  })

  it('CRON_SECRET ausente (undefined) → 500', () => {
    const headers = makeHeaders({ authorization: `Bearer ${SECRET}` })
    const result = validateCronRequest(headers, undefined)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(500)
      expect(result.error).toBe('CRON_SECRET not configured')
    }
  })

  it('CRON_SECRET ausente (string vazia) → 500', () => {
    const headers = makeHeaders({ 'x-cron-secret': SECRET })
    const result = validateCronRequest(headers, '')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(500)
  })
})
