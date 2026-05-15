import { logError } from './logger'
import { renderBaseEmailTemplate } from './emailTemplates'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reda1000.app.br'

type BrevoPayload = {
  sender: { email: string; name: string }
  to: Array<{ email: string; name?: string }>
  subject: string
  htmlContent: string
}

function getSender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL ?? 'no-reply@reda1000.app.br',
    name: process.env.BREVO_SENDER_NAME ?? 'Reda1000',
  }
}

export async function sendTransactionalEmail(payload: BrevoPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    logError('brevo email skipped: BREVO_API_KEY not set', { subject: payload.subject })
    return
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      logError('brevo email failed', { status: res.status, subject: payload.subject })
    }
  } catch (err) {
    logError('brevo email error', { error: String(err), subject: payload.subject })
  }
}

export async function sendWelcomeEmail(email: string, name: string | null): Promise<void> {
  const displayName = name ?? 'Estudante'
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#0f172a;">Bem-vindo(a) ao Reda1000, ${displayName}!</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Sua conta foi criada com sucesso. Você tem créditos gratuitos para começar a praticar agora mesmo.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#1d4ed8;">O que você pode fazer agora:</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">✅&nbsp; Enviar sua redação para análise por competência</td></tr>
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">✅&nbsp; Ver feedback detalhado nas 5 competências do ENEM</td></tr>
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">✅&nbsp; Acompanhar sua evolução ao longo do tempo</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 32px;border-radius:100px;">
            Começar a treinar
          </a>
        </td>
      </tr>
    </table>
  `

  await sendTransactionalEmail({
    sender: getSender(),
    to: [{ email, name: displayName }],
    subject: 'Bem-vindo(a) ao Reda1000!',
    htmlContent: renderBaseEmailTemplate({
      title: 'Bem-vindo ao Reda1000',
      preheader: `Olá ${displayName}, sua conta foi criada. Comece a praticar agora!`,
      body,
    }),
  })
}

export async function sendSubscriptionConfirmedEmail(
  email: string,
  name: string | null,
  billingCycle: string
): Promise<void> {
  const displayName = name ?? 'Estudante'
  const cycleLabel = billingCycle === 'yearly' ? 'anual' : 'mensal'
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#0f172a;">Assinatura Pro confirmada!</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Olá, ${displayName}! Seu pagamento do plano <strong>Pro ${cycleLabel}</strong> foi confirmado. Você agora tem acesso completo ao Reda1000 Pro.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:bold;color:#1d4ed8;">Seu plano Pro inclui:</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">⭐&nbsp; 20 correções por ciclo de faturamento</td></tr>
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">⭐&nbsp; Análise detalhada nas 5 competências do ENEM</td></tr>
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">⭐&nbsp; Histórico completo de todas as suas redações</td></tr>
            <tr><td style="padding:3px 0;font-size:14px;color:#334155;">⭐&nbsp; Acompanhamento de evolução ao longo do tempo</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${APP_URL}/redacao/nova" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 32px;border-radius:100px;">
            Enviar minha redação
          </a>
        </td>
      </tr>
    </table>
  `

  await sendTransactionalEmail({
    sender: getSender(),
    to: [{ email, name: displayName }],
    subject: 'Sua assinatura Pro foi confirmada!',
    htmlContent: renderBaseEmailTemplate({
      title: 'Assinatura Pro confirmada',
      preheader: `Plano Pro ${cycleLabel} ativado. Aproveite todas as funcionalidades!`,
      body,
    }),
  })
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string | null,
  type: 'immediate' | 'scheduled',
  accessUntil?: string
): Promise<void> {
  const displayName = name ?? 'Estudante'
  const isScheduled = type === 'scheduled'

  const accessLine =
    isScheduled && accessUntil
      ? `Você ainda tem acesso ao plano Pro até <strong>${new Date(accessUntil).toLocaleDateString('pt-BR')}</strong>.`
      : 'Seu acesso ao plano Pro foi encerrado.'

  const subject = isScheduled
    ? 'Cancelamento agendado para o fim do período'
    : 'Sua assinatura Pro foi cancelada'

  const preheader = isScheduled
    ? `Acesso Pro mantido até ${accessUntil ? new Date(accessUntil).toLocaleDateString('pt-BR') : 'fim do período'}.`
    : 'Sua assinatura Pro foi cancelada.'

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#0f172a;">
      ${isScheduled ? 'Cancelamento agendado' : 'Assinatura cancelada'}
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Olá, ${displayName}. Recebemos seu pedido de cancelamento da assinatura Pro. ${accessLine}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;">
            Você poderá continuar usando o Reda1000 gratuitamente com os créditos disponíveis. Esperamos que você considere voltar ao Pro em breve!
          </p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <a href="${APP_URL}/planos" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 32px;border-radius:100px;">
            Ver planos
          </a>
        </td>
      </tr>
    </table>
  `

  await sendTransactionalEmail({
    sender: getSender(),
    to: [{ email, name: displayName }],
    subject,
    htmlContent: renderBaseEmailTemplate({ title: subject, preheader, body }),
  })
}
