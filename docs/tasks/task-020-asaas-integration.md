# Task 020 — Integração com Asaas (Assinatura Pro)

**Status:** concluída  
**Data:** 2026-04-30 (atualizado — CPF obrigatório)  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Permitir que o usuário assine o plano Pro via Asaas (mensal ou anual), com confirmação automática via webhook.

---

## Fluxo completo

```
1. Usuário clica "Começar plano Pro" em /planos
2. PricingSection abre CpfModal solicitando CPF
3. Usuário informa CPF (validado: 11 dígitos após remover pontuação)
4. PricingSection chama Server Action: createProSubscription(plan, cpfCnpj)
5. Action:
   a. Valida auth
   b. Verifica assinatura ativa existente
   c. Busca ou cria customer no Asaas (com cpfCnpj)
      — se customer já existir sem cpfCnpj: atualiza via POST /customers/{id}
   d. Cria subscription no Asaas
   e. Busca primeiro pagamento pendente → invoiceUrl
   f. Salva na tabela subscriptions (status: pending)
   g. Retorna { checkoutUrl: invoiceUrl }
6. Frontend redireciona para checkoutUrl (página Asaas)
7. Usuário paga no Asaas
8. Asaas envia POST para /api/asaas/webhook?token=TOKEN
9. Webhook:
   a. Valida token
   b. Insere em webhook_logs (idempotência por asaas_event_id UNIQUE)
   c. Localiza subscription pelo asaas_subscription_id
   d. Insere em asaas_payments (upsert por asaas_payment_id UNIQUE)
   e. Atualiza subscription.status = 'active'
   f. Atualiza profiles.plan = 'pro'
   g. Adiciona créditos ao credit_wallets (30 mensal / 360 anual)
```

### CPF — armazenamento

O CPF é coletado no frontend, enviado ao backend via Server Action e repassado ao Asaas.
**Não é armazenado no banco de dados do Reda1000.** Persiste apenas no Asaas (customer.cpfCnpj).

---

## Endpoints Asaas usados

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/customers?email=...` | Buscar customer existente |
| POST | `/customers` | Criar novo customer (com cpfCnpj) |
| POST | `/customers/{id}` | Atualizar cpfCnpj de customer existente |
| POST | `/subscriptions` | Criar assinatura |
| GET | `/subscriptions/{id}/payments?status=PENDING` | Obter link do primeiro pagamento |

Auth header: `access_token: $ASAAS_API_KEY`

---

## Tabela criada: `subscriptions`

```sql
id                    uuid PK
user_id               uuid → auth.users
asaas_customer_id     text
asaas_subscription_id text UNIQUE
plan                  text ('pro-monthly' | 'pro-annual')
status                text ('pending' | 'active' | 'cancelled')
environment           text ('sandbox' | 'production')
created_at            timestamptz
updated_at            timestamptz  -- trigger automático
```

Migration: `supabase/migrations/20260429000013_create_subscriptions.sql`

RLS: usuários podem SELECT nas próprias assinaturas; INSERT/UPDATE via service_role.

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `ASAAS_ENV` | `sandbox` ou `production` |
| `ASAAS_API_KEY` | Chave da API Asaas (começa com `$aact_`) |
| `ASAAS_BASE_URL` | URL base (sandbox: `https://sandbox.asaas.com/api/v3`) |
| `ASAAS_WEBHOOK_TOKEN` | Token secreto para validar webhook |

---

## Eventos webhook tratados

| Evento | Ação |
|---|---|
| `PAYMENT_CONFIRMED` | Ativa subscription + profile.plan = 'pro' + grant credits |
| `PAYMENT_RECEIVED` | Idem (para boleto/PIX) |
| `SUBSCRIPTION_CANCELLED` | Status = 'cancelled' + profile.plan = 'free' |
| `SUBSCRIPTION_DELETED` | Idem |
| Outros | Ignorados (logged) |

---

## Créditos concedidos por pagamento confirmado

| Plano | Créditos |
|---|---|
| `pro-monthly` | 30 por pagamento mensal |
| `pro-annual` | 360 no primeiro pagamento anual |

---

## Arquivos criados/alterados

| Arquivo | Mudança |
|---|---|
| `lib/asaas.ts` | criado — cliente HTTP Asaas |
| `app/actions/subscribe.ts` | criado — Server Action de criação de assinatura |
| `app/api/asaas/webhook/route.ts` | criado — handler do webhook |
| `components/plans/PricingSection.tsx` | atualizado — CTA chama Server Action |
| `components/plans/PlanCard.tsx` | atualizado — prop `disabled` adicionada |
| `supabase/migrations/20260429000013_create_subscriptions.sql` | criado |
| `.env.example` | atualizado — 4 novas variáveis Asaas |

---

## Como testar (sandbox)

### Setup
1. Criar conta em sandbox.asaas.com
2. Obter chave API sandbox (começa com `$aact_`)
3. Adicionar ao `.env.local`:
   ```
   ASAAS_ENV=sandbox
   ASAAS_API_KEY=$aact_...
   ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
   ASAAS_WEBHOOK_TOKEN=$(openssl rand -hex 32)
   ```
4. Rodar migration: `supabase db push`

### Fluxo
1. `npm run dev`
2. Criar conta em `/register`
3. Acessar `/planos` → clicar "Começar plano Pro"
4. Deve redirecionar para sandbox.asaas.com/i/...
5. Usar cartão de teste do Asaas para pagar
6. Verificar webhook (passo abaixo)

### Configurar webhook no Asaas (sandbox)
1. Asaas Dashboard → Integrações → Webhooks
2. URL: `https://SEU_DOMINIO/api/asaas/webhook?token=SEU_WEBHOOK_TOKEN`
3. Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, SUBSCRIPTION_CANCELLED
4. Para testes locais: usar ngrok ou similar

### Verificar resultado
Após pagamento confirmado no sandbox:
- `subscriptions.status` = `active`
- `profiles.plan` = `pro`
- `credit_wallets.credits_available` += 30 (mensal) ou 360 (anual)

---

## Como configurar webhook no Asaas (produção)
1. Trocar `ASAAS_ENV=production` e `ASAAS_BASE_URL=https://api.asaas.com/v3`
2. Usar chave de produção em `ASAAS_API_KEY`
3. No painel Asaas produção → Configurações → Webhooks
4. URL: `https://reda1000.com.br/api/asaas/webhook?token=SEU_WEBHOOK_TOKEN`

---

## Limitações conhecidas

1. **Sem upgrade/downgrade:** usuário com plano ativo não pode trocar; deve cancelar e reassinar
2. **Créditos sem controle de duplicata:** se o webhook for recebido duas vezes (retry do Asaas), os créditos podem ser duplicados — adicionar idempotency check em Task 021
3. **Créditos grant não usa atomic update:** usa SELECT + UPDATE separados; race condition improvável mas possível em alta concorrência
4. **Sem página de confirmação:** usuário retorna do checkout direto para `/` sem mensagem de boas-vindas ao Pro — pode ser melhorado com `?payment=success` na URL de retorno
5. **Webhook local requer tunnel:** ngrok ou similar para testes em desenvolvimento
