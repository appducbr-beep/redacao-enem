# Task 032 — Analytics e Eventos Básicos do Produto

**Status:** Concluída  
**Data:** 2026-05-12  
**Branch:** v2-pre-lancamento

---

## Objetivo

Criar uma camada de analytics leve, segura e extensível que registra eventos de produto sem depender de nenhuma plataforma externa — apenas `console.log` estruturado, substituível por qualquer provider no futuro.

---

## Estratégia: wrapper thin + allowlist

- **Server**: `trackServerEvent` → `console.log('[analytics]', JSON.stringify(payload))` — nunca lança exceção
- **Client**: `trackEvent` → POST `/api/analytics` (best-effort, erro silenciado)
- **Allowlist**: só eventos em `ANALYTICS_EVENTS` são aceitos/logados — eventos desconhecidos retornam 400
- **Sanitização**: `sanitizeProperties` remove chaves com substrings sensíveis (cpf, phone, token, api_key, password, secret, cvv, card)

---

## Arquivos criados

### `lib/analyticsEvents.ts`

```ts
export const ANALYTICS_EVENTS = [...] as const
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]
export function isAllowedAnalyticsEvent(event: string): event is AnalyticsEventName
```

17 eventos registrados (ver lista abaixo).

### `lib/analytics.ts`

```ts
export function sanitizeProperties(props): Record<string, unknown>
export function trackServerEvent(eventName, userId?, properties?): void
export async function trackEvent(eventName, properties?): Promise<void>
```

### `app/api/analytics/route.ts`

POST endpoint:
- Valida allowlist via `isAllowedAnalyticsEvent`
- Sanitiza properties
- Loga `[analytics]` com `source: 'client'`
- Retorna `400` para eventos desconhecidos

---

## Eventos registrados

| Evento | Onde | Dados extras |
|---|---|---|
| `signup_completed` | `actions/auth.ts` → signUp | `{ plan: 'free' }` |
| `login_completed` | `actions/auth.ts` → signIn | — |
| `profile_updated` | `actions/profile.ts` | — |
| `essay_submitted` | `actions/essays.ts` | `{ essay_id, topic_id }` |
| `ocr_started` | `actions/ocr.ts` | `{ file_type, file_size }` |
| `ocr_completed` | `actions/ocr.ts` | — |
| `ocr_failed` | `actions/ocr.ts` | `{ error }` |
| `checkout_started` | `actions/subscribe.ts` | `{ plan, billing_cycle }` |
| `subscription_confirmed` | `lib/asaasWebhookProcessor.ts` | `{ billing_cycle }` |
| `subscription_cancelled` | `actions/billing.ts` + webhook | `{ cancellation_type }` / `{ source: 'webhook' }` |
| `subscription_cancel_scheduled` | `actions/billing.ts` | `{ cancellation_type: 'scheduled' }` |
| `cron_subscriptions_processed` | `api/cron/subscriptions/route.ts` | `{ credit_resets, expirations }` |
| `landing_viewed` | `app/page.tsx` | — |
| `onboarding_started` | `app/page.tsx` | — |
| `history_viewed` | `app/redacoes/page.tsx` | — |
| `evolution_viewed` | `app/evolucao/page.tsx` | — |
| `plans_viewed` | `app/planos/page.tsx` | — |

---

## Testes — `tests/utils/analyticsEvents.test.ts`

12 casos novos:
- `ANALYTICS_EVENTS`: 2 casos (length, core events)
- `isAllowedAnalyticsEvent`: 5 casos (known, unknown, empty, pageview, ocr_failed)
- `sanitizeProperties`: 8 casos (safe passthrough, phone, token, api_key, password, cpf, substring match, empty)

---

## QA

- 118 testes passando (+12 novos vs. 031)
- 0 erros de lint, build limpo
- 2 warnings pré-existentes em `billing.ts` (`_prev`, `_formData`) — não introduzidos por esta task

---

## Limitações

- Nenhum provider externo (Mixpanel, Amplitude, PostHog) integrado — só `console.log`
- Eventos de page view disparam em toda renderização SSR (sem deduplicação)
- `trackEvent` (client) não implementado em nenhum componente ainda — disponível para uso futuro
- Sem user properties / identify calls

---

## Expansões futuras

- Substituir `console.log` por chamada HTTP ao provider escolhido (Posthog, Mixpanel)
- Adicionar `trackEvent` em componentes client (ex.: clique em "Começar agora" do OnboardingCard)
- Deduplicação de page views com edge middleware
- User properties: plano atual, contagem de redações
- Funnel tracking: landing → register → first_essay → first_correction
