# Spec 09 — Pagamentos via Asaas

**Status:** revisado  
**Versão:** 0.2  
**Última atualização:** 2026-04-25  
**Histórico:**
- v0.1 — rascunho inicial
- v0.2 — alinhado com decisões do arquiteto (task-003): tabelas `subscriptions`, `payments`, `webhook_logs`; regra de acesso pro vs. free

---

## Objetivo

Definir como o sistema gerencia planos, créditos e cobranças usando o Asaas.

## Tecnologia

- **Plataforma:** Asaas (gateway de pagamento brasileiro)
- **Integração:** REST API do Asaas + Webhooks
- **Ambiente inicial:** Sandbox para desenvolvimento
- **Tabelas envolvidas:** `profiles`, `payments`, `subscriptions`, `webhook_logs`

---

## Planos previstos

| Plano     | Preço        | Acesso                  | Cobrança          |
|-----------|--------------|-------------------------|-------------------|
| Gratuito  | R$ 0         | 3 créditos iniciais     | Sem recorrência   |
| Pro       | R$ 19,90/mês | Assinatura ativa        | Recorrente (Asaas)|
| Escola    | A definir    | Assinatura ativa        | Recorrente (Asaas)|

**Regra de acesso (spec 02):**
- Plano `free`: acesso por `profiles.credits > 0`; 1 envio = 1 crédito
- Plano `pro` / `school`: acesso por `subscriptions.status = 'active'`; créditos ignorados

---

## Pacotes de crédito avulsos (plano free)

| Pacote   | Preço    | Créditos |
|----------|----------|----------|
| Starter  | R$ 9,90  | 5        |
| Básico   | R$ 19,90 | 15       |
| Completo | R$ 34,90 | 30       |

---

## Fluxo de compra de créditos avulsos

1. Usuário acessa `/planos`
2. Seleciona pacote
3. Sistema cria cobrança via API do Asaas (associando `profiles.asaas_customer_id`)
4. Se `asaas_customer_id` for null, Asaas cria o cliente e o ID é salvo em `profiles`
5. Usuário paga via PIX ou cartão no checkout do Asaas
6. Asaas dispara webhook `PAYMENT_CONFIRMED` para `/api/webhooks/asaas`
7. API registra o evento em `webhook_logs` com `processed = false`
8. API verifica idempotência: `SELECT id FROM webhook_logs WHERE asaas_event_id = $id AND processed = true`
9. Se não processado: adiciona créditos em `profiles.credits`, salva em `payments`, marca `processed = true`

---

## Fluxo de assinatura Pro

1. Usuário acessa `/planos` e seleciona o plano Pro
2. Sistema cria assinatura recorrente via API Asaas
3. Asaas cria o cliente se necessário (salvar `asaas_customer_id`)
4. Asaas retorna `asaas_subscription_id`
5. Sistema insere registro em `subscriptions` com `status = 'active'`
6. Sistema atualiza `profiles.plan = 'pro'`
7. A partir desse momento, o usuário tem acesso irrestrito enquanto `subscriptions.status = 'active'`

---

## Webhooks recebidos

Todos os webhooks são registrados em `webhook_logs` **antes** de qualquer processamento. O campo `asaas_event_id` garante idempotência.

| Evento                   | Ação no sistema                                                                              |
|--------------------------|----------------------------------------------------------------------------------------------|
| `PAYMENT_CONFIRMED`      | Tipo `credit_purchase`: adiciona créditos em `profiles`. Tipo `subscription`: confirma 1ª parcela |
| `PAYMENT_OVERDUE`        | Notifica usuário; atualiza `subscriptions.status = 'past_due'` se aplicável                 |
| `SUBSCRIPTION_RENEWED`   | Atualiza `subscriptions.next_billing_date`; mantém `status = 'active'`                       |
| `SUBSCRIPTION_CANCELLED` | Atualiza `subscriptions.status = 'cancelled'` e `cancelled_at`; atualiza `profiles.plan = 'free'` |

**Padrão de processamento de webhook:**

```
POST /api/webhooks/asaas
  1. Validar header asaas-access-token
  2. INSERT INTO webhook_logs (event, asaas_event_id, payload)
  3. Verificar idempotência: WHERE asaas_event_id = ? AND processed = true
  4. Processar evento conforme tabela acima
  5. UPDATE webhook_logs SET processed = true, processed_at = now()
     (ou error_message se falhou)
```

---

## Segurança dos webhooks

- Validar `asaas-access-token` header em todas as requisições recebidas
- Endpoint `/api/webhooks/asaas` não exige autenticação de usuário (chamado pelo Asaas)
- Idempotência garantida via `webhook_logs.asaas_event_id UNIQUE` + flag `processed`
- `payments.asaas_payment_id UNIQUE` como segunda camada para evitar créditos duplicados

---

## Sincronização de `profiles.plan`

`profiles.plan` é um campo **desnormalizado** mantido em sincronia pelos webhooks para leitura rápida. A **fonte canônica** do status de um plano pago é sempre `subscriptions.status`.

| Evento                   | `profiles.plan` | `subscriptions.status` |
|--------------------------|-----------------|------------------------|
| Assinatura criada        | `pro`           | `active`               |
| Renovação confirmada     | `pro`           | `active`               |
| Pagamento em atraso      | `pro`           | `past_due`             |
| Assinatura cancelada     | `free`          | `cancelled`            |

> Regra: ao verificar acesso de um usuário `pro`, sempre consultar `subscriptions.status = 'active'`. Não confiar apenas em `profiles.plan`.

---

## Escopo desta spec

Integração de pagamentos, webhooks e regras de acesso por plano.

## Fora de escopo

- Reembolsos automáticos — processo manual inicial
- NF-e / nota fiscal — versão futura
- Plano Escola (detalhamento de turmas) — versão futura
