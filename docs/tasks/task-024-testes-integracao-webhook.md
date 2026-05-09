# Task 024 — Testes de integração do webhook Asaas e regras críticas de assinatura

**Status:** concluída  
**Data:** 2026-05-07  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Criar testes de integração com mocks para proteger o fluxo financeiro do Reda1000 contra regressões em:
- webhook PAYMENT_CONFIRMED
- créditos Pro (não acumulativos)
- idempotência de webhook
- cancelamento dentro e após 7 dias
- expiração de assinatura pelo cron
- reset mensal de créditos (plano anual)

---

## Arquivos criados

### Processadores (lógica extraída para ser testável)

| Arquivo | Descrição |
|---|---|
| `lib/asaasWebhookProcessor.ts` | Lógica do webhook com deps injetáveis |
| `lib/subscriptionCancellationProcessor.ts` | Lógica de cancelamento com deps injetáveis |
| `lib/subscriptionCronProcessor.ts` | Lógica do cron com deps injetáveis |

### Helpers de teste

| Arquivo | Descrição |
|---|---|
| `tests/helpers/asaasPayloads.ts` | Payloads simulados do Asaas (PAYMENT_CONFIRMED mensal/anual, SUBSCRIPTION_CANCELLED) |
| `tests/helpers/subscriptionFactory.ts` | Factories de subscription rows (mensal e anual) com overrides |

### Testes de integração

| Arquivo | Testes |
|---|---|
| `tests/integration/webhook/paymentConfirmed.test.ts` | 14 testes |
| `tests/integration/subscriptions/cancellation.test.ts` | 11 testes |
| `tests/integration/subscriptions/cron.test.ts` | 7 testes |

### Routes/Actions atualizados

| Arquivo | Mudança |
|---|---|
| `app/api/asaas/webhook/route.ts` | Agora é thin adapter — delega para `processWebhookEvent` |
| `app/actions/billing.ts` | Delega para `processUserCancellation` via deps |

---

## Funções extraídas

### `lib/asaasWebhookProcessor.ts`

```typescript
processWebhookEvent(body, deps)         // dispatcher + idempotência
processPaymentConfirmed(payment, deps)  // ativa Pro, período, créditos
processSubscriptionCancelled(id, deps)  // cancela via webhook Asaas
```

Deps injetáveis: `now`, `insertWebhookLog`, `updateWebhookLog`, `findSubByAsaasId`, `updateSub`, `updateProfile`, `upsertPayment`, `setCreditBalance`.

### `lib/subscriptionCancellationProcessor.ts`

```typescript
processUserCancellation(sub, deps) → CancellationResult
// retorna { type: 'immediate' } ou { type: 'scheduled' }
```

Deps injetáveis: `now`, `cancelAsaasSubscription`, `updateSub`, `updateProfile`, `setCreditBalance`.

### `lib/subscriptionCronProcessor.ts`

```typescript
processExpirations(deps)   → number  // quantas subs expiradas
processCreditResets(deps)  → number  // quantas subs com créditos resetados
```

Deps injetáveis: `now`, `findExpiringSubscriptions`, `findSubsForCreditReset`, `expireSub`, `resetSubCredits`.

---

## Cenários cobertos

### PAYMENT_CONFIRMED — mensal (5 testes)
- status vira `active`
- `profiles.plan` vira `pro`
- créditos setados em 20
- `current_period_end = +1 mês`
- `next_credit_reset_at = null` (mensal renova via webhook, não cron)

### PAYMENT_CONFIRMED — anual (4 testes)
- `current_period_end = +1 ano`
- `next_credit_reset_at = +1 mês`
- créditos setados em 20
- plan vira pro

### Créditos não acumulam (2 testes)
- Saldo anterior 3 → `setCreditBalance(20)` chamado
- Saldo anterior 25 → `setCreditBalance(20)` chamado (não acumula acima)

### Idempotência (2 testes)
- Evento duplicado → retorna `{ duplicate: true }`, `setCreditBalance` não chamado
- Primeiro evento → processa normalmente, `setCreditBalance` chamado 1x

### Cancelamento dentro de 7 dias (6 testes)
- `type = 'immediate'`
- `updateProfile('free')`
- `setCreditBalance(3, 'cancel_within_7_days_return_to_free')`
- `refund_required = true`, `refund_reason = '7_day_guarantee'`
- `cancelAsaasSubscription` chamado
- `status = 'cancelled'`

### Cancelamento após 7 dias (5 testes)
- `type = 'scheduled'`
- `cancel_at_period_end = true`
- `updateProfile` NÃO chamado (plan permanece pro)
- `setCreditBalance` NÃO chamado
- `cancelAsaasSubscription` NÃO chamado (será feito pelo cron)

### Cron — expiração (4 testes)
- 1 sub com período vencido → `expireSub` chamado
- Sub correta passada para `expireSub`
- Lista vazia → `expireSub` não chamado
- Múltiplas subs → `expireSub` chamado para cada uma

### Cron — reset mensal anual (4 testes)
- `resetSubCredits` chamado para sub elegível
- `next_credit_reset_at` avança +1 mês (fev → mar)
- Sub correta passada para `resetSubCredits`
- Lista vazia → `resetSubCredits` não chamado

---

## Estratégia de mock

Todos os testes usam **deps injetáveis** via `vi.fn()`. Nenhuma chamada real é feita:

| Dependência mockada | O que evita |
|---|---|
| `supabaseAdmin` | Banco Supabase real |
| `cancelAsaasSubscription` | API Asaas real |
| `setCreditBalance` | RPC Supabase real |
| `now()` | Não-determinismo de datas |

---

## Como rodar

```bash
cd apps/web

# Todos os testes (unitários + integração)
npm test

# Apenas integração
npx vitest run tests/integration

# Apenas webhook
npx vitest run tests/integration/webhook
```

---

## Resultado

```
Test Files  5 passed (5)
     Tests  68 passed (68)
  Duration  ~2.6s
```

---

## Limitações

1. **Cron não testa SQL RPC real**: `process_subscription_expirations()` e `process_subscription_credit_resets()` são funções SQL — o cron route continua usando-as. Os testes em `cron.test.ts` testam o orquestrador JS (`subscriptionCronProcessor.ts`), não a SQL em si. Para testar a SQL, usar `supabase start` + Supabase local.

2. **Sem teste de `SUBSCRIPTION_CANCELLED` via webhook**: o cenário `processSubscriptionCancelled` existe no processador mas não tem arquivo de teste dedicado. Pode ser adicionado em `tests/integration/webhook/subscriptionCancelled.test.ts`.

3. **Sem teste do token de autenticação do webhook**: validação do header `asaas-access-token` fica no `route.ts` (thin adapter) e não é testada. Exigiria testes de API HTTP ou extração da validação.

4. **Sem teste de erro no Asaas ao cancelar**: o caminho onde `cancelAsaasSubscription` lança erro (ex: subscription não encontrada no Asaas) não é testado.

---

## Próximos testes recomendados

| Prioridade | Teste | Arquivo sugerido |
|---|---|---|
| Alta | `SUBSCRIPTION_CANCELLED` via webhook | `tests/integration/webhook/subscriptionCancelled.test.ts` |
| Alta | Erro no Asaas ao cancelar dentro de 7 dias | `tests/integration/subscriptions/cancellation.test.ts` |
| Média | SQL `process_subscription_expirations` via Supabase local | `tests/integration/db/cronSql.test.ts` |
| Média | SQL `set_credit_balance` — guard contra balance negativo | `tests/integration/db/creditBalance.test.ts` |
| Baixa | Token validation do webhook (`asaas-access-token`) | `tests/integration/webhook/auth.test.ts` |
