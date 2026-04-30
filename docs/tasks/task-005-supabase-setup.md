# Task 005 — Supabase Setup e Aplicação das Migrations

**Status:** guia criado — execução manual pendente  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.4, task-004

---

## Objetivo

Conectar o projeto Reda1000 a um projeto Supabase real e aplicar as 10 migrations criadas na task-004.

---

## Pré-requisitos verificados

| Item | Status |
|---|---|
| Supabase CLI (via npx) | ✅ v2.95.3 disponível |
| `supabase/migrations/` (10 arquivos) | ✅ criados na task-004 |
| `supabase/config.toml` | ✅ criado nesta task |
| `apps/web/.env.example` | ✅ criado nesta task |

---

## Passo 1 — Criar o projeto no Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard) e faça login.
2. Clique em **New project**.
3. Preencha:
   - **Name:** `reda1000` (ou o nome que preferir)
   - **Database Password:** gere uma senha forte e **anote em local seguro** — você precisará dela para operações de banco via CLI.
   - **Region:** escolha a mais próxima dos seus usuários (ex: `South America (São Paulo)`).
4. Aguarde o provisionamento (cerca de 1 minuto).

---

## Passo 2 — Obter as chaves do projeto

No Supabase Dashboard, acesse **Settings → API**:

| Variável | Onde encontrar | Uso |
|---|---|---|
| **Project URL** | Campo "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** | Tabela "Project API keys" → linha `anon` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** | Tabela "Project API keys" → linha `service_role` | ⚠️ Somente backend — **nunca no frontend** |

> **Atenção — service_role:**
> A chave `service_role` bypassa completamente o RLS. Se exposta no frontend (via `NEXT_PUBLIC_`), qualquer usuário pode ler e modificar qualquer dado do banco.
> Ela só deve aparecer em variáveis de ambiente **sem** o prefixo `NEXT_PUBLIC_`, e apenas em contextos de servidor (API Routes, funções serverless, scripts de admin).

---

## Passo 3 — Configurar apps/web/.env.local

```bash
# Na raiz do projeto
cp apps/web/.env.example apps/web/.env.local
```

Abra `apps/web/.env.local` e preencha:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<seu-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # chave anon public
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Confirme que `.env.local` está no `.gitignore` de `apps/web` antes de continuar:

```bash
grep ".env.local" apps/web/.gitignore
# deve retornar: .env*.local
```

---

## Passo 4 — Autenticar na CLI do Supabase

```bash
# Na raiz do projeto reda1000/
npx supabase login
```

O comando abrirá o navegador para autenticação OAuth com a conta do Supabase Dashboard. Após autorizar, o token é salvo localmente (`~/.supabase/access-token`).

---

## Passo 5 — Vincular ao projeto remoto

Obtenha o **Project Ref** na URL do Dashboard:
`https://supabase.com/dashboard/project/<project-ref>`

```bash
# Na raiz do projeto reda1000/
npx supabase link --project-ref <project-ref>
```

A CLI solicitará a **Database Password** definida no Passo 1.

Após isso, a CLI sabe qual projeto remoto corresponde a este diretório local. O vínculo é salvo em `supabase/.temp/` (ignorado pelo git).

---

## Passo 6 — Conferir as migrations com dry-run

**Execute este passo antes do push real.** O `--dry-run` mostra exatamente o que será aplicado sem alterar nada no banco.

```bash
# Na raiz do projeto reda1000/
npx supabase db push --dry-run
```

Saída esperada: lista das 10 migrations que serão aplicadas em ordem. Verifique se todas aparecem sem erros.

```
Applying migration 20260425000001_create_enums.sql...        (dry run)
Applying migration 20260425000002_create_profiles.sql...     (dry run)
Applying migration 20260425000003_create_essay_topics.sql... (dry run)
Applying migration 20260425000004_create_essays.sql...       (dry run)
Applying migration 20260425000005_create_essay_corrections.sql... (dry run)
Applying migration 20260425000006_create_subscriptions.sql... (dry run)
Applying migration 20260425000007_create_asaas_payments.sql... (dry run)
Applying migration 20260425000008_create_webhook_logs.sql... (dry run)
Applying migration 20260425000009_create_indexes.sql...      (dry run)
Applying migration 20260425000010_create_rls_policies.sql... (dry run)
```

Se alguma migration falhar no dry-run, corrija antes de prosseguir.

---

## Passo 7 — Aplicar as migrations

**Somente após revisar o dry-run e confirmar que está tudo correto:**

```bash
# Na raiz do projeto reda1000/
npx supabase db push
```

A CLI aplicará as 10 migrations em ordem. Ao final, valide no Dashboard:

1. Acesse **Table Editor** — as 7 tabelas devem aparecer.
2. Acesse **Database → Enums** — os 7 enums devem aparecer.
3. Acesse **Authentication → Policies** — as 14 políticas RLS devem aparecer.
4. Acesse **Database → Functions** — `set_updated_at`, `handle_new_user`, `is_admin` devem aparecer.

---

## Verificações pós-migração recomendadas

### Testar o trigger de criação de profile

No Supabase Dashboard → **Authentication → Users**, crie um usuário de teste manualmente. Em seguida, no **SQL Editor**:

```sql
SELECT id, full_name, role, plan, credits
FROM public.profiles
ORDER BY created_at DESC
LIMIT 1;
```

Deve retornar 1 linha com `role = 'student'`, `plan = 'free'`, `credits = 3`.

### Confirmar total_score como coluna gerada

```sql
SELECT column_name, generation_expression
FROM information_schema.columns
WHERE table_name = 'essay_corrections'
  AND column_name = 'total_score';
```

Deve retornar a expressão `(c1 + c2 + c3 + c4 + c5)`.

### Confirmar RLS habilitado

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas as 7 tabelas devem ter `rowsecurity = true`.

---

## Diagrama de variáveis de ambiente por contexto

```
┌─────────────────────────────────────────────────────────────┐
│  Variáveis permitidas no Frontend (apps/web)                │
│                                                             │
│  NEXT_PUBLIC_SUPABASE_URL        → cliente anônimo         │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY   → cliente anônimo         │
│  NEXT_PUBLIC_APP_URL             → redirects de auth       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Variáveis exclusivas do Backend (API Routes / server)      │
│                                                             │
│  SUPABASE_SERVICE_ROLE_KEY  → bypassa RLS; só no servidor  │
│  SUPABASE_JWT_SECRET        → validação de tokens          │
│  GROQ_API_KEY               → chamadas ao LLM              │
│  ASAAS_API_KEY              → integração de pagamentos     │
└─────────────────────────────────────────────────────────────┘
```

> **Regra:** se a variável começa com `NEXT_PUBLIC_`, ela é exposta ao navegador. Nunca coloque chaves secretas com esse prefixo.

---

## Estrutura final após esta task

```
reda1000/
├── supabase/
│   ├── config.toml                  ← novo (config da CLI)
│   └── migrations/
│       ├── 20260425000001_create_enums.sql
│       ├── 20260425000002_create_profiles.sql
│       ├── 20260425000003_create_essay_topics.sql
│       ├── 20260425000004_create_essays.sql
│       ├── 20260425000005_create_essay_corrections.sql
│       ├── 20260425000006_create_subscriptions.sql
│       ├── 20260425000007_create_asaas_payments.sql
│       ├── 20260425000008_create_webhook_logs.sql
│       ├── 20260425000009_create_indexes.sql
│       └── 20260425000010_create_rls_policies.sql
└── apps/web/
    ├── .env.example                 ← novo (template de variáveis)
    └── .env.local                   ← a criar manualmente (nunca commitar)
```

---

## Critérios de aceite

- [x] Supabase CLI disponível via npx (v2.95.3)
- [x] `supabase/config.toml` criado
- [x] `apps/web/.env.example` criado com variáveis `NEXT_PUBLIC_`
- [x] Guia documentado com todos os passos
- [x] Separação clara entre chaves públicas e service_role
- [x] Frontend não conectado ao Supabase
- [x] `db push` não executado (aguarda ação manual do usuário)
- [ ] Projeto criado no Supabase Dashboard ← **ação manual do usuário**
- [ ] `.env.local` preenchido ← **ação manual do usuário**
- [ ] `supabase login` executado ← **ação manual do usuário**
- [ ] `supabase link` executado ← **ação manual do usuário**
- [ ] `supabase db push --dry-run` revisado ← **ação manual do usuário**
- [ ] `supabase db push` executado ← **ação manual do usuário**

---

## Próxima task sugerida

**Task 006 — Cliente Supabase tipado em apps/web**
- Instalar `@supabase/ssr` e `@supabase/supabase-js`
- Criar `apps/web/lib/supabase/client.ts` (cliente browser)
- Criar `apps/web/lib/supabase/server.ts` (cliente server-side com cookies)
- Criar `apps/web/types/database.types.ts` via `supabase gen types typescript`
- Configurar middleware Next.js para refresh de sessão
