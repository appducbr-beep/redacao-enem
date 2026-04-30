# Task 004 — Migrations Supabase

**Status:** concluída (arquivos criados — migrations não executadas)  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.3, spec 09 v0.2, task-003

---

## Objetivo

Criar os arquivos SQL de migration do Supabase para o banco de dados do Reda1000, cobrindo todas as tabelas, constraints, triggers, índices e políticas RLS definidas na spec 02 e aprovadas na task-003.

---

## Resumo das migrations criadas

| Arquivo | Conteúdo |
|---------|----------|
| `20260425000001_create_enums.sql` | 7 tipos ENUM do sistema |
| `20260425000002_create_profiles.sql` | Tabela profiles + função set_updated_at + trigger updated_at + função handle_new_user + trigger on_auth_user_created |
| `20260425000003_create_essay_topics.sql` | Tabela essay_topics + trigger updated_at |
| `20260425000004_create_essays.sql` | Tabela essays + trigger updated_at |
| `20260425000005_create_essay_corrections.sql` | Tabela essay_corrections (coluna GENERATED, CHECKs ENEM) |
| `20260425000006_create_subscriptions.sql` | Tabela subscriptions + trigger updated_at |
| `20260425000007_create_asaas_payments.sql` | Tabela asaas_payments + trigger updated_at |
| `20260425000008_create_webhook_logs.sql` | Tabela webhook_logs |
| `20260425000009_create_indexes.sql` | 7 índices de performance |
| `20260425000010_create_rls_policies.sql` | Função is_admin() + 14 políticas RLS |

---

## Tabelas criadas

| Tabela | Colunas | Destaques |
|---|---|---|
| `profiles` | 9 | FK → auth.users; CHECK credits >= 0; trigger auto-criação |
| `essay_topics` | 7 | CHECK ano 1998–2100; leitura pública (ativos) |
| `essays` | 11 | FK RESTRICT em topic_id; CHECK content não vazio; flag credit_consumed |
| `essay_corrections` | 11 | UNIQUE essay_id (1:1); CHECK c1–c5 ∈ {0,40,80,120,160,200}; total_score GENERATED |
| `subscriptions` | 12 | UNIQUE user_id; CHECK plan ≠ free; CHECK billing_cycle |
| `asaas_payments` | 10 | UNIQUE asaas_payment_id; CHECK amount > 0 |
| `webhook_logs` | 8 | UNIQUE asaas_event_id; sem políticas de usuário |

---

## Enums criados

| Enum | Valores |
|---|---|
| `user_role` | student, admin |
| `plan_type` | free, pro, school |
| `essay_status` | pending, processing, done, error |
| `essay_modality` | text, pdf, photo |
| `payment_status` | pending, confirmed, overdue, cancelled, refunded |
| `payment_type` | credit_purchase, subscription |
| `subscription_status` | active, cancelled, expired, past_due |

---

## Políticas RLS criadas

| Tabela | Políticas |
|---|---|
| `profiles` | select own or admin; update own; admin update any |
| `essay_topics` | authenticated see active; admin see all; admin insert; admin update; admin delete |
| `essays` | select own or admin; insert own; update own |
| `essay_corrections` | select own or admin (via essays join) |
| `subscriptions` | select own or admin |
| `asaas_payments` | select own or admin |
| `webhook_logs` | nenhuma — somente service_role |

**Total: 14 políticas + 1 função auxiliar `is_admin()`**

---

## Funções e triggers criados

| Objeto | Tipo | Tabela / Evento | Descrição |
|---|---|---|---|
| `set_updated_at()` | função | — | Genérica; atualiza updated_at antes de UPDATE |
| `profiles_set_updated_at` | trigger | profiles BEFORE UPDATE | |
| `essay_topics_set_updated_at` | trigger | essay_topics BEFORE UPDATE | |
| `essays_set_updated_at` | trigger | essays BEFORE UPDATE | |
| `subscriptions_set_updated_at` | trigger | subscriptions BEFORE UPDATE | |
| `asaas_payments_set_updated_at` | trigger | asaas_payments BEFORE UPDATE | |
| `handle_new_user()` | função | — | SECURITY DEFINER; cria profile ao registrar |
| `on_auth_user_created` | trigger | auth.users AFTER INSERT | Dispara handle_new_user() |
| `is_admin()` | função | — | SECURITY DEFINER STABLE; usada nas policies |

---

## Índices criados

| Índice | Tabela | Colunas | Motivo |
|---|---|---|---|
| `idx_essays_user_created` | essays | (user_id, created_at DESC) | Histórico do usuário no dashboard |
| `idx_essays_status` | essays | (status) | Monitorar jobs travados; painel admin |
| `idx_asaas_payments_user_id` | asaas_payments | (user_id) | Histórico financeiro do usuário |
| `idx_asaas_payments_status` | asaas_payments | (status) | Filtro admin |
| `idx_subscriptions_status` | subscriptions | (status) | Verificação de acesso Pro |
| `idx_webhook_logs_unprocessed` | webhook_logs | (created_at DESC) WHERE processed = false | Acelera busca de eventos pendentes |
| `idx_essay_topics_active` | essay_topics | (active, created_at DESC) | Listagem pública de temas ativos |

---

## Pontos de atenção

### 1. Nome da tabela de pagamentos — decisão final do arquiteto

**Decisão:** manter `asaas_payments` como nome definitivo da tabela.

**Motivação registrada pelo arquiteto:**
- O prefixo `asaas_` torna o acoplamento ao provedor explícito no próprio nome da tabela.
- Preserva espaço para outros provedores de pagamento no futuro (ex: `stripe_payments`, `mercadopago_payments`) sem ambiguidade ou necessidade de rename destrutivo.
- Elimina a dúvida sobre qual tabela consultar quando houver múltiplas integrações de pagamento.

**Ações realizadas:** spec 02 atualizada para v0.4 com `asaas_payments` em todos os locais onde `payments` aparecia (heading da tabela, diagrama de relacionamentos, índices, políticas RLS e ordem de migrations).

### 2. Nome da tabela de temas
O requisito especificou `themes`; o nome aprovado na spec 02 é `essay_topics`. As migrations usam `essay_topics`. Nenhuma ação necessária.

### 3. Proteção de role e plan em profiles
A política de UPDATE em `profiles` permite que o usuário autentique atualize qualquer campo — incluindo `role` e `plan`. A proteção real deve ser implementada na **API Route** usando `service_role` para qualquer alteração de plano, e nunca expondo esses campos em formulários de usuário. Considerar grant de colunas específicas em versão futura.

### 4. essay_corrections sem política de INSERT
Intencionalmente sem política de INSERT/UPDATE para usuários. O pipeline de IA (API Route) usa `service_role`, que bypassa RLS. Se for necessário testar via cliente Supabase com usuário autenticado, é preciso usar o `service_role` key, nunca a `anon` ou `authenticated` key.

### 5. SECURITY DEFINER em is_admin() e handle_new_user()
Ambas as funções executam como o dono da função (role `postgres` no Supabase), não como o usuário chamante. Isso é necessário para:
- `is_admin()`: evitar recursão ao consultar `profiles` dentro de uma policy de `profiles`
- `handle_new_user()`: ter permissão para INSERT em `profiles` durante o trigger, mesmo com RLS habilitado

### 6. total_score como coluna GENERATED
`essay_corrections.total_score` é `GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED`. Tentativas de INSERT ou UPDATE direto nesta coluna retornarão erro PostgreSQL. O valor é sempre calculado automaticamente.

### 7. Idempotência de webhooks
O fluxo correto no handler de webhooks é:
```sql
-- 1. Inserir na webhook_logs (pode falhar se asaas_event_id já existe — isso é o comportamento esperado)
INSERT INTO webhook_logs (event, asaas_event_id, payload) VALUES (...)
ON CONFLICT (asaas_event_id) DO NOTHING;

-- 2. Verificar se já foi processado
SELECT processed FROM webhook_logs WHERE asaas_event_id = $1;

-- 3. Se processed = false: processar e atualizar
UPDATE webhook_logs SET processed = true, processed_at = now() WHERE asaas_event_id = $1;
```

---

## Como executar as migrations

> **Pré-requisitos (ainda não executados nesta task):**
> - Supabase CLI instalado (`npm install -g supabase`)
> - Projeto criado no Supabase Dashboard
> - `.env.local` configurado com as variáveis do Supabase

```bash
# Na raiz do projeto
supabase login
supabase link --project-ref <seu-project-ref>
supabase db push
```

Ou para ambiente local com Docker:
```bash
supabase start
supabase db reset  # aplica todas as migrations do zero
```

---

## Critérios de aceite

- [x] Pasta `supabase/migrations/` criada na raiz do projeto
- [x] 10 arquivos SQL criados em ordem de dependência
- [x] 7 enums criados com todos os valores previstos na spec
- [x] 7 tabelas criadas com campos, tipos e restrições corretos
- [x] CHECK constraint nos valores de c1–c5 (escala ENEM)
- [x] `total_score` como coluna GENERATED (nunca editável)
- [x] UNIQUE em `essay_corrections.essay_id` (relação 1:1)
- [x] UNIQUE em `asaas_payment_id` (idempotência)
- [x] UNIQUE em `asaas_event_id` (idempotência)
- [x] Trigger `on_auth_user_created` em auth.users
- [x] Função `set_updated_at()` genérica reutilizada por 5 tabelas
- [x] Função `is_admin()` com SECURITY DEFINER
- [x] RLS habilitado em todas as 7 tabelas
- [x] 14 políticas RLS criadas
- [x] 7 índices de performance criados
- [x] Frontend não alterado
- [x] Nenhum pacote instalado
- [x] Migrations não executadas

---

## Próxima task sugerida

**Task 005 — Instalação do Supabase e Execução das Migrations**
- Instalar Supabase CLI
- Instalar `@supabase/ssr` e `@supabase/supabase-js` em `apps/web`
- Criar projeto no Supabase (ambiente sandbox/staging)
- Preencher variáveis de ambiente no `.env.local`
- Executar `supabase db push` e validar schema no Dashboard
- Criar cliente Supabase tipado em `apps/web/lib/supabase/`
