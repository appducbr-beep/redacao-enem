# Task 003 — Revisão Crítica do Banco de Dados

**Status:** concluída  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Referências:** specs 02, 03, 05, 06, 09, 10

---

## Objetivo

Revisar criticamente o modelo de dados previsto na spec 02 antes de criar as migrations no Supabase. Identificar lacunas, riscos e campos faltantes que exigiriam migrations destrutivas se descobertos depois.

---

## 1. Tabelas recomendadas para o MVP

A spec 02 prevê 5 tabelas. A revisão identifica que são necessárias **7 tabelas** para suportar todos os fluxos descritos nas specs:

| # | Tabela              | Status na spec 02 | Situação         |
|---|---------------------|-------------------|------------------|
| 1 | `profiles`          | Presente          | Ajustes necessários |
| 2 | `temas`             | Presente          | Pequenos ajustes |
| 3 | `redacoes`          | Presente          | Ajustes necessários |
| 4 | `correcoes`         | Presente          | Ajustes necessários |
| 5 | `pagamentos`        | Presente          | Ajustes necessários |
| 6 | `assinaturas`       | **Ausente**       | **Criar**        |
| 7 | `webhook_logs`      | **Ausente**       | **Criar**        |

---

## 2. Campos principais de cada tabela (modelo revisado)

### `profiles`

| Coluna              | Tipo              | Observação                                           |
|---------------------|-------------------|------------------------------------------------------|
| id                  | uuid PK           | Referência a `auth.users.id`                         |
| full_name           | text              |                                                      |
| avatar_url          | text nullable     |                                                      |
| role                | user_role (enum)  | **NOVO** — `student` \| `admin` (exigido pela spec 10) |
| plan                | plan_type (enum)  | `free` \| `pro` \| `school`                          |
| credits             | integer           | Créditos avulsos disponíveis; CHECK `>= 0`          |
| asaas_customer_id   | text nullable     | **NOVO** — ID do cliente no Asaas; gerado na 1ª compra |
| created_at          | timestamptz       | DEFAULT `now()`                                      |
| updated_at          | timestamptz       | **NOVO** — necessário para triggers e auditoria      |

**Lacunas na spec:** `role` está mencionado na spec 10 (admin) mas ausente na tabela. `asaas_customer_id` é necessário para vincular pagamentos/assinaturas ao usuário no Asaas.

---

### `temas`

| Coluna              | Tipo          | Observação                                          |
|---------------------|---------------|-----------------------------------------------------|
| id                  | uuid PK       |                                                     |
| titulo              | text NOT NULL |                                                     |
| ano                 | integer null  | Ano ENEM de referência; null = tema novo            |
| textos_motivadores  | jsonb         | Array de objetos `{tipo, fonte, conteudo/url}`      |
| ativo               | boolean       | DEFAULT `true`                                      |
| created_at          | timestamptz   |                                                     |
| updated_at          | timestamptz   | **NOVO**                                            |

**Sem lacunas críticas.** O campo `updated_at` é o único ajuste recomendado.

---

### `redacoes`

| Coluna              | Tipo                    | Observação                                       |
|---------------------|-------------------------|--------------------------------------------------|
| id                  | uuid PK                 |                                                  |
| user_id             | uuid FK → profiles.id   |                                                  |
| tema_id             | uuid FK → temas.id      |                                                  |
| texto               | text NOT NULL           | Corpo da redação (modalidade digitação)          |
| storage_url         | text nullable           | **NOVO** — path no Supabase Storage (PDF/futura) |
| modalidade          | redacao_modalidade enum | **NOVO** — `text` \| `pdf` \| `photo`            |
| contagem_palavras   | integer                 | **NOVO** — calculado no envio; útil para analytics |
| credito_consumido   | boolean                 | **NOVO** — flag para controle de estorno         |
| status              | redacao_status (enum)   | `pending` \| `processing` \| `done` \| `error`   |
| created_at          | timestamptz             |                                                  |
| updated_at          | timestamptz             | **NOVO** — registra quando `status` mudou        |

**Lacunas:** Sem `updated_at`, não é possível saber há quanto tempo uma redação está em `processing` (importante para detectar jobs travados). Sem `credito_consumido`, o estorno em caso de erro exigiria lógica extra para evitar estornos duplos.

---

### `correcoes`

| Coluna              | Tipo          | Observação                                              |
|---------------------|---------------|----------------------------------------------------------|
| id                  | uuid PK       |                                                          |
| redacao_id          | uuid FK UNIQUE| UNIQUE — uma redação tem no máximo uma correção          |
| c1                  | smallint      | CHECK `IN (0,40,80,120,160,200)`                        |
| c2                  | smallint      | CHECK `IN (0,40,80,120,160,200)`                        |
| c3                  | smallint      | CHECK `IN (0,40,80,120,160,200)`                        |
| c4                  | smallint      | CHECK `IN (0,40,80,120,160,200)`                        |
| c5                  | smallint      | CHECK `IN (0,40,80,120,160,200)`                        |
| nota_total          | smallint GENERATED | **ALTERAR** — `GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED` |
| feedback            | jsonb NOT NULL| Output completo do Groq (feedbacks, pontos, comentário) |
| modelo_ia           | text          | Ex: `llama3-70b-8192`                                   |
| tokens_usados       | integer null  | **NOVO** — para monitorar custo Groq                    |
| created_at          | timestamptz   |                                                          |

**Lacunas críticas:**

1. `nota_total` está como coluna editável na spec — pode ficar inconsistente com a soma real. Deve ser `GENERATED ALWAYS AS`.
2. Não há `CHECK` nos valores de c1–c5. Qualquer integer seria aceito, permitindo notas fora da escala ENEM (ex: 250).
3. A FK `redacao_id` não tem `UNIQUE`, o que permitiria múltiplas correções por redação — comportamento não previsto no MVP.

---

### `pagamentos`

| Coluna              | Tipo                  | Observação                                          |
|---------------------|-----------------------|-----------------------------------------------------|
| id                  | uuid PK               |                                                     |
| user_id             | uuid FK               |                                                     |
| asaas_payment_id    | text UNIQUE NOT NULL  | ID externo Asaas; UNIQUE para idempotência          |
| asaas_subscription_id | text null           | **NOVO** — FK lógica para `assinaturas`             |
| valor               | numeric(10,2)         | BRL; precisão explícita                             |
| descricao           | text null             | **NOVO** — ex: "Pacote Básico - 15 créditos"        |
| status              | pagamento_status enum | `pending` \| `confirmed` \| `overdue` \| `cancelled` \| `refunded` |
| tipo                | pagamento_tipo enum   | `credito_avulso` \| `assinatura`                    |
| created_at          | timestamptz           |                                                     |
| updated_at          | timestamptz           | **NOVO** — status muda ao longo do tempo            |

**Lacunas:** `asaas_payment_id` sem `UNIQUE` permite registrar o mesmo pagamento duas vezes via webhook duplicado — vulnerabilidade direta de idempotência.

---

### `assinaturas` (**tabela nova — ausente na spec 02**)

Esta tabela é necessária porque planos Pro têm ciclo de vida próprio: criação, renovação, cancelamento, expiração. Controlar tudo isso via `profiles.plan` e `pagamentos` é inviável.

| Coluna                  | Tipo                    | Observação                                    |
|-------------------------|-------------------------|-----------------------------------------------|
| id                      | uuid PK                 |                                               |
| user_id                 | uuid FK UNIQUE          | UNIQUE — um usuário, uma assinatura ativa     |
| asaas_subscription_id   | text UNIQUE NOT NULL    | ID da assinatura no Asaas                     |
| plano                   | plan_type enum          | `pro` \| `school`                             |
| status                  | assinatura_status enum  | `active` \| `cancelled` \| `expired` \| `past_due` |
| valor                   | numeric(10,2)           | Valor da recorrência                          |
| ciclo                   | text                    | `monthly` \| `yearly`                         |
| proximo_vencimento      | date null               | Preenchido pelo webhook de renovação          |
| cancelado_em            | timestamptz null        |                                               |
| created_at              | timestamptz             |                                               |
| updated_at              | timestamptz             |                                               |

**Por que é crítica:** Sem esta tabela, não há como responder a perguntas como "o plano Pro deste usuário já foi cancelado?", "qual é a data de vencimento?" ou "quantas renovações ele teve?". Também é necessária para o webhook `SUBSCRIPTION_CANCELLED` e `SUBSCRIPTION_RENEWED` da spec 09.

---

### `webhook_logs` (**tabela nova — ausente na spec 02**)

Necessária para garantir idempotência dos webhooks do Asaas e para auditoria/debugging.

| Coluna              | Tipo          | Observação                                          |
|---------------------|---------------|-----------------------------------------------------|
| id                  | uuid PK       |                                                     |
| evento              | text NOT NULL | Ex: `PAYMENT_CONFIRMED`                             |
| asaas_event_id      | text UNIQUE   | ID único do evento no Asaas; UNIQUE para idempotência |
| payload             | jsonb NOT NULL| Payload bruto do webhook                            |
| processado          | boolean       | DEFAULT `false`                                     |
| processado_em       | timestamptz null |                                                  |
| erro_mensagem       | text null     | Se falhou ao processar                              |
| created_at          | timestamptz   |                                                     |

**Por que é crítica:** A spec 09 menciona "verificar se o evento já foi processado antes de agir" como requisito de idempotência, mas não há tabela para isso. O `asaas_payment_id UNIQUE` em `pagamentos` só cobre o caso de pagamentos confirmados, não outros tipos de evento.

---

## 3. Relacionamentos entre tabelas

```
auth.users
    └── profiles (1:1, trigger on insert)
            ├── redacoes (1:N)
            │       └── correcoes (1:1)
            ├── assinaturas (1:1 — um ativo por vez)
            └── pagamentos (1:N)
                    └── assinaturas (N:1, via asaas_subscription_id)

temas
    └── redacoes (1:N)

webhook_logs
    (tabela independente — log de entrada de webhooks)
```

**Regras de integridade importantes:**
- Deletar um `profile` deve ter `ON DELETE CASCADE` para `redacoes`, `pagamentos`, `assinaturas` — ou `RESTRICT` conforme política de exclusão de conta.
- `correcoes.redacao_id` deve ter `ON DELETE CASCADE`.
- `redacoes.tema_id` deve ser `ON DELETE RESTRICT` — não se deve excluir um tema com redações associadas.

---

## 4. Enums necessários

Todos os campos de status e tipo são `text` na spec atual, sem restrição de valores. Isso permite inserir qualquer string e quebrar lógica de negócio silenciosamente.

```sql
-- Papel do usuário
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Plano do usuário
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'school');

-- Status da redação
CREATE TYPE redacao_status AS ENUM ('pending', 'processing', 'done', 'error');

-- Modalidade de envio da redação
CREATE TYPE redacao_modalidade AS ENUM ('text', 'pdf', 'photo');

-- Status de pagamento (avulso)
CREATE TYPE pagamento_status AS ENUM (
  'pending', 'confirmed', 'overdue', 'cancelled', 'refunded'
);

-- Tipo de pagamento
CREATE TYPE pagamento_tipo AS ENUM ('credito_avulso', 'assinatura');

-- Status da assinatura
CREATE TYPE assinatura_status AS ENUM (
  'active', 'cancelled', 'expired', 'past_due'
);
```

---

## 5. Riscos e lacunas da modelagem atual

### Risco 1 — Race condition em créditos (crítico)

**Problema:** O fluxo da spec 05 diz "crédito é consumido no momento do envio" e "se a correção falhar, crédito é estornado". Com `profiles.credits` como um inteiro mutável, duas requisições simultâneas do mesmo usuário podem:
1. Ambas lerem `credits = 1`
2. Ambas passarem na validação
3. Ambas decrementarem, resultando em `credits = -1`

**Solução:** O decremento deve ser feito atomicamente via SQL:
```sql
UPDATE profiles
SET credits = credits - 1
WHERE id = $user_id AND credits > 0
RETURNING credits;
```
Se retornar 0 linhas, o crédito não estava disponível. Nunca ler e depois atualizar em etapas separadas.

---

### Risco 2 — `nota_total` inconsistente (alto)

**Problema:** `nota_total` é uma coluna editável. Se c1–c5 forem atualizados por qualquer motivo, `nota_total` pode ficar desatualizado. Gráficos de progresso e filtros usarão um valor errado sem nenhum erro visível.

**Solução:** `GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED` — PostgreSQL garante a consistência.

---

### Risco 3 — Ausência de `assinaturas` quebra o modelo de pagamentos (crítico)

**Problema:** A spec 09 descreve 4 webhooks (`PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_RENEWED`). Os dois últimos são específicos de assinatura e não têm onde ser persistidos no modelo atual. O handler de `SUBSCRIPTION_CANCELLED` apenas atualizaria `profiles.plan = 'free'`, mas perderia toda a rastreabilidade: quando foi cancelado? havia período de carência? o usuário reativou?

---

### Risco 4 — Idempotência de webhooks sem tabela de log (alto)

**Problema:** A spec 09 diz "verificar se o evento já foi processado antes de agir", mas não há mecanismo para isso. O `asaas_payment_id UNIQUE` em `pagamentos` ajuda somente para evitar registros duplicados de pagamento, mas não impede que um webhook de `SUBSCRIPTION_RENEWED` seja processado duas vezes, adicionando créditos ou estendendo plano duplicadamente.

---

### Risco 5 — `profiles` sem `role` bloqueia implementação do admin (alto)

**Problema:** A spec 10 descreve um painel admin com acesso por role, mas `profiles` não tem o campo `role`. Isso significa que a middleware de admin não tem base de dados para funcionar, e as políticas RLS de admin também não.

---

### Risco 6 — Valores de c1–c5 sem CHECK constraint (médio)

**Problema:** O ENEM só aceita 0, 40, 80, 120, 160 ou 200 por competência. Sem `CHECK`, a IA (ou um bug no parser da resposta JSON) pode gravar 250 ou -40 sem nenhum erro de banco.

---

### Risco 7 — `profiles` sem `asaas_customer_id` (médio)

**Problema:** O Asaas vincula pagamentos a um cliente. Se o `asaas_customer_id` não for armazenado no `profile`, cada compra criaria um novo cliente no Asaas, impossibilitando consultar o histórico de cobranças de um usuário pelo painel do Asaas, ou tratar reembolsos manualmente.

---

### Risco 8 — Redações sem `updated_at` (baixo, mas impede diagnóstico)

**Problema:** Sem `updated_at`, não há como detectar jobs de correção travados. Se uma redação ficou em `status = 'processing'` há 10 minutos, não há como saber com uma query simples. Isso tornaria o monitoramento operacional muito difícil.

---

## 6. Sugestões antes de criar as migrations

### Ordem recomendada de criação das migrations

```
001_create_enums.sql
002_create_profiles.sql          (com trigger em auth.users)
003_create_temas.sql
004_create_redacoes.sql
005_create_correcoes.sql
006_create_assinaturas.sql
007_create_pagamentos.sql
008_create_webhook_logs.sql
009_create_indexes.sql
010_create_rls_policies.sql
```

### Índices mínimos para o MVP

```sql
-- Queries mais frequentes previstas:
CREATE INDEX idx_redacoes_user_id ON redacoes(user_id);
CREATE INDEX idx_redacoes_status ON redacoes(status);
CREATE INDEX idx_redacoes_created_at ON redacoes(user_id, created_at DESC); -- histórico
CREATE INDEX idx_correcoes_redacao_id ON correcoes(redacao_id);
CREATE INDEX idx_pagamentos_user_id ON pagamentos(user_id);
CREATE INDEX idx_assinaturas_user_id ON assinaturas(user_id);
CREATE INDEX idx_webhook_logs_asaas_event_id ON webhook_logs(asaas_event_id);
```

### Trigger obrigatório (Supabase)

```sql
-- Cria profile automaticamente ao registrar usuário (spec 03)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, plan, credits)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'student',
    'free',
    3  -- créditos iniciais do plano gratuito
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Decisão necessária antes das migrations

Há um ponto que precisa de decisão de produto antes de modelar:

> **Usuários Pro têm créditos ou acesso ilimitado?**

A spec 02 tem `profiles.credits` como um inteiro para todos os usuários. A spec 09 diz que o plano Pro tem "créditos ilimitados". Isso pode ser implementado de duas formas:

- **Opção A:** `credits = -1` como sentinel de "ilimitado" — simples, mas semanticamente ruim e propenso a bugs.
- **Opção B:** A lógica de autorização verifica `plan = 'pro'` antes de verificar `credits` — `credits` só é consultado para usuários `free`. Mais limpo.

A Opção B é recomendada. Isso significa que a query de envio deve ser:
```sql
-- Autorizar envio:
WHERE id = $user_id
  AND (plan = 'pro' OR credits > 0)
```

Isso deve ser definido antes das migrations e documentado na spec 05.

---

## Resumo das mudanças em relação à spec 02

| Tabela         | Ação         | Mudanças                                                     |
|----------------|--------------|--------------------------------------------------------------|
| `profiles`     | Ajustar      | + `role`, + `asaas_customer_id`, + `updated_at`; enums em `plan` |
| `temas`        | Ajustar      | + `updated_at`                                               |
| `redacoes`     | Ajustar      | + `updated_at`, + `modalidade`, + `storage_url`, + `contagem_palavras`, + `credito_consumido`; enum em `status` |
| `correcoes`    | Ajustar      | `nota_total` GENERATED; CHECK em c1–c5; UNIQUE em `redacao_id`; + `tokens_usados` |
| `pagamentos`   | Ajustar      | UNIQUE em `asaas_payment_id`; + `asaas_subscription_id`, + `descricao`, + `updated_at`; enums |
| `assinaturas`  | **Criar**    | Tabela nova, essencial para plano Pro                        |
| `webhook_logs` | **Criar**    | Tabela nova, essencial para idempotência de webhooks         |

## Critérios de aceite desta task

- [x] Todas as tabelas da spec 02 revisadas criticamente
- [x] Lacunas identificadas com justificativa
- [x] 2 tabelas novas propostas com campos detalhados
- [x] 7 enums mapeados
- [x] Relacionamentos documentados
- [x] 8 riscos documentados com severidade
- [x] Índices recomendados listados
- [x] Trigger de criação de profile documentado
- [x] Decisão de produto pendente identificada (créditos vs. Pro)
- [x] Nenhum código alterado
- [x] Nenhuma migration criada
- [x] Nenhuma instalação realizada

---

## 7. Decisão final do arquiteto (2026-04-25)

Todas as recomendações da revisão foram avaliadas. Decisões aprovadas e aplicadas nas specs 02 (v0.3) e 09 (v0.2):

| # | Decisão                                                              | Impacto                                         |
|---|----------------------------------------------------------------------|-------------------------------------------------|
| 1 | Criar tabela `subscriptions` para controlar ciclo de vida do plano Pro | Spec 02: tabela nova com 11 campos              |
| 2 | Criar tabela `webhook_logs` para idempotência dos webhooks do Asaas  | Spec 02: tabela nova com 8 campos               |
| 3 | Adicionar `profiles.role` com valores `student` e `admin`            | Spec 02: campo adicionado, base para RLS/admin  |
| 4 | Adicionar `profiles.asaas_customer_id`                               | Spec 02: campo adicionado; spec 09: fluxo atualizado |
| 5 | Garantir `UNIQUE` em `essay_corrections.essay_id` no MVP             | Spec 02: constraint UNIQUE adicionada           |
| 6 | `total_score` (ex-`nota_total`) como coluna gerada                   | Spec 02: `GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED` |
| 7 | Plano free usa créditos; plano pro ativo ignora créditos             | Spec 02: query de autorização documentada; spec 09: regra de acesso e sincronização de `profiles.plan` documentadas |

### Decisão pendente — resolvida

A questão "Usuários Pro têm créditos ou acesso ilimitado?" (Risco identificado na seção 5, Opção A vs. B) foi resolvida pelo arquiteto com a decisão 7:

> **Opção B aprovada.** Para plano `pro`/`school`: verificar `subscriptions.status = 'active'`. Créditos são irrelevantes para esses planos. Para plano `free`: verificar `profiles.credits > 0`.

### Convenção de nomenclatura — definida

As decisões 1 e 5 usaram explicitamente nomes em inglês (`subscriptions`, `essay_corrections.essay_id`). A spec 02 v0.3 adotou inglês como convenção para todas as tabelas e colunas:

| Nome anterior (português) | Nome atual (inglês)   |
|---------------------------|-----------------------|
| `temas`                   | `essay_topics`        |
| `redacoes`                | `essays`              |
| `correcoes`               | `essay_corrections`   |
| `pagamentos`              | `payments`            |
| `assinaturas`             | `subscriptions`       |
| `profiles`                | `profiles` (sem alteração) |
| `webhook_logs`            | `webhook_logs` (sem alteração) |

### Próxima task

**Task 004 — Setup do Supabase e Migrations**
- Criar projeto no Supabase (sandbox)
- Instalar Supabase CLI
- Escrever as 10 migrations na ordem definida na spec 02
- Configurar cliente Supabase em `apps/web/lib/supabase/`
