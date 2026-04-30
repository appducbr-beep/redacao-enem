# Task 009 — Sistema de Temas de Redação

**Status:** concluída  
**Data:** 2026-04-26  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 04 v0.2, task-008

---

## Objetivo

Implementar o sistema de temas de redação com acesso diferenciado Free/Pro:
- Listagem de temas em `/temas`
- Detalhe do tema em `/temas/[id]`
- Temas Pro bloqueados visualmente para usuários Free
- Seed com 6 temas ENEM de exemplo

---

## Divergências encontradas no banco

| Campo esperado | Situação encontrada | Resolução |
|---|---|---|
| `is_free` | **Ausente** | Migration 011 criada |
| `description` | **Ausente** | Migration 011 criada |
| `textos_motivadores` | Spec 04 v0.1 usava nome em português | Banco usa `motivational_texts` (inglês) — spec corrigida na v0.2 |
| `tipo/fonte/conteudo` | Spec 04 v0.1 usava nomes em português no JSONB | Banco usa `type/source/content` (inglês) — spec corrigida na v0.2 |

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `supabase/migrations/20260426000011_add_essay_topics_free_description.sql` | criado | Adiciona `is_free boolean NOT NULL DEFAULT true` e `description text` |
| `supabase/seeds/001_essay_topics.sql` | criado | 6 temas ENEM com textos motivadores (3 Free, 3 Pro) |
| `apps/web/components/TopicCard.tsx` | criado | Card de tema: título, ano, badge, descrição, botão "Ver tema" ou "Ver planos" |
| `apps/web/app/temas/page.tsx` | criado | Listagem de temas — Server Component, busca plan do perfil |
| `apps/web/app/temas/[id]/page.tsx` | criado | Detalhe do tema — acesso controlado por is_free vs. plan |
| `apps/web/app/page.tsx` | alterado | Home simplificada — exibe plano do usuário + CTA "Ver temas" |
| `docs/specs/04-temas-redacao.md` | alterado | v0.2: novos campos, regras Free/Pro, correção do JSONB |

---

## Migration aplicada

```sql
-- Migration 011 — deve ser aplicada antes do seed
ALTER TABLE public.essay_topics
  ADD COLUMN IF NOT EXISTS is_free     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS description TEXT;
```

**Como aplicar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Execute o conteúdo de `supabase/migrations/20260426000011_add_essay_topics_free_description.sql`

---

## Seed SQL

**Conteúdo:** 6 temas ENEM (2020–2024 + 1 tema novo sem ano)

| Título | Ano | is_free |
|---|---|---|
| O estigma associado às doenças mentais | 2020 | true |
| Invisibilidade e registro civil | 2021 | true |
| Valorização de povos tradicionais | 2022 | true |
| Violência contra povos indígenas | 2023 | false |
| Invisibilidade do trabalho de cuidado da mulher | 2024 | false |
| Inteligência Artificial e ética | null | false |

**Como aplicar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Execute `supabase/seeds/001_essay_topics.sql`
3. O seed é idempotente (`ON CONFLICT (id) DO NOTHING`)

**Atenção:** A migration 011 deve ser aplicada antes do seed (os campos `is_free` e `description` precisam existir).

---

## Lógica de acesso Free/Pro

```
accessible = topic.is_free || (plan === 'pro' || plan === 'school')
```

- **RLS:** não filtra por plan. Todos os autenticados veem todos os temas ativos. Isso é intencional para que temas Pro apareçam bloqueados (não invisíveis) para usuários Free.
- **Aplicação:** `profiles.plan` é lido no Server Component. Se `!accessible`, a página de detalhe mostra tela de bloqueio com CTA Pro.
- **Fonte do plan:** `profiles.plan` (desnormalizado). Não consulta `subscriptions` nesta task.

---

## Como testar

### Pré-requisito: migrations e seed aplicados

Execute no SQL Editor do Supabase Dashboard, nesta ordem:
1. `supabase/migrations/20260426000011_add_essay_topics_free_description.sql`
2. `supabase/seeds/001_essay_topics.sql`

### Cenários

| Cenário | Resultado esperado |
|---|---|
| Não autenticado acessa `/temas` | Redirect para `/login` |
| Não autenticado acessa `/temas/[id]` | Redirect para `/login` |
| Free acessa `/temas` | Lista 6 temas; 3 com "Ver tema", 3 com "Ver planos" |
| Free acessa URL de tema Pro diretamente | Tela de bloqueio com "Ver planos" |
| Free acessa URL de tema gratuito | Exibe textos motivadores + "Começar redação" (desabilitado) |
| Pro acessa `/temas` | Todos os 6 temas com "Ver tema" |
| Pro acessa qualquer detalhe | Exibe textos motivadores normalmente |
| ID de tema inexistente | Página 404 (notFound) |

### Rodar o servidor

```bash
cd apps/web
npm run dev
# Acesse http://localhost:3000
```

---

## Limitações conhecidas

1. **Botão "Começar redação" desabilitado** — envio de redação é Task 010+
2. **Rota `/planos` não existe** — link "Ver planos" aponta para rota ainda não implementada
3. **Sem filtro/busca** — a listagem exibe todos os temas sem filtro por ano ou texto
4. **Plan lido de `profiles.plan`** — não valida `subscriptions.status`. Um usuário cujo plano foi cancelado mas `profiles.plan` ainda está como `'pro'` teria acesso indevido até o webhook atualizar o campo
5. **Sem paginação** — listagem retorna todos os temas de uma vez; adequado enquanto o volume for pequeno

---

## Próxima task sugerida

**Task 010 — Envio de Redação**
- Criar página `/redacoes/nova?tema=<id>`
- Formulário de texto para a redação
- Verificar créditos disponíveis antes de aceitar envio
- Salvar em `essays` com status `pending`
- Encaminhar para pipeline de correção (Task 011)
