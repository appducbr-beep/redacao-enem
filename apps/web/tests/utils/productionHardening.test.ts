import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateErrorId } from '@/lib/errorId'
import { logInfo, logWarn, logError, sanitizeLogContext } from '@/lib/logger'

describe('generateErrorId', () => {
  it('returns string matching ERR-YYYYMMDD-XXXXXX format', () => {
    const id = generateErrorId()
    expect(id).toMatch(/^ERR-\d{8}-[A-Z0-9]{6}$/)
  })

  it('starts with ERR-', () => {
    expect(generateErrorId().startsWith('ERR-')).toBe(true)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateErrorId()))
    expect(ids.size).toBe(200)
  })

  it('date part matches today', () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const id = generateErrorId()
    expect(id).toContain(today)
  })
})

describe('sanitizeLogContext', () => {
  it('passes through safe keys', () => {
    const result = sanitizeLogContext({ userId: 'abc', plan: 'pro', status: 'active' })
    expect(result).toEqual({ userId: 'abc', plan: 'pro', status: 'active' })
  })

  it('strips phone key', () => {
    const result = sanitizeLogContext({ phone: '11999', userId: '1' })
    expect(result).not.toHaveProperty('phone')
    expect(result).toHaveProperty('userId')
  })

  it('strips token key', () => {
    const result = sanitizeLogContext({ token: 'secret', event: 'login' })
    expect(result).not.toHaveProperty('token')
    expect(result).toHaveProperty('event')
  })

  it('strips content and text keys (essay text protection)', () => {
    const result = sanitizeLogContext({ content: 'long essay...', essayId: 'xyz' })
    expect(result).not.toHaveProperty('content')
    expect(result).toHaveProperty('essayId')
  })

  it('strips keys with sensitive substrings', () => {
    const result = sanitizeLogContext({ accessToken: 'x', userPhone: '11999', name: 'Ana' })
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('userPhone')
    expect(result).toHaveProperty('name')
  })

  it('returns empty object for empty input', () => {
    expect(sanitizeLogContext({})).toEqual({})
  })
})

describe('logInfo', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => spy.mockRestore())

  it('calls console.log with [reda1000] prefix', () => {
    logInfo('test message')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[reda1000]'))
  })

  it('output is valid JSON after prefix', () => {
    logInfo('test', { key: 'value' })
    const raw = spy.mock.calls[0][0] as string
    const json = raw.replace('[reda1000] ', '')
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('payload has level=info, message, timestamp', () => {
    logInfo('hello world', { extra: 'data' })
    const raw = spy.mock.calls[0][0] as string
    const payload = JSON.parse(raw.replace('[reda1000] ', ''))
    expect(payload.level).toBe('info')
    expect(payload.message).toBe('hello world')
    expect(payload.timestamp).toBeTruthy()
    expect(payload.context).toEqual({ extra: 'data' })
  })

  it('strips sensitive keys from context', () => {
    logInfo('event', { phone: '11999', userId: 'abc' })
    const raw = spy.mock.calls[0][0] as string
    const payload = JSON.parse(raw.replace('[reda1000] ', ''))
    expect(payload.context).not.toHaveProperty('phone')
    expect(payload.context).toHaveProperty('userId')
  })
})

describe('logWarn', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => spy.mockRestore())

  it('calls console.warn with [reda1000] prefix', () => {
    logWarn('warning message')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[reda1000]'))
  })

  it('payload has level=warn', () => {
    logWarn('warn')
    const raw = spy.mock.calls[0][0] as string
    const payload = JSON.parse(raw.replace('[reda1000] ', ''))
    expect(payload.level).toBe('warn')
  })
})

describe('logError', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => spy.mockRestore())

  it('calls console.error with [reda1000] prefix', () => {
    logError('error message')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[reda1000]'))
  })

  it('payload has level=error', () => {
    logError('err')
    const raw = spy.mock.calls[0][0] as string
    const payload = JSON.parse(raw.replace('[reda1000] ', ''))
    expect(payload.level).toBe('error')
  })
})
