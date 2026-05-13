# Task 033 — Robustez e Observabilidade de Produção

**Status:** Concluída  
**Data:** 2026-05-12  
**Branch:** v2-pre-lancamento

---

## Objetivo

Aumentar robustez, resiliência e observabilidade do produto antes da entrada de usuários reais, sem adicionar features novas ou infraestrutura pesada.

---

## 1. Error Boundaries

### `app/error.tsx` (Client Component)
Captura erros inesperados em qualquer página do App Router. Exibe:
- Ícone de alerta, título "Algo inesperado aconteceu."
- Botão "Tentar novamente" → chama `reset()`
- Link "Voltar ao início" → `/`
- ID de referência (`error.digest` ou `generateErrorId()`) para suporte

### `app/global-error.tsx` (Client Component)
Fallback de último recurso para erros no layout raiz. Renderiza HTML/body completo (necessário pelo Next.js). Visual simples e elegante com inline styles — sem depender do Tailwind que pode não carregar no crash.

### `app/not-found.tsx` (Server Component)
Página 404 premium:
- "404" em cinza claro como elemento visual
- Título "Página não encontrada"
- CTA: "Voltar ao início" + "Ver temas"

---

## 2. Loading States (Skeletons)

Loading files criados para 6 rotas dinâmicas:

| Rota | Arquivo |
|---|---|
| `/temas` | `app/temas/loading.tsx` |
| `/redacao/nova` | `app/redacao/nova/loading.tsx` |
| `/redacoes` | `app/redacoes/loading.tsx` |
| `/evolucao` | `app/evolucao/loading.tsx` |
| `/planos` | `app/planos/loading.tsx` |
| `/perfil` | `app/perfil/loading.tsx` |

Todos usam `animate-pulse` + `bg-slate-200` para pulse skeleton. Estrutura visual condizente com o layout real de cada página — sem flicker ou tela branca durante SSR.

---

## 3. Logger Estruturado — `lib/logger.ts`

```ts
logInfo(message, context?)   // → console.log
logWarn(message, context?)   // → console.warn
logError(message, context?)  // → console.error
sanitizeLogContext(ctx)       // exportada para testes e uso externo
```

Formato:
```json
[reda1000] {"level":"info","message":"webhook received","context":{"event":"PAYMENT_CONFIRMED"},"timestamp":"2026-05-12T..."}
```

Sanitização automática de context: strip em keys contendo `cpf, phone, token, api_key, password, secret, text, content, cvv, card`.

---

## 4. Error ID Generator — `lib/errorId.ts`

```ts
generateErrorId() // → "ERR-20260512-A3K9P1"
```

Formato: `ERR-YYYYMMDD-6CHARS` (alfanumérico uppercase). Usado em:
- `app/error.tsx` — exibido para o usuário como código de suporte
- `app/actions/corrections.ts` — incluído na mensagem de erro de correção

---

## 5. Fallbacks Melhorados

### OCR (app/actions/ocr.ts)
Antes: `"Falha ao extrair texto da imagem. Tente novamente."`  
Depois: `"Não foi possível extrair o texto automaticamente. Você ainda pode digitar ou colar sua redação manualmente."`

### Correção IA (app/actions/corrections.ts)
Antes: `"Erro ao corrigir redação. Seu crédito foi devolvido."`  
Depois: `"A correção não pôde ser concluída agora. Tente novamente em alguns minutos. Seu crédito foi devolvido. (Ref: ERR-...)"`

### CorrectNowButton (components/CorrectNowButton.tsx)
Antes: erros de correção eram silenciados.  
Depois: `runEssayCorrection` retorna `{ error }` que é exibido em caixa vermelha abaixo do botão. Usuário vê a mensagem sem precisar recarregar.

---

## 6. Webhook Robustez

`app/api/asaas/webhook/route.ts` — substituídos todos os `console.*` por `logInfo/logWarn/logError`:
- Início: `logInfo('webhook received', { event, event_id })`
- Duplicata: `logInfo('webhook duplicate skipped', ...)`
- Erro: `logError('webhook handler error', { event, event_id, error, ms })`
- Sucesso: `logInfo('webhook processed', { event, event_id, ms })` com tempo de processamento

`lib/asaasWebhookProcessor.ts`:
- Eventos não tratados: `logInfo('webhook event unhandled', { event })`
- Erros no processamento: `logError('webhook event processing error', { event, event_id, error })`

---

## 7. Cron Robustez

`app/api/cron/subscriptions/route.ts`:
- `logInfo('cron subscriptions started')` no início
- `logError('cron credit_resets failed', { error })` em falhas individuais
- `logError('cron expirations failed', { error })` em falhas individuais
- `logInfo('cron subscriptions finished', { ...results, ms })` com duração total

---

## 8. Analytics Retry

`lib/analytics.ts` — `trackEvent` agora faz até 1 retry em erros de rede (5xx ou network throw):

```ts
for (let attempt = 0; attempt < 2; attempt++) {
  try {
    const res = await fetch('/api/analytics', ...)
    if (res.ok || res.status < 500) return // sem retry em 4xx
  } catch {
    // network error — retry once
  }
}
```

---

## 9. Testes — `tests/utils/productionHardening.test.ts`

18 casos novos:
- `generateErrorId`: 4 casos (formato regex, prefixo, unicidade, data)
- `sanitizeLogContext`: 6 casos (passthrough, phone, token, content, substrings, empty)
- `logInfo`: 4 casos (console.log chamado, JSON válido, level/message/timestamp, sanitização)
- `logWarn`: 2 casos (console.warn, level=warn)
- `logError`: 2 casos (console.error, level=error)

---

## QA

- **136 testes passando** (+18 novos vs. 032)
- **0 erros de lint**, build limpo
- 2 warnings pré-existentes em `billing.ts` (`_prev`, `_formData`) — não introduzidos por esta task

---

## Limitações

- `app/error.tsx` não integra com Sentry ou provider externo — apenas `console.error`
- Sem deduplicação de error IDs — cada render gera um ID novo (estável por instância via `useState`)
- Skeletons são estáticos — sem shimmer animation customizada (usa `animate-pulse` do Tailwind)
- Retry em `trackEvent` só cobre falhas de rede — sem exponential backoff
- `global-error.tsx` usa inline styles (necessário — CSS do Tailwind pode não carregar no crash)
- Logger não tem níveis configuráveis por ambiente (sempre loga tudo)

---

## Expansões Futuras

- Integrar Sentry/PostHog Error Monitoring quando houver usuários reais
- `logError` poderia enviar evento para painel de alertas (Slack, Telegram)
- Adicionar `app/redacoes/[id]/error.tsx` para erros específicos da página de resultado
- Retry com exponential backoff para OCR e correção IA
- Progress indicator no CorrectNowButton (polling de status ao invés de espera passiva)
- Logger com nível mínimo configurável via `LOG_LEVEL` env var
