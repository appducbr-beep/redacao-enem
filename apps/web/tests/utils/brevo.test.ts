import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderBaseEmailTemplate } from '@/lib/emailTemplates'
import {
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/brevo'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockResolvedValue({ ok: true, status: 200 })
  process.env.BREVO_API_KEY = 'test-api-key'
  process.env.BREVO_SENDER_EMAIL = 'no-reply@reda1000.app.br'
  process.env.BREVO_SENDER_NAME = 'Reda1000'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  delete process.env.BREVO_API_KEY
})

describe('renderBaseEmailTemplate', () => {
  it('includes title in html', () => {
    const html = renderBaseEmailTemplate({ title: 'Test Title', preheader: 'pre', body: '<p>body</p>' })
    expect(html).toContain('Test Title')
  })

  it('includes preheader hidden text', () => {
    const html = renderBaseEmailTemplate({ title: 'T', preheader: 'Hidden preheader', body: '' })
    expect(html).toContain('Hidden preheader')
    expect(html).toContain('display:none')
  })

  it('includes body content', () => {
    const html = renderBaseEmailTemplate({ title: 'T', preheader: 'p', body: '<strong>Hello</strong>' })
    expect(html).toContain('<strong>Hello</strong>')
  })

  it('includes Reda1000 branding', () => {
    const html = renderBaseEmailTemplate({ title: 'T', preheader: 'p', body: '' })
    expect(html).toContain('Reda')
    expect(html).toContain('1000')
    expect(html).toContain('#2563eb')
  })

  it('is table-based layout (Gmail compatible)', () => {
    const html = renderBaseEmailTemplate({ title: 'T', preheader: 'p', body: '' })
    expect(html).toContain('<table')
    expect(html).not.toContain('display:flex')
    expect(html).not.toContain('display:grid')
  })
})

describe('sendTransactionalEmail', () => {
  it('calls brevo API with correct headers', async () => {
    await sendTransactionalEmail({
      sender: { email: 'no-reply@reda1000.app.br', name: 'Reda1000' },
      to: [{ email: 'user@test.com', name: 'User' }],
      subject: 'Test',
      htmlContent: '<p>test</p>',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(options.method).toBe('POST')
    expect(options.headers['api-key']).toBe('test-api-key')
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('does NOT call fetch when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY

    await sendTransactionalEmail({
      sender: { email: 'no-reply@reda1000.app.br', name: 'Reda1000' },
      to: [{ email: 'user@test.com' }],
      subject: 'Test',
      htmlContent: '<p>test</p>',
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not throw when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      sendTransactionalEmail({
        sender: { email: 'no-reply@reda1000.app.br', name: 'Reda1000' },
        to: [{ email: 'user@test.com' }],
        subject: 'Test',
        htmlContent: '<p>test</p>',
      })
    ).resolves.toBeUndefined()
  })

  it('does not throw when brevo returns non-ok status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    await expect(
      sendTransactionalEmail({
        sender: { email: 'no-reply@reda1000.app.br', name: 'Reda1000' },
        to: [{ email: 'user@test.com' }],
        subject: 'Test',
        htmlContent: '<p>test</p>',
      })
    ).resolves.toBeUndefined()
  })

  it('never includes BREVO_API_KEY in the request body', async () => {
    await sendTransactionalEmail({
      sender: { email: 'no-reply@reda1000.app.br', name: 'Reda1000' },
      to: [{ email: 'user@test.com' }],
      subject: 'Test',
      htmlContent: '<p>test</p>',
    })

    const body = mockFetch.mock.calls[0][1].body as string
    expect(body).not.toContain('test-api-key')
  })
})

describe('sendWelcomeEmail', () => {
  it('sends email with welcome subject', async () => {
    await sendWelcomeEmail('user@test.com', 'João')
    expect(mockFetch).toHaveBeenCalledOnce()
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subject).toContain('Bem-vindo')
    expect(body.to[0].email).toBe('user@test.com')
  })

  it('uses fallback name when name is null', async () => {
    await sendWelcomeEmail('user@test.com', null)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('Estudante')
  })

  it('includes user name in html when provided', async () => {
    await sendWelcomeEmail('user@test.com', 'Maria')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('Maria')
  })

  it('does not throw when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY
    await expect(sendWelcomeEmail('user@test.com', 'João')).resolves.toBeUndefined()
  })

  it('CTA links to /login (not root)', async () => {
    await sendWelcomeEmail('user@test.com', 'João')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('href="https://reda1000.app.br/login"')
  })

  it('includes email confirmation note', async () => {
    await sendWelcomeEmail('user@test.com', 'João')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('confirme seu e-mail')
  })
})

describe('sendSubscriptionConfirmedEmail', () => {
  it('sends email with confirmed subject', async () => {
    await sendSubscriptionConfirmedEmail('user@test.com', 'João', 'monthly')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subject).toContain('confirmada')
    expect(body.to[0].email).toBe('user@test.com')
  })

  it('includes billing cycle in html', async () => {
    await sendSubscriptionConfirmedEmail('user@test.com', 'João', 'yearly')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('anual')
  })

  it('labels monthly cycle correctly', async () => {
    await sendSubscriptionConfirmedEmail('user@test.com', 'João', 'monthly')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.htmlContent).toContain('mensal')
  })

  it('does not throw when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY
    await expect(
      sendSubscriptionConfirmedEmail('user@test.com', null, 'monthly')
    ).resolves.toBeUndefined()
  })
})

describe('sendSubscriptionCancelledEmail', () => {
  it('sends immediate cancellation email', async () => {
    await sendSubscriptionCancelledEmail('user@test.com', 'João', 'immediate')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subject).toContain('cancelada')
  })

  it('sends scheduled cancellation email with access date', async () => {
    await sendSubscriptionCancelledEmail(
      'user@test.com',
      'Maria',
      'scheduled',
      '2026-06-15T12:00:00Z'
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subject).toContain('agendado')
    expect(body.htmlContent).toContain('15/06/2026')
  })

  it('handles scheduled without accessUntil gracefully', async () => {
    await expect(
      sendSubscriptionCancelledEmail('user@test.com', 'João', 'scheduled')
    ).resolves.toBeUndefined()
  })

  it('does not throw when BREVO_API_KEY is missing', async () => {
    delete process.env.BREVO_API_KEY
    await expect(
      sendSubscriptionCancelledEmail('user@test.com', null, 'immediate')
    ).resolves.toBeUndefined()
  })
})
