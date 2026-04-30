# Spec 02 — Banco de Dados

**Status:** revisado  
**Versão:** 0.5  
**Última atualização:** 2026-04-26  
**Histórico:**
- v0.1 — rascunho inicial (5 tabelas em português)
- v0.2 — revisão crítica (task-003): 8 riscos identificados, 2 tabelas novas propostas
- v0.3 — decisões do arquiteto aplicadas: 7 tabelas, nomenclatura em inglês, enums, regra de acesso
- v0.4 — tabela `payments` renomeada para `asaas_payments` (decisão do arquiteto, task-004)
- v0.5 — (task-010) adicionadas `credit_wallets` e `credit_transactions`; documentadas funções auxiliares de crédito

---

## Objetivo

Definir o modelo de dados da plataforma, tabelas, campos, relacionamentos, enums e políticas de segurança.

## Tecnologia

- **SGBD:** PostgreSQL via Supabase
- **RLS:** Row Level Security habilitado em todas as tabelas de usuário
- **Migrations:** Supabase CLI
- **Convenção de nomenclatura:** inglês em tabelas e colunas

---

## Enums

Todos os campos de status, tipo e role usam enums PostgreSQL para garantir integridade em nível de banco.

```sql
CREATE TYPE user_role          AS ENUM ('student', 'admin');
CREATE TYPE plan_type          AS ENUM ('free', 'pro', 'school');
CREATE TYPE essay_status       AS ENUM ('pending', 'processing', 'done', 'error');
CREATE TYPE essay_modality     AS ENUM ('text', 'pdf', 'photo');
CREATE TYPE payment_status     AS ENUM ('pending', 'confirmed', 'overdue', 'cancelled', 'refunded');
CREATE TYPE payment_type       AS ENUM ('credit_purchase', 'subscription');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');
```

---

## Tabelas

### `profiles`

Extensão de `auth.users` (Supabase Auth). Criada automaticamente via trigger ao registrar.

| Coluna              | Tipo                  | Restrições               | Descrição                                        |
|---------------------|-----------------------|--------------------------|--------------------------------------------------|
| id                  | uuid                  | PK, FK → auth.users.id   |                                                  |
| full_name           | text                  |                          |                                                  |
| avatar_url          | text                  | nullable                 |                                                  |
| role                | user_role             | NOT NULL, DEFAULT student | Papel no sistema; base para RLS e middleware admin |
| plan                | plan_type             | NOT NULL, DEFAULT free   | Plano atual; mantido em sincronia pelos webhooks |
| credits             | integer               | NOT NULL, DEFAULT 3, CHECK >= 0 | Créditos avulsos; ignorado se plan = 'pro' ativo |
| asaas_customer_id   | text                  | nullable, UNIQUE          | ID do cliente no Asaas; preenchido na 1ª compra  |
| created_at          | timestamptz           | NOT NULL, DEFAULT now()  |                                                  |
| updated_at          | timestamptz           | NOT NULL, DEFAULT now()  | Atualizado via trigger                           |

**Trigger de criação:**
```sql
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
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

### `essay_topics`

Banco de temas de redação. Leitura pública; escrita restrita a admins.

| Coluna               | Tipo        | Restrições                | Descrição                                  |
|----------------------|-------------|---------------------------|--------------------------------------------|
| id                   | uuid        | PK, DEFAULT gen_random_uuid() |                                        |
| title                | text        | NOT NULL                  | Título do tema                             |
| year                 | integer     | nullable                  | Ano ENEM de referência; null = tema novo   |
| motivational_texts   | jsonb       | NOT NULL, DEFAULT '[]'    | Array de `{type, source, content/url}`     |
| active               | boolean     | NOT NULL, DEFAULT true    |                                            |
| created_at           | timestamptz | NOT NULL, DEFAULT now()   |                                            |
| updated_at           | timestamptz | NOT NULL, DEFAULT now()   |                                            |

**Estrutura de `motivational_texts`:**
```json
[
  { "type": "text",  "source": "Folha de S.Paulo, 2023", "content": "..." },
  { "type": "image", "source": "IBGE, 2022",             "url": "https://..." },
  { "type": "chart", "source": "...",                    "url": "https://..." }
]
```

---

### `essays`

Redações enviadas pelos usuários.

| Coluna           | Tipo              | Restrições                         | Descrição                                      |
|------------------|-------------------|------------------------------------|------------------------------------------------|
| id               | uuid              | PK, DEFAULT gen_random_uuid()      |                                                |
| user_id          | uuid              | NOT NULL, FK → profiles.id         | ON DELETE CASCADE                              |
| topic_id         | uuid              | NOT NULL, FK → essay_topics.id     | ON DELETE RESTRICT                             |
| content          | text              | NOT NULL                           | Corpo da redação (modalidade text)             |
| storage_url      | text              | nullable                           | Path no Supabase Storage (modalidade pdf/photo)|
| modality         | essay_modality    | NOT NULL, DEFAULT 'text'           |                                                |
| word_count       | integer           | nullable                           | Calculado no envio                             |
| credit_consumed  | boolean           | NOT NULL, DEFAULT false            | Flag para controle de estorno                  |
| status           | essay_status      | NOT NULL, DEFAULT 'pending'        |                                                |
| created_at       | timestamptz       | NOT NULL, DEFAULT now()            |                                                |
| updated_at       | timestamptz       | NOT NULL, DEFAULT now()            | Atualizado a cada mudança de status            |

---

### `essay_corrections`

Resultado da correção gerada pela IA. Relação 1:1 com `essays`.

| Coluna        | Tipo        | Restrições                                    | Descrição                                         |
|---------------|-------------|-----------------------------------------------|---------------------------------------------------|
| id            | uuid        | PK, DEFAULT gen_random_uuid()                 |                                                   |
| essay_id      | uuid        | NOT NULL, FK → essays.id, UNIQUE, ON DELETE CASCADE | UNIQUE garante no máximo uma correção por redação |
| c1            | smallint    | NOT NULL, CHECK IN (0,40,80,120,160,200)      | Domínio da norma culta                            |
| c2            | smallint    | NOT NULL, CHECK IN (0,40,80,120,160,200)      | Compreensão do tema                               |
| c3            | smallint    | NOT NULL, CHECK IN (0,40,80,120,160,200)      | Seleção e organização de informações              |
| c4            | smallint    | NOT NULL, CHECK IN (0,40,80,120,160,200)      | Mecanismos linguísticos                           |
| c5            | smallint    | NOT NULL, CHECK IN (0,40,80,120,160,200)      | Proposta de intervenção                           |
| total_score   | smallint    | **GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED** | Calculado automaticamente; nunca editável       |
| feedback      | jsonb       | NOT NULL                                      | Output completo do Groq (feedbacks, pontos, comentário geral) |
| ai_model      | text        | NOT NULL                                      | Ex: `llama3-70b-8192`                             |
| tokens_used   | integer     | nullable                                      | Para monitorar custo Groq                         |
| created_at    | timestamptz | NOT NULL, DEFAULT now()                       |                                                   |

**Estrutura de `feedback`:**
```json
{
  "competencies": {
    "c1": { "score": 160, "feedback": "..." },
    "c2": { "score": 200, "feedback": "..." },
    "c3": { "score": 120, "feedback": "..." },
    "c4": { "score": 160, "feedback": "..." },
    "c5": { "score": 80,  "feedback": "..." }
  },
  "general_comment": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
```

---

### `subscriptions`

Ciclo de vida das assinaturas de plano Pro/School. Tabela canônica para verificar se um plano pago está ativo.

| Coluna                 | Tipo                | Restrições                     | Descrição                                         |
|------------------------|---------------------|--------------------------------|---------------------------------------------------|
| id                     | uuid                | PK, DEFAULT gen_random_uuid()  |                                                   |
| user_id                | uuid                | NOT NULL, FK → profiles.id, UNIQUE | UNIQUE: um usuário tem no máximo uma assinatura ativa |
| asaas_subscription_id  | text                | NOT NULL, UNIQUE               | ID da assinatura no Asaas                         |
| plan                   | plan_type           | NOT NULL                       | `pro` ou `school`                                 |
| status                 | subscription_status | NOT NULL                       |                                                   |
| amount                 | numeric(10,2)       | NOT NULL                       | Valor da recorrência em BRL                       |
| billing_cycle          | text                | NOT NULL                       | `monthly` \| `yearly`                              |
| next_billing_date      | date                | nullable                       | Preenchido pelo webhook de renovação              |
| cancelled_at           | timestamptz         | nullable                       |                                                   |
| created_at             | timestamptz         | NOT NULL, DEFAULT now()        |                                                   |
| updated_at             | timestamptz         | NOT NULL, DEFAULT now()        |                                                   |

---

### `asaas_payments`

Registro de transações financeiras via Asaas (créditos avulsos e mensalidades de assinatura).
O prefixo `asaas_` é intencional: torna o acoplamento ao provedor explícito e preserva espaço para outros provedores de pagamento no futuro sem ambiguidade de nome.

| Coluna                 | Tipo            | Restrições                   | Descrição                                        |
|------------------------|-----------------|------------------------------|--------------------------------------------------|
| id                     | uuid            | PK, DEFAULT gen_random_uuid()|                                                  |
| user_id                | uuid            | NOT NULL, FK → profiles.id   | ON DELETE CASCADE                                |
| asaas_payment_id       | text            | NOT NULL, UNIQUE             | UNIQUE: garante idempotência de webhooks         |
| asaas_subscription_id  | text            | nullable                     | Presente quando tipo = subscription              |
| amount                 | numeric(10,2)   | NOT NULL                     | Valor em BRL                                     |
| description            | text            | nullable                     | Ex: "Pacote Básico — 15 créditos"                |
| status                 | payment_status  | NOT NULL, DEFAULT 'pending'  |                                                  |
| type                   | payment_type    | NOT NULL                     |                                                  |
| created_at             | timestamptz     | NOT NULL, DEFAULT now()      |                                                  |
| updated_at             | timestamptz     | NOT NULL, DEFAULT now()      |                                                  |

---

### `credit_wallets`

Carteira de créditos de cada usuário. Uma linha por usuário (UNIQUE `user_id`).
Criada automaticamente pelo trigger `on_profile_created` a cada novo cadastro.

| Coluna               | Tipo        | Restrições                                                       | Descrição                                                       |
|----------------------|-------------|------------------------------------------------------------------|-----------------------------------------------------------------|
| id                   | uuid        | PK, DEFAULT gen_random_uuid()                                    |                                                                 |
| user_id              | uuid        | NOT NULL, FK → auth.users.id, UNIQUE                             | ON DELETE CASCADE                                               |
| credits_total        | integer     | NOT NULL, DEFAULT 0, CHECK >= 0                                  | Total de créditos concedidos no ciclo atual                     |
| credits_used         | integer     | NOT NULL, DEFAULT 0, CHECK >= 0                                  | Total consumido no ciclo atual                                  |
| credits_available    | integer     | **GENERATED ALWAYS AS (credits_total - credits_used) STORED**   | Saldo disponível; nunca negativo (garantido por CHECK)          |
| cycle_start          | timestamptz | nullable                                                         | Início do ciclo Pro. NULL para plano Free                       |
| cycle_end            | timestamptz | nullable                                                         | Fim do ciclo Pro. NULL para plano Free                          |
| source               | text        | NOT NULL, DEFAULT 'free_signup'                                  | Origem: `free_signup`, `pro_monthly`, `pro_yearly`, `school`    |
| created_at           | timestamptz | NOT NULL, DEFAULT now()                                          |                                                                 |
| updated_at           | timestamptz | NOT NULL, DEFAULT now()                                          | Atualizado via trigger                                          |

**CHECK de integridade:** `credits_total >= 0 AND credits_used >= 0 AND credits_used <= credits_total`

**Nota:** `profiles.credits` é mantido por compatibilidade mas não é a fonte canônica de créditos — `credit_wallets.credits_available` é.

---

### `credit_transactions`

Log imutável de cada movimentação de crédito. Nunca deletado ou atualizado.

| Coluna           | Tipo        | Restrições                                            | Descrição                                                        |
|------------------|-------------|-------------------------------------------------------|------------------------------------------------------------------|
| id               | uuid        | PK, DEFAULT gen_random_uuid()                         |                                                                  |
| user_id          | uuid        | NOT NULL, FK → auth.users.id                          | ON DELETE CASCADE                                                |
| essay_id         | uuid        | nullable, FK → essays.id                             | ON DELETE SET NULL. Preenchido apenas para consume/refund        |
| amount           | integer     | NOT NULL                                              | Quantidade movimentada (sempre positivo; direção pelo type)      |
| transaction_type | text        | NOT NULL, CHECK IN (grant, consume, refund, adjustment)| Tipo da movimentação                                            |
| reason           | text        | NOT NULL                                              | Ex: `free_signup`, `essay_correction`, `ai_error_refund`        |
| created_at       | timestamptz | NOT NULL, DEFAULT now()                               |                                                                  |

**Efeito de cada `transaction_type` na wallet:**

| Tipo         | Efeito em `credit_wallets`          | Quando usar                                   |
|--------------|-------------------------------------|-----------------------------------------------|
| `grant`      | `credits_total += amount`           | Cadastro, renovação Pro, compra avulsa        |
| `consume`    | `credits_used += 1`                 | Submissão de redação aceita                   |
| `refund`     | `credits_used -= 1` (mín. 0)       | Falha da IA, cancelamento antes do início     |
| `adjustment` | Definido manualmente                | Correção administrativa                       |

---

### `webhook_logs`

Log de todos os webhooks recebidos do Asaas. Base para idempotência e auditoria.

| Coluna          | Tipo        | Restrições                     | Descrição                                         |
|-----------------|-------------|--------------------------------|---------------------------------------------------|
| id              | uuid        | PK, DEFAULT gen_random_uuid()  |                                                   |
| event           | text        | NOT NULL                       | Ex: `PAYMENT_CONFIRMED`, `SUBSCRIPTION_CANCELLED` |
| asaas_event_id  | text        | UNIQUE, nullable               | ID único do evento no Asaas; base para idempotência |
| payload         | jsonb       | NOT NULL                       | Payload bruto recebido                            |
| processed       | boolean     | NOT NULL, DEFAULT false        |                                                   |
| processed_at    | timestamptz | nullable                       |                                                   |
| error_message   | text        | nullable                       | Mensagem de erro se o processamento falhou        |
| created_at      | timestamptz | NOT NULL, DEFAULT now()        |                                                   |

---

## Relacionamentos

```
auth.users
    └── profiles (1:1, trigger on insert)
            ├── credit_wallets (1:1, trigger on profiles insert)
            │       └── credit_transactions (1:N, via user_id)
            ├── essays (1:N)
            │       ├── essay_corrections (1:1, UNIQUE essay_id)
            │       └── credit_transactions (N:1, via essay_id — nullable)
            ├── subscriptions (1:1 — um ativo por vez)
            └── asaas_payments (1:N)
                    └── subscriptions (N:1, via asaas_subscription_id)

essay_topics
    └── essays (1:N, ON DELETE RESTRICT)

webhook_logs
    (tabela independente — log de entrada de webhooks)
```

---

## Regra de acesso por plano

**Decisão do arquiteto (2026-04-25):**

| Plano  | Regra de acesso                                                          |
|--------|--------------------------------------------------------------------------|
| `free` | Verificar `profiles.credits > 0`; decrementar atomicamente no envio      |
| `pro`  | Verificar existência de `subscriptions` com `status = 'active'` para o user; ignorar `credits` |
| `school` | Idem `pro` — baseado em assinatura ativa                              |

**Query de autorização para envio de redação:**

```sql
-- Verificação atômica (nunca ler e depois atualizar em etapas separadas)
SELECT
  CASE
    WHEN p.plan IN ('pro', 'school')
      AND EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.user_id = p.id AND s.status = 'active'
      )
    THEN true
    WHEN p.plan = 'free' AND p.credits > 0
    THEN true
    ELSE false
  END AS authorized
FROM profiles p
WHERE p.id = $user_id;

-- Se authorized = true, decrementar crédito apenas para usuários free:
UPDATE profiles
SET credits = credits - 1
WHERE id = $user_id AND plan = 'free' AND credits > 0
RETURNING credits;
```

---

## Índices recomendados para o MVP

```sql
CREATE INDEX idx_essays_user_id          ON essays(user_id);
CREATE INDEX idx_essays_status           ON essays(status);
CREATE INDEX idx_essays_user_created     ON essays(user_id, created_at DESC);
CREATE INDEX idx_essay_corrections_essay ON essay_corrections(essay_id);
CREATE INDEX idx_asaas_payments_user_id  ON asaas_payments(user_id);
CREATE INDEX idx_subscriptions_user_id   ON subscriptions(user_id);
CREATE INDEX idx_webhook_logs_event_id   ON webhook_logs(asaas_event_id);
```

---

## Políticas RLS

| Tabela              | SELECT                        | INSERT / UPDATE / DELETE                   |
|---------------------|-------------------------------|---------------------------------------------|
| `profiles`          | Próprio usuário               | Próprio usuário; `service_role` irrestrito  |
| `essay_topics`      | Qualquer usuário autenticado  | Apenas `admin` role                         |
| `essays`            | Próprio usuário               | Próprio usuário                             |
| `essay_corrections` | Próprio usuário (via essay_id)| Apenas `service_role`                       |
| `subscriptions`     | Próprio usuário               | Apenas `service_role`                       |
| `asaas_payments`    | Próprio usuário               | Apenas `service_role`                       |
| `webhook_logs`      | Apenas `service_role`         | Apenas `service_role`                       |
| `credit_wallets`    | Próprio usuário               | Apenas funções SECURITY DEFINER             |
| `credit_transactions` | Próprio usuário             | Apenas funções SECURITY DEFINER             |

---

## Ordem de criação das migrations

```
001_create_enums.sql
002_create_profiles.sql             ← trigger on auth.users → profiles
003_create_essay_topics.sql
004_create_essays.sql
005_create_essay_corrections.sql
006_create_subscriptions.sql
007_create_asaas_payments.sql
008_create_webhook_logs.sql
009_create_indexes.sql
010_create_rls_policies.sql
011_add_essay_topics_free_description.sql
012_create_credit_system.sql        ← credit_wallets, credit_transactions, funções, trigger, backfill
```

---

## Escopo desta spec

Modelo de dados completo para o MVP. SQL das migrations será escrito na task de setup do banco.

## Fora de escopo

- Migrations SQL concretas — task futura
- Procedures de auditoria / soft delete — versão futura
- Particionamento de tabelas — versão futura
