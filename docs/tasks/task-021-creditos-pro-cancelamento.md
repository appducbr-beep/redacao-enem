# Task 021 — Créditos Pro não acumulativos + cancelamento de assinatura

**Status:** concluída  
**Data:** 2026-04-30  
**Responsável:** Claude Code (operador técnico)

---

## Regra de créditos Pro (não acumulativos)

| Plano | Créditos por ciclo | Comportamento |
|---|---|---|
| Free | 3 (na criação da conta) | Nunca renovam |
| Pro Mensal | 20 por ciclo mensal | Reset a cada PAYMENT_CONFIRMED |
| Pro Anual | 20 por ciclo mensal | Reset a cada PAYMENT_CONFIRMED (mesmo pagando anual) |

**Não acumula:** se o usuário tinha 7 créditos e o ciclo renova, fica com 20 — nunca soma.  
**Implementado via:** `set_credit_balance(user_id, 20, reason)` que define o saldo exato.

---

## Função SQL: set_credit_balance

**Migration:** `supabase/migrations/20260430000014_set_credit_balance.sql`

```sql
public.set_credit_balance(
  target_user_id    uuid,
  available_credits integer,
  reason            text
)
```

**Comportamento:**
- Define `credits_available` para exatamente `available_credits`
- Fórmula: `credits_total := credits_used + available_credits`  ← preserva credits_used
- Registra `adjustment` em `credit_transactions` com `amount = diff` (pode ser negativo)
- Se diff = 0, não insere transação
- Lança exceção se `available_credits < 0` ou wallet não existe
- Usa `FOR UPDATE` para operação atômica

**Exemplo:**

| Situação | credits_used | credits_available (antes) | Após set_credit_balance(20) | amount em transaction |
|---|---|---|---|---|
| Usuário tinha 3 créditos | 0 | 3 | 20 | +17 |
| Usuário tinha 7 créditos | 0 | 7 | 20 | +13 |
| Usuário renovou com 0 | 0 | 0 | 20 | +20 |
| Usuário tinha 25 (raro) | 0 | 25 | 20 | -5 |

**Idempotência:** chamar duas vezes com `available_credits=20` resulta em 20 nas duas — não acumula.

---

## Fluxo do webhook PAYMENT_CONFIRMED

```
Asaas envia POST /api/asaas/webhook  (header asaas-access-token)
  1. Valida token
  2. Insere webhook_logs (idempotência por asaas_event_id UNIQUE)
     → Se 23505 (duplicate): retorna 200 sem processar
  3. handlePaymentConfirmed(payment)
     a. Localiza subscription por asaas_subscription_id
     b. Upsert em asaas_payments (audit; dedup por asaas_payment_id UNIQUE)
     c. subscriptions.status = 'active'
     d. profiles.plan = 'pro'
     e. set_credit_balance(user_id, 20, reason)
        reason = 'asaas_payment_confirmed_monthly_reset' (mensal)
        reason = 'asaas_payment_confirmed_annual_monthly_allowance' (anual)
  4. webhook_logs.processed = true (ou error_message em caso de falha)
  5. Retorna 200 sempre (Asaas não retenta)
```

**Dupla camada de idempotência:**
- `webhook_logs.asaas_event_id UNIQUE` → bloqueia reprocessamento do mesmo evento
- `set_credit_balance` → mesmo que processado duas vezes, saldo fica 20

---

## Fluxo de cancelamento (iniciado pelo usuário)

```
Usuário em /perfil ou /planos clica "Cancelar plano Pro"
  → CancelSubscriptionButton (Client Component) mostra confirmação
  → Usuário confirma → form action → cancelCurrentSubscription() (Server Action)
    1. Valida auth
    2. Busca subscription ativa do usuário
    3. DELETE /subscriptions/{asaas_subscription_id} no Asaas
    4. subscriptions.status = 'cancelled', cancelled_at = now()
    5. profiles.plan = 'free'
    6. redirect('/perfil?cancelled=1')
  → /perfil mostra banner verde "Plano Pro cancelado"
```

**Webhook de cancelamento (Asaas inicia):**
- Mesmo fluxo em `handleSubscriptionCancelled`
- Preenche `cancelled_at`, atualiza status e plan

---

## Arquivos criados/alterados

| Arquivo | Tipo | Mudança |
|---|---|---|
| `supabase/migrations/20260430000014_set_credit_balance.sql` | criado | função SQL set_credit_balance |
| `lib/asaas.ts` | alterado | add `cancelSubscription` (DELETE /subscriptions/{id}) |
| `app/api/asaas/webhook/route.ts` | alterado | replace grant_credits com set_credit_balance RPC; remove CREDITS_BY_BILLING_CYCLE |
| `app/actions/billing.ts` | criado | Server Action `cancelCurrentSubscription` |
| `app/perfil/CancelSubscriptionButton.tsx` | criado | Client Component com confirmação |
| `app/perfil/page.tsx` | alterado | searchParams cancelled=1, banner, cancel button para Pro |
| `app/planos/page.tsx` | alterado | cancel button para usuários Pro |

---

## Queries de teste

### Verificar créditos após PAYMENT_CONFIRMED

```sql
SELECT cw.credits_total, cw.credits_used, cw.credits_available
FROM credit_wallets cw
WHERE cw.user_id = 'USER_ID';
-- Esperado: credits_available = 20
```

### Auditoria de créditos

```sql
SELECT id, amount, transaction_type, reason, created_at
FROM credit_transactions
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
-- Deve aparecer: adjustment | asaas_payment_confirmed_monthly_reset | amount = diff
```

### Verificar status da assinatura após cancelamento

```sql
SELECT status, cancelled_at, billing_cycle
FROM subscriptions
WHERE user_id = 'USER_ID';
-- Esperado: status = 'cancelled', cancelled_at preenchido
```

### Verificar plano após cancelamento

```sql
SELECT plan FROM profiles WHERE id = 'USER_ID';
-- Esperado: plan = 'free'
```

---

## Como testar ativação Pro

1. Configure Asaas sandbox + ngrok para webhook
2. Assine em `/planos` (mensal ou anual)
3. Pague com cartão de teste do Asaas sandbox
4. Verifique logs: `[webhook/asaas] Activated sub ... credits=>20`
5. Execute query de créditos — esperado `credits_available = 20`
6. Execute query de auditoria — deve aparecer `adjustment` com reason correto
7. Simule segundo pagamento → créditos voltam a 20 (não acumulam)

## Como testar cancelamento

1. Com usuário Pro ativo, acesse `/perfil`
2. Clique "Cancelar plano Pro"
3. Confirme → deve redirecionar para `/perfil?cancelled=1` com banner verde
4. Execute query de assinatura — esperado `status = 'cancelled'`
5. Execute query de plano — esperado `plan = 'free'`
6. Dashboard deve mostrar plano Gratuito sem card "Planos Pro"
