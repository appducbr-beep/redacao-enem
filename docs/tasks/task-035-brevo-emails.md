# Task 035 — Brevo e E-mails Transacionais

**Status:** Concluída  
**Data:** 2026-05-14  
**Branch:** v2-pre-lancamento

---

## Objetivo

Adicionar e-mails transacionais ao produto usando Brevo (SMTP API), disparados em eventos-chave: cadastro, confirmação de pagamento e cancelamento de assinatura.

---

## Arquitetura

- **Camada de envio:** `lib/brevo.ts` — thin wrapper sobre `fetch` para a API REST do Brevo
- **Templates:** `lib/emailTemplates.ts` — HTML Gmail-compatible, table-based, sem CSS externo
- **Resilência:** todos os erros capturados internamente com `logError` — nunca lançam exceção
- **Segurança:** `BREVO_API_KEY` nunca exposta no client, nunca logada, nunca incluída no body da request

---

## Arquivos criados

### `lib/emailTemplates.ts`

```ts
export function renderBaseEmailTemplate(params: {
  title: string
  preheader: string
  body: string
}): string
```

- HTML com `<!DOCTYPE>`, charset, viewport
- Preheader hidden text (compatível com Gmail/Outlook)
- Header azul com logo Reda1000 (`background:#2563eb`)
- Card branco com conteúdo injetado via `body`
- Footer com copyright e link

### `lib/brevo.ts`

```ts
export async function sendTransactionalEmail(payload: BrevoPayload): Promise<void>
export async function sendWelcomeEmail(email: string, name: string | null): Promise<void>
export async function sendSubscriptionConfirmedEmail(email, name, billingCycle): Promise<void>
export async function sendSubscriptionCancelledEmail(email, name, type, accessUntil?): Promise<void>
```

- `sendTransactionalEmail`: POST `https://api.brevo.com/v3/smtp/email` com header `api-key`
- Se `BREVO_API_KEY` não estiver definida: loga e retorna sem lançar
- Erros de rede/status 4xx/5xx: capturados com `logError`, nunca relançados
- `sendWelcomeEmail`: subject "Bem-vindo(a) ao Reda1000!"
- `sendSubscriptionConfirmedEmail`: subject "Sua assinatura Pro foi confirmada!"
- `sendSubscriptionCancelledEmail`: subject varia por `type` ('immediate' | 'scheduled')
  - `scheduled` + `accessUntil` → exibe data de acesso formatada em pt-BR

---

## Arquivos criados (testes)

### `tests/utils/brevo.test.ts`

22 casos:
- `renderBaseEmailTemplate`: 5 casos (title, preheader, body, branding, table-based)
- `sendTransactionalEmail`: 5 casos (headers corretos, no-call sem API key, no-throw em network error, no-throw em 500, API key não está no body)
- `sendWelcomeEmail`: 4 casos (subject, fallback name, nome no HTML, no-throw sem key)
- `sendSubscriptionConfirmedEmail`: 4 casos (subject, yearly label, monthly label, no-throw)
- `sendSubscriptionCancelledEmail`: 4 casos (immediate subject, scheduled com data, scheduled sem data, no-throw)

---

## Arquivos modificados

### `app/actions/auth.ts`

```ts
import { sendWelcomeEmail } from '@/lib/brevo'
// após trackServerEvent:
sendWelcomeEmail(data.user.email!, fullName).catch(() => {})
```

Fire-and-forget — não bloqueia o redirect.

### `app/actions/billing.ts`

```ts
import { sendSubscriptionCancelledEmail } from '@/lib/brevo'
// busca nome do perfil em paralelo com a subscription:
const [{ data: sub }, { data: profile }] = await Promise.all([...])
const userName = profile?.full_name ?? null
// após redirect decision:
sendSubscriptionCancelledEmail(user.email!, userName, 'immediate').catch(() => {})
// ou:
sendSubscriptionCancelledEmail(user.email!, userName, 'scheduled', sub.current_period_end).catch(() => {})
```

### `lib/asaasWebhookProcessor.ts`

Adicionado campo opcional à interface `WebhookProcessorDeps`:

```ts
findUserById?(userId: string): Promise<{ email: string; name: string | null } | null>
```

- Se presente, busca email/nome e dispara email pós-confirmação e pós-cancelamento
- Se ausente (testes), ignora silenciosamente — nenhum teste existente quebra

### `app/api/asaas/webhook/route.ts`

Adicionado `findUserById` ao `createDeps()`:

```ts
findUserById: async (userId) => {
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (!authData?.user?.email) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).maybeSingle()
  return { email: authData.user.email, name: profile?.full_name ?? null }
}
```

---

## Env vars adicionadas

| Variável | Obrigatória | Sensível |
|---|---|---|
| `BREVO_API_KEY` | Sim (para envio) | **Sim** — nunca `NEXT_PUBLIC_` |
| `BREVO_SENDER_EMAIL` | Não | Não |
| `BREVO_SENDER_NAME` | Não | Não |

---

## QA

- **158 testes passando** (+22 novos vs. 033)
- 0 erros de lint, build limpo
- Testes validam: templates, headers, resilência (sem key, rede, 500), conteúdo por evento

---

## Limitações

- Sem deduplicação de e-mails (ex.: webhook retry pode disparar 2 e-mails de confirmação)
- Reset de senha usa Supabase nativo (sem customização Brevo) — documentado no spec
- Sem unsubscribe link — adicionar quando houver e-mails de marketing
- `sendWelcomeEmail` não espera confirmação de e-mail do Supabase (dispara imediatamente no signup)

---

## Expansões futuras

- Customizar template de reset de senha via Brevo (atualmente via Supabase)
- Adicionar link de unsubscribe em e-mails de marketing
- Deduplicar disparo de confirmação no webhook (idempotência por `asaas_payment_id`)
- E-mail de lembrete de créditos esgotados
