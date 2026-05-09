# Asaas — Guia de Integração

## Sandbox vs Produção

| | Sandbox | Produção |
|---|---|---|
| URL | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| `ASAAS_ENV` | `sandbox` | `production` |
| Chave API | começa com `$aact_` | chave separada do painel prod |
| Cobranças reais | Não | Sim |
| Dados | isolados | isolados |

> Nunca usar chave de produção em dev/preview.

---

## Webhook

### URL de configuração

| Ambiente | URL |
|---|---|
| Local (ngrok) | `https://<id>.ngrok.io/api/asaas/webhook` |
| Preview (Vercel) | `https://<preview-url>/api/asaas/webhook` |
| Produção | `https://reda1000.com.br/api/asaas/webhook` |

### Configurar no Asaas

1. Asaas Dashboard → Configurações → Integrações → Webhooks
2. Adicionar URL
3. Selecionar eventos (ver abaixo)
4. Informar token de autenticação (valor de `ASAAS_WEBHOOK_TOKEN`)

### Eventos utilizados

| Evento | Ação no sistema |
|---|---|
| `PAYMENT_CONFIRMED` | Ativa Pro, define período, seta créditos = 20 |
| `PAYMENT_RECEIVED` | Mesmo que `PAYMENT_CONFIRMED` (Asaas usa os dois) |
| `SUBSCRIPTION_CANCELLED` | Cancela subscription no banco, `plan → free` |
| `SUBSCRIPTION_DELETED` | Mesmo que `SUBSCRIPTION_CANCELLED` |

### Header de autenticação

O Asaas envia o token no header:
```
asaas-access-token: <ASAAS_WEBHOOK_TOKEN>
```

O webhook valida antes de processar qualquer evento.

### Idempotência

O sistema usa `webhook_logs.asaas_event_id UNIQUE` para evitar reprocessamento. Se o mesmo evento for reenviado, o webhook retorna `{ ok: true, duplicate: true }` sem processar novamente.

---

## Como reenviar webhook

1. Asaas Dashboard → Configurações → Webhooks → Histórico
2. Localizar o evento
3. Clicar em "Reenviar"

Útil para depurar problemas de processamento. O sistema detecta duplicatas automaticamente.

---

## Como testar pagamento

### Cartões de teste (sandbox)

| Bandeira | Número | CVV | Validade |
|---|---|---|---|
| Visa | 4111111111111111 | 123 | 12/2030 |
| Mastercard | 5500000000000004 | 123 | 12/2030 |

### Fluxo

1. Iniciar assinatura via `/planos`
2. Preencher CPF (qualquer CPF válido no sandbox)
3. No checkout do Asaas, usar cartão de teste
4. Aguardar webhook `PAYMENT_CONFIRMED` (com ngrok ativo)
5. Verificar banco: `subscriptions`, `credit_wallets`, `profiles`

---

## Como cancelar assinatura (painel Asaas)

1. Asaas Dashboard → Assinaturas
2. Localizar a assinatura
3. Ações → Cancelar

Nota: o cancelamento via painel Asaas dispara webhook `SUBSCRIPTION_CANCELLED`, que o sistema processa para atualizar o banco.

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

-- Log do webhook
SELECT event, asaas_event_id, processed, error_message, created_at
FROM webhook_logs
ORDER BY created_at DESC LIMIT 5;
```

---

## Pendência: Asaas DELETE para cancelamento programado

Atualmente, o cancelamento após 7 dias (`cancel_at_period_end = true`) **não** chama `DELETE /subscriptions/{id}` no Asaas imediatamente. O cron expira a subscription no banco quando `current_period_end <= now()`, mas não cancela no Asaas.

**Risco:** o Asaas pode tentar cobrar novamente após o período.

**Ação necessária antes do lançamento:** Monitorar manualmente no painel Asaas ou implementar a chamada DELETE no cron antes de expirar a assinatura.
