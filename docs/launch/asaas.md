# Asaas — Guia de Integração

## Ambientes

### Sandbox (dev/preview)

```
ASAAS_ENV=sandbox
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=<chave sandbox, começa com $aact_>
```

Dashboard: `https://sandbox.asaas.com`

Webhook URL:
```
https://redacao-enem-green.vercel.app/api/asaas/webhook
```

Cobranças reais: **Não**

### Produção (go-live)

```
ASAAS_ENV=production
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_API_KEY=<chave de produção, gerada no painel prod>
ASAAS_WEBHOOK_TOKEN=<novo token, openssl rand -hex 32>
```

Dashboard: `https://www.asaas.com`

Webhook URL:
```
https://reda1000.app.br/api/asaas/webhook
```

Cobranças reais: **Sim** — configurar apenas após:
1. Domínio `reda1000.app.br` ativo e com SSL (ver `docs/launch/domain-setup.md`)
2. Testes completos no sandbox
3. `ASAAS_ENV=production` configurado **somente** no ambiente Production da Vercel

---

## Webhook

### Configurar no Asaas

1. Asaas Dashboard → **Configurações → Integrações → Webhooks**
2. Clicar em **Adicionar webhook**
3. Preencher URL (ver acima conforme ambiente)
4. Selecionar eventos (ver tabela abaixo)
5. Informar token de autenticação: valor de `ASAAS_WEBHOOK_TOKEN`
6. Salvar

### Eventos

| Evento | Ação no sistema |
|---|---|
| `PAYMENT_CONFIRMED` | Ativa Pro, define período, seta créditos = 20 |
| `PAYMENT_RECEIVED` | Mesmo que `PAYMENT_CONFIRMED` (Asaas pode usar os dois) |
| `SUBSCRIPTION_CREATED` | Sem ação atual (subscription já criada no subscribe action) |
| `SUBSCRIPTION_UPDATED` | Sem ação atual |
| `SUBSCRIPTION_CANCELLED` | Cancela subscription no banco, `plan → free` |
| `SUBSCRIPTION_DELETED` | Mesmo que `SUBSCRIPTION_CANCELLED` |

### Header de autenticação

O Asaas envia o token em cada evento:

```
asaas-access-token: <ASAAS_WEBHOOK_TOKEN>
```

O webhook valida esse header antes de processar. Token inválido → `401 Unauthorized`.

### Idempotência

O sistema usa `webhook_logs.asaas_event_id UNIQUE` para evitar reprocessamento. Se o mesmo evento for reenviado, o webhook retorna `{ ok: true, duplicate: true }` sem processar novamente.

---

## Como reenviar webhook

1. Asaas Dashboard → Configurações → Webhooks → **Histórico**
2. Localizar o evento na lista
3. Clicar em **Reenviar**

Útil para depurar. O sistema detecta duplicatas automaticamente — reenvios não duplicam créditos.

---

## Como testar pagamento (sandbox)

### Cartões de teste

| Bandeira | Número | CVV | Validade |
|---|---|---|---|
| Visa | 4111111111111111 | 123 | 12/2030 |
| Mastercard | 5500000000000004 | 123 | 12/2030 |

### Fluxo completo

1. Iniciar assinatura em `/planos` com usuário free
2. Preencher CPF na modal (CPF válido — use um gerador de CPF de teste)
3. No checkout Asaas, usar cartão de teste acima
4. Com ngrok ativo, aguardar webhook `PAYMENT_CONFIRMED`
5. Verificar no banco:

```sql
SELECT status, current_period_start, current_period_end, next_credit_reset_at
FROM subscriptions WHERE user_id = 'USER_ID';

SELECT credits_available FROM credit_wallets WHERE user_id = 'USER_ID';
-- Esperado: 20

SELECT plan FROM profiles WHERE id = 'USER_ID';
-- Esperado: pro
```

---

## Como cancelar assinatura (painel Asaas)

1. Asaas Dashboard → **Assinaturas**
2. Localizar a assinatura pelo nome do cliente ou ID
3. Clicar em **Ações → Cancelar**

O cancelamento via painel dispara `SUBSCRIPTION_CANCELLED`, que o sistema processa para atualizar `plan → free` no banco.

---

## Queries de verificação pós-webhook

```sql
-- Estado da assinatura
SELECT status, current_period_start, current_period_end,
       cancel_at_period_end, refund_required
FROM subscriptions
WHERE user_id = 'USER_ID';

-- Créditos
SELECT credits_available, credits_total, credits_used
FROM credit_wallets WHERE user_id = 'USER_ID';

-- Log do webhook (últimos 5 eventos)
SELECT event, asaas_event_id, processed, error_message, created_at
FROM webhook_logs
ORDER BY created_at DESC LIMIT 5;
```

---

## Pendência: Asaas DELETE para cancelamento programado

Cancelamentos após 7 dias (`cancel_at_period_end = true`) **não** chamam `DELETE /subscriptions/{id}` no Asaas imediatamente. O cron expira a subscription no banco quando `current_period_end <= now()`, mas não cancela no Asaas.

**Risco:** Asaas pode tentar cobrar novamente após `current_period_end`.

**Ação:** Monitorar manualmente no painel Asaas até que a chamada DELETE seja implementada no cron.
