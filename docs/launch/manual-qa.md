# QA Manual — Reda1000

Fluxos de teste manual antes do lançamento. Executar no ambiente de **staging/preview** com Asaas sandbox.

**Pré-requisito:** ngrok ativo para receber webhooks localmente:
```bash
ngrok http 3000
# Configurar no Asaas: https://<id>.ngrok.io/api/asaas/webhook
```

---

## A) Cadastro

**Passos:**
1. Acessar `/register`
2. Preencher Nome completo, e-mail e senha
3. Clicar em "Criar conta"

**Resultado esperado:**
- Redirecionado para `/` (dashboard)
- Saudação exibe o primeiro nome: "Olá, [Nome]!"
- `profiles.full_name` gravado no Supabase
- `credit_wallets.credits_available` = créditos iniciais do plano free

---

## B) Login

**Passos:**
1. Acessar `/login`
2. Preencher e-mail e senha de conta existente
3. Clicar em "Entrar"

**Resultado esperado:**
- Redirecionado para dashboard (`/`)
- Saudação exibe nome correto
- Plano e créditos exibidos nos cards de stats

---

## C) Dashboard

**Passos:**
1. Acessar `/` autenticado
2. Verificar todos os elementos

**Resultado esperado:**
- Cards de ação: Nova redação, Histórico, Evolução, (Planos Pro se free)
- Stats: média de nota, total de redações, créditos disponíveis
- Tabela de redações recentes (últimas 5)
- Banner "Renovação cancelada" visível se `cancel_at_period_end = true`
- Banner "Créditos esgotados" visível se free e credits = 0

---

## D) Nova redação — digitada

**Passos:**
1. Acessar `/temas`
2. Selecionar tema disponível para free
3. Clicar em "Começar"
4. Digitar texto de redação (mínimo 3 parágrafos)
5. Clicar em "Enviar para correção"

**Resultado esperado:**
- Redirecionado para `/redacoes/[id]`
- Status da redação muda para `processing` → `done`
- Correção exibida: nota total, C1–C5, feedback por competência
- Créditos decrementam em 1

---

## E) OCR — redação manuscrita

**Passos:**
1. Acessar `/redacao/nova`
2. Selecionar opção "Foto/manuscrito"
3. Fazer upload de imagem de redação manuscrita (JPG/PNG)
4. Aguardar extração do texto pelo Groq

**Resultado esperado:**
- Texto extraído exibido para revisão
- Usuário pode editar antes de enviar
- Após confirmação, fluxo igual ao D)

---

## F) Correção

**Passos:**
1. Abrir redação com status `done` em `/redacoes/[id]`

**Resultado esperado:**
- Nota total exibida (ex: 760/1000)
- Notas individuais: C1, C2, C3, C4, C5
- Feedback detalhado com trechos do texto
- Sugestões de melhoria por competência
- Erros identificados com localização

---

## G) Histórico

**Passos:**
1. Acessar `/redacoes`

**Resultado esperado:**
- Lista de todas as redações do usuário
- Status de cada uma (pendente, processando, concluída)
- Nota total para as concluídas
- Links para cada redação

---

## H) Evolução

**Passos:**
1. Acessar `/evolucao`
2. Verificar gráficos e métricas (requer ≥ 2 redações concluídas)

**Resultado esperado:**
- Gráfico de evolução da nota total ao longo do tempo
- Desempenho por competência (C1–C5)
- Tendência de melhora visível para múltiplas redações

---

## I) Assinatura Pro

**Passos:**
1. Acessar `/planos` com usuário free
2. Clicar em "Assinar" no plano Pro
3. Preencher CPF na modal (use CPF de teste: `000.000.000-00`)
4. Confirmar

**Resultado esperado:**
- Redirecionado para checkout do Asaas
- Após pagamento sandbox: webhook `PAYMENT_CONFIRMED` recebido
- `profiles.plan` = `pro`
- `credit_wallets.credits_available` = 20
- `subscriptions.status` = `active`
- `subscriptions.current_period_start` e `current_period_end` preenchidos
- Dashboard exibe plano Pro e créditos = 20

---

## J) Webhook

**Passos:**
1. Com ngrok ativo, realizar pagamento sandbox no Asaas
2. Verificar logs do servidor: `[webhook/asaas] event: PAYMENT_CONFIRMED`

**Resultado esperado:**
- Log confirma evento recebido e processado
- Tabela `webhook_logs` registra o evento com `processed = true`
- Se reenviar o mesmo evento: log `Duplicate event, skipping`
- Nenhum crédito acumulado no reenvio

**Verificação SQL:**
```sql
SELECT event, asaas_event_id, processed, error_message
FROM webhook_logs
ORDER BY created_at DESC LIMIT 5;
```

---

## K) Cancelamento dentro de 7 dias

**Pré-requisito:** usuário Pro com assinatura criada há menos de 7 dias.

**Passos:**
1. Acessar `/planos` ou `/perfil`
2. Clicar em "Cancelar plano Pro"
3. Confirmar na modal

**Resultado esperado:**
- Redirecionado para `/perfil?cancelled=immediate`
- Banner âmbar: "Plano cancelado... reembolso em processamento"
- `profiles.plan` = `free`
- `subscriptions.status` = `cancelled`
- `subscriptions.refund_required` = `true`
- `credit_wallets.credits_available` = 3
- Asaas: assinatura deletada (verificar painel Asaas)

**Verificação SQL:**
```sql
SELECT status, refund_required, refund_reason, cancelled_at
FROM subscriptions WHERE user_id = 'USER_ID';

SELECT credits_available FROM credit_wallets WHERE user_id = 'USER_ID';
```

---

## L) Cancelamento após 7 dias

**Pré-requisito:** usuário Pro com assinatura criada há mais de 7 dias.

**Para testar rapidamente (SQL):**
```sql
UPDATE subscriptions
SET current_period_start = now() - interval '10 days'
WHERE user_id = 'USER_ID' AND status = 'active';
```

**Passos:**
1. Acessar `/planos` ou `/perfil`
2. Clicar em "Cancelar plano Pro"
3. Confirmar

**Resultado esperado:**
- Redirecionado para `/perfil?cancelled=scheduled`
- Banner azul com data de expiração
- `profiles.plan` ainda = `pro`
- `subscriptions.cancel_at_period_end` = `true`
- Créditos NÃO alterados
- Asaas: assinatura NÃO deletada ainda
- Dashboard exibe banner "Renovação cancelada. Acesso ativo até DD/MM/AAAA"

---

## M) Cron

**Passos:**
1. Criar assinatura com `cancel_at_period_end = true` e `current_period_end` no passado:
```sql
UPDATE subscriptions
SET current_period_end = now() - interval '1 hour'
WHERE user_id = 'USER_ID' AND status = 'active';
```
2. Chamar o cron manualmente:
```bash
curl -X GET https://localhost:3000/api/cron/subscriptions \
  -H "x-cron-secret: <CRON_SECRET>"
```

**Resultado esperado:**
- Response: `{ "ok": true, "credit_resets": 0, "expirations": 1 }`
- `profiles.plan` = `free`
- `subscriptions.status` = `cancelled`
- `credit_wallets.credits_available` = 0

---

## N) Sem créditos (free)

**Passos:**
1. Zerar créditos de usuário free:
```sql
-- Usar set_credit_balance via Supabase SQL Editor
SELECT set_credit_balance('USER_ID', 0, 'test_zero_credits');
```
2. Tentar criar nova redação

**Resultado esperado:**
- Dashboard exibe banner laranja "Créditos esgotados" → botão "Assinar Pro"
- Tentativa de nova redação bloqueada ou redireciona para `/planos`

---

## O) Tema Pro bloqueado

**Passos:**
1. Com usuário free, acessar `/temas`
2. Identificar tema marcado como exclusivo Pro
3. Tentar selecionar

**Resultado esperado:**
- Tema bloqueado visualmente (ícone de cadeado ou tooltip)
- Clicar redireciona para `/planos` ou exibe CTA de upgrade
- Usuário Pro consegue acessar o mesmo tema normalmente
