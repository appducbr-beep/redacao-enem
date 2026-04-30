# Task 007 — Conexão Frontend com Supabase

**Status:** concluída  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.4, task-004, task-005

---

## Objetivo

Conectar o frontend Next.js ao Supabase e realizar a primeira leitura de dados reais via cliente browser.

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `apps/web/lib/supabaseClient.ts` | criado | Cliente browser (`createBrowserClient` do `@supabase/ssr`) |
| `apps/web/app/page.tsx` | alterado | Adicionado fetch de `essay_topics` com loading, erro e lista |
| `apps/web/package.json` | alterado | Adicionados `@supabase/ssr` e `@supabase/supabase-js` |

---

## Pacotes instalados

```bash
cd apps/web
npm install @supabase/ssr @supabase/supabase-js
```

| Pacote | Motivo |
|---|---|
| `@supabase/ssr` | Fornece `createBrowserClient` (e futuramente `createServerClient` para API Routes) |
| `@supabase/supabase-js` | Core do cliente Supabase; dependência par de `@supabase/ssr` |

---

## Lógica implementada

### `apps/web/lib/supabaseClient.ts`

Cria e exporta um cliente Supabase browser a partir das variáveis de ambiente públicas.
A função valida a presença das variáveis e lança um erro descritivo se ausentes — visível no estado de erro da página em vez de falhar silenciosamente.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas...')
  }

  return createBrowserClient(url, key)
}
```

### `apps/web/app/page.tsx`

Componente client (`'use client'`) que:
1. Inicializa estado: `topics`, `loading`, `error`
2. No `useEffect`, chama `fetchTopics()`:
   - Cria cliente com `createClient()`
   - Executa query na tabela `essay_topics`
   - Atualiza estado conforme resultado
3. Renderiza: spinner → lista de temas → "Nenhum tema disponível" → mensagem de erro

---

## Query usada

```typescript
const { data, error } = await supabase
  .from('essay_topics')
  .select('id, title, year')
  .eq('active', true)
  .order('created_at', { ascending: false })
```

- Filtra apenas temas com `active = true`
- Seleciona apenas os campos necessários (não `motivational_texts` que pode ser grande)
- Ordena do mais recente para o mais antigo

---

## Como testar

### Pré-requisito: `.env.local` configurado

```bash
# Se ainda não foi feito
cp apps/web/.env.example apps/web/.env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Rodar o servidor

```bash
cd apps/web
npm run dev
# Acesse http://localhost:3000
```

### Cenários de teste

| Cenário | Estado da tela |
|---|---|
| `.env.local` não preenchido | Erro: "Variáveis... não configuradas" |
| Tabela vazia | "Nenhum tema disponível" |
| Usuário não autenticado (sem auth ainda) | "Nenhum tema disponível" — RLS bloqueia (ver limitação abaixo) |
| Temas cadastrados + usuário autenticado | Lista de temas com título e ano |

---

## Limitação conhecida: RLS bloqueia leitura sem autenticação

A política RLS atual exige `auth.role() = 'authenticated'` para ler `essay_topics`:

```sql
create policy "essay_topics: authenticated see active"
  on public.essay_topics for select
  using (auth.role() = 'authenticated' and active = true);
```

Enquanto a autenticação não for implementada, o cliente anon retornará **0 linhas** (não um erro) — o que renderiza "Nenhum tema disponível". Isso é comportamento correto do PostgreSQL RLS.

**Opções para validar a query antes de implementar auth:**

**Opção A (recomendada para teste rápido):** Adicionar um tema via Supabase Dashboard com um usuário autenticado e conferir após implementar login.

**Opção B (teste temporário, reverter depois):** No SQL Editor do Dashboard, executar:
```sql
-- Adiciona leitura pública temporária (REVERTER antes de ir para produção)
CREATE POLICY "essay_topics: anon see active (temp)"
  ON public.essay_topics FOR SELECT
  USING (active = true);
```

**Opção C:** Inserir dados diretamente via SQL Editor e testar via Supabase Dashboard → Table Editor.

---

## Verificações realizadas

- [x] `npx tsc --noEmit` — sem erros TypeScript
- [x] `npm run lint` — sem erros ESLint
- [x] Alias `@/lib/supabaseClient` resolvido corretamente via tsconfig paths
- [x] Variável de ambiente validada com mensagem de erro descritiva
- [x] Todos os estados da UI cobertos: loading, erro, vazio, com dados
- [x] Sem service_role no frontend
- [x] Sem `NEXT_PUBLIC_` em chaves secretas
- [x] Nenhuma API Route criada
- [x] Banco de dados não modificado
- [x] RLS não alterado

---

## Próxima task sugerida

**Task 008 — Autenticação com Supabase Auth**
- Criar `apps/web/lib/supabase/server.ts` (cliente server-side com cookies)
- Criar middleware Next.js para refresh automático de sessão
- Implementar páginas `/login` e `/registro`
- Implementar proteção de rotas autenticadas
- Após auth: `essay_topics` passará a retornar dados reais
