# Cron — Guia de Manutenção

## Rota

```
GET /api/cron/subscriptions
```

### Autenticação

Header obrigatório:
```
x-cron-secret: <valor de CRON_SECRET>
```

Sem o header correto: `401 Unauthorized`.

### Resposta de sucesso

```json
{
  "ok": true,
  "credit_resets": 1,
  "expirations": 0
}
```

---

## O que processa

### 1. Reset mensal de créditos (plano anual)

**Função SQL:** `process_subscription_credit_resets()`

**Critério:**
- `status = 'active'`
- `billing_cycle = 'yearly'`
- `next_credit_reset_at <= now()`
- `current_period_end > now()`

**Ação:**
- `set_credit_balance(user_id, 20, 'annual_monthly_credit_reset')`
- `next_credit_reset_at += 1 mês`

**Resultado:** usuário anual recebe 20 créditos todo mês sem precisar renovar.

---

### 2. Expiração de cancelamentos programados

**Função SQL:** `process_subscription_expirations()`

**Critério:**
- `cancel_at_period_end = true`
- `status = 'active'`
- `current_period_end <= now()`

**Ação:**
- `subscriptions.status = 'cancelled'`
- `profiles.plan = 'free'`
- `set_credit_balance(user_id, 0, 'subscription_period_ended')`

**Resultado:** usuário que cancelou após 7 dias perde acesso Pro quando o período termina.

> ⚠️ **Limitação atual:** o cron não chama `DELETE /subscriptions/{id}` no Asaas.
> O Asaas pode tentar cobrar novamente após `current_period_end`.
> Monitorar manualmente até que a chamada DELETE seja implementada.

---

## Frequência recomendada

**Diário às 03:00 UTC** — a maioria das assinaturas expira à meia-noite do fuso do cliente.

Schedule cron: `0 3 * * *`

---

## Como configurar no Vercel

> Ainda não configurado. Fazer antes do lançamento.

1. Vercel Dashboard → Project → Settings → Cron Jobs
2. Clicar em "Add Cron Job"
3. Preencher:
   - **Path:** `/api/cron/subscriptions`
   - **Schedule:** `0 3 * * *`
4. Não é possível adicionar headers diretamente no Vercel Cron (limitação).
   Alternativa: usar serviço externo (cron-job.org, EasyCron, GitHub Actions) para chamar com header.

### Alternativa com GitHub Actions

```yaml
# .github/workflows/cron.yml
name: Daily subscription cron
on:
  schedule:
    - cron: '0 3 * * *'
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Run subscription cron
        run: |
          curl -X GET ${{ secrets.APP_URL }}/api/cron/subscriptions \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

---

## Como testar manualmente

```bash
# Local
curl -X GET http://localhost:3000/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"

# Produção
curl -X GET https://reda1000.com.br/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"
```

---

## Simular expiração para teste

```sql
-- Colocar current_period_end no passado para acionar expiração
UPDATE subscriptions
SET current_period_end = now() - interval '1 hour'
WHERE user_id = 'USER_ID' AND status = 'active';

-- Chamar o cron → expirations deve ser 1
```

---

## Logs esperados

```
[cron/subscriptions] { credit_resets: 1, expirations: 0 }
```

Acessar em: Vercel Dashboard → Deployments → Functions → Logs.
