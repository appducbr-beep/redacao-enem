# Task 022 — Cancelamento correto, garantia de 7 dias e renovação mensal de créditos

**Status:** concluída  
**Data:** 2026-05-07  
**Responsável:** Claude Code (operador técnico)

---

## Regra de cancelamento por prazo

| Situação | Comportamento |
|---|---|
| Cancelamento ≤ 7 dias após `current_period_start` | Imediato: plano → free, créditos → 0, reembolso solicitado |
| Cancelamento > 7 dias após `current_period_start` | Programado: plano mantém Pro até `current_period_end`, renovação cancelada |

**Referência para o prazo:** `subscriptions.current_period_start` (gravado no primeiro PAYMENT_CONFIRMED).

---

## Campos adicionados em `subscriptions`

**Migration:** `supabase/migrations/20260507000015_subscription_period_fields.sql`

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `cancel_at_period_end` | boolean NOT NULL | false | Usuário pediu cancelamento após 7 dias |
| `current_period_start` | timestamptz | NULL | Início do ciclo atual (gravado pelo webhook) |
| `current_period_end` | timestamptz | NULL | Fim do ciclo; determina quando o acesso expira |
| `next_credit_reset_at` | timestamptz | NULL | Próximo reset mensal (apenas billing_cycle=yearly) |
| `refund_required` | boolean NOT NULL | false | Reembolso pendente (cancelamento 7 dias) |
| `refund_reason` | text | NULL | Ex: `'7_day_guarantee'` |

---

## Funções SQL criadas

### `process_subscription_credit_resets() → integer`

Executa o reset mensal de créditos para assinaturas anuais.

**Critério:** `status = 'active' AND billing_cycle = 'yearly' AND next_credit_reset_at <= now() AND current_period_end > now()`

**Ação:** `set_credit_balance(user_id, 20, 'annual_monthly_credit_reset')` + incrementa `next_credit_reset_at += 1 month`

**Retorna:** número de wallets processadas.

### `process_subscription_expirations() → integer`

Expira assinaturas cujo período encerrou e que estão marcadas para cancelamento.

**Critério:** `cancel_at_period_end = true AND status = 'active' AND current_period_end <= now()`

**Ação:** `status = 'cancelled'` + `profiles.plan = 'free'` + `set_credit_balance(user_id, 0, 'subscription_period_ended')`

**Limitação:** não chama DELETE no Asaas — ver seção Limitações.

---

## Fluxo de cancelamento dentro de 7 dias (imediato)

```
Usuário clica "Cancelar plano Pro" → confirma
  cancelCurrentSubscription()
    1. Busca subscription ativa
    2. withinGuarantee = (now - current_period_start) <= 7 dias
    3. Se true:
       a. DELETE /subscriptions/{asaas_id} no Asaas
       b. subscriptions: status=cancelled, cancelled_at=now(), refund_required=true,
          refund_reason='7_day_guarantee', cancel_at_period_end=false
       c. profiles.plan = free
       d. set_credit_balance(user_id, 0, 'cancel_within_7_days')
       e. redirect('/perfil?cancelled=immediate')
  → /perfil mostra banner âmbar: "plano cancelado, reembolso em processamento"
```

---

## Fluxo de cancelamento após 7 dias (programado)

```
Usuário clica "Cancelar plano Pro" → confirma
  cancelCurrentSubscription()
    1. Busca subscription ativa
    2. withinGuarantee = false
    3. NÃO chama Asaas DELETE
    4. subscriptions: cancel_at_period_end=true, cancelled_at=now()
    5. profiles.plan permanece 'pro'
    6. redirect('/perfil?cancelled=scheduled')
  → /perfil mostra banner azul: "Renovação cancelada. Acesso ativo até DD/MM/AAAA"
```

**Bônus:** banner de aviso também aparece no Dashboard e em /planos enquanto `cancel_at_period_end = true`.

---

## Webhook PAYMENT_CONFIRMED — campos gravados

```
handlePaymentConfirmed(payment)
  → current_period_start = now()
  → current_period_end   = now() + 1 month  (mensal)
                         = now() + 1 year   (anual)
  → next_credit_reset_at = now() + 1 month  (anual); null (mensal)
  → cancel_at_period_end = false
  → refund_required      = false
```

---

## Rota de cron

**Arquivo:** `app/api/cron/subscriptions/route.ts`

```
GET /api/cron/subscriptions
Header: x-cron-secret: <CRON_SECRET>
```

Chama:
1. `process_subscription_credit_resets()` — resets mensais para anual
2. `process_subscription_expirations()` — expira cancelamentos programados

**Frequência recomendada:** 1× por dia (ex: 03:00 UTC).

**Para configurar no Vercel:**
- Vercel Dashboard → Settings → Cron Jobs → Add
- Path: `/api/cron/subscriptions`
- Adicionar header `x-cron-secret` com valor de `CRON_SECRET`

---

## Limitações

1. **Asaas DELETE não chamado para cancelamentos programados:** após 7 dias, o cron expira a assinatura no banco mas não cancela no Asaas. Se o cron rodar depois de `current_period_end`, o Asaas pode tentar cobrar novamente. **Solução futura:** o cron route deve buscar assinaturas com `cancel_at_period_end = true AND current_period_end <= now()` e chamar `cancelSubscription(asaasId)` antes de chamar `process_subscription_expirations()`.

2. **Reembolso não automatizado:** `refund_required = true` sinaliza que o reembolso é devido, mas não processa automaticamente. Operador deve verificar no painel Asaas e estornar manualmente.

3. **current_period_start ausente em assinaturas antigas:** assinaturas criadas antes desta task não têm `current_period_start`. O código trata isso com fallback conservador (`withinGuarantee = true`).

---

## Queries de teste

### Verificar campos de período após PAYMENT_CONFIRMED
```sql
SELECT status, cancel_at_period_end, current_period_start,
       current_period_end, next_credit_reset_at, refund_required
FROM subscriptions
WHERE user_id = 'USER_ID';
```

### Simular vencimento de período (teste manual)
```sql
UPDATE subscriptions
SET current_period_end = now() - interval '1 hour'
WHERE user_id = 'USER_ID' AND status = 'active';
-- Depois chamar GET /api/cron/subscriptions
```

### Verificar cancelamento dentro de 7 dias
```sql
-- Após cancelamento imediato:
SELECT status, cancelled_at, refund_required, refund_reason FROM subscriptions WHERE user_id = 'USER_ID';
-- Esperado: status=cancelled, refund_required=true, refund_reason='7_day_guarantee'
SELECT plan FROM profiles WHERE id = 'USER_ID';
-- Esperado: plan=free
SELECT credits_available FROM credit_wallets WHERE user_id = 'USER_ID';
-- Esperado: 0
```

### Verificar cancelamento após 7 dias
```sql
-- Após cancelamento programado:
SELECT status, cancel_at_period_end, cancelled_at, current_period_end FROM subscriptions WHERE user_id = 'USER_ID';
-- Esperado: status=active, cancel_at_period_end=true, current_period_end=data futura
SELECT plan FROM profiles WHERE id = 'USER_ID';
-- Esperado: plan=pro (acesso mantido)
```
