# Cron — Guia de Manutenção

## Rota

```
GET /api/cron/subscriptions
```

### Autenticação

O endpoint aceita dois métodos, em ordem de prioridade:

**1. Vercel Cron** (automático quando configurado em `vercel.json`):
```
Authorization: Bearer <CRON_SECRET>
```

**2. Testes manuais / GitHub Actions / CI:**
```
x-cron-secret: <CRON_SECRET>
```

| Situação | Resposta |
|---|---|
| Token correto (qualquer método) | `200 { ok: true, ... }` |
| Token ausente ou inválido | `401 { error: "Unauthorized" }` |
| `CRON_SECRET` não configurado no servidor | `500 { error: "CRON_SECRET not configured" }` |

> Nunca logar ou expor o valor do `CRON_SECRET`. O endpoint loga apenas `unauthorized request` (sem o token).

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

**Resultado:** usuário anual recebe 20 créditos por mês sem precisar renovar.

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

> ⚠️ **Limitação:** o cron não chama `DELETE /subscriptions/{id}` no Asaas.
> Monitorar manualmente no painel Asaas até que isso seja implementado.

---

## Frequência

**Diário às 09:00 UTC** (06:00 BRT) — definido em `vercel.json`.

Schedule: `0 9 * * *`

---

## Opção A — vercel.json (configurado)

O arquivo `apps/web/vercel.json` já está criado:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscriptions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

> ✅ O endpoint aceita `Authorization: Bearer <CRON_SECRET>` (Vercel) e `x-cron-secret` (manual).
> O Vercel Cron funciona corretamente com `vercel.json`.

---

## Opção B — execução manual / GitHub Actions (funcional agora)

### Chamada manual

```bash
# Local
curl -X GET http://localhost:3000/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"

# Preview (sandbox)
curl -X GET https://redacao-enem-green.vercel.app/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"

# Produção
curl -X GET https://reda1000.app.br/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"
```

### GitHub Actions (diário)

Criar `.github/workflows/cron.yml`:

```yaml
name: Daily subscription cron
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Run subscription cron
        run: |
          curl -X GET ${{ secrets.APP_URL }}/api/cron/subscriptions \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

Adicionar secrets no GitHub: `APP_URL` e `CRON_SECRET`.

---

## Simular expiração para teste

```sql
-- 1. Colocar period_end no passado
UPDATE subscriptions
SET current_period_end = now() - interval '1 hour'
WHERE user_id = 'USER_ID' AND status = 'active';

-- 2. Chamar o cron manualmente
-- Response esperada: { "ok": true, "expirations": 1 }

-- 3. Verificar resultado
SELECT status FROM subscriptions WHERE user_id = 'USER_ID';
-- Esperado: cancelled

SELECT plan FROM profiles WHERE id = 'USER_ID';
-- Esperado: free
```

---

## Produção

URL de produção do cron:
```
https://reda1000.app.br/api/cron/subscriptions
```

O Vercel Cron já usa a URL do projeto automaticamente via `vercel.json` — nenhuma alteração necessária no arquivo quando o domínio próprio for ativado. O agendamento continua funcionando.

Para chamada manual em produção:
```bash
curl -X GET https://reda1000.app.br/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"
```

---

## Logs esperados

```json
[reda1000] {"level":"info","message":"cron subscriptions started","timestamp":"..."}
[reda1000] {"level":"info","message":"cron subscriptions finished","context":{"credit_resets":0,"expirations":1,"ms":234},"timestamp":"..."}
```

Acessar em: Vercel Dashboard → Project → Logs (filtrar por `/api/cron/subscriptions`).
