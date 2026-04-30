# Task 016 — Página de Histórico de Redações

**Status:** concluída  
**Data:** 2026-04-29  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Criar rota `/redacoes` onde o aluno visualiza, filtra e acessa suas redações anteriores.

---

## Estrutura da página

```
1. Header — "Minhas redações" + subtítulo
2. Filtros — pílulas: Todos / Corrigidas / Processando / Com erro
3. Lista — EssayListItem por redação
4. Empty state — mensagem + link para /temas (se nenhuma redação)
```

---

## Componentes criados

| Componente | Localização | Responsabilidade |
|---|---|---|
| `RedacoesPage` | `app/redacoes/page.tsx` | Server Component — auth, fetch, normalização |
| `EssayHistoryList` | `components/EssayHistoryList.tsx` | Client Component — filtro com useState |
| `EssayListItem` | `components/EssayListItem.tsx` | Display de uma redação (título, data, badge, nota, link) |

---

## Tipo compartilhado

`EssayItem` é exportado de `app/redacoes/page.tsx` e importado pelos componentes:

```typescript
export type EssayItem = {
  id: string
  status: string
  created_at: string
  topic_title: string
  total_score: number | null
}
```

---

## Query Supabase

```typescript
supabase
  .from('essays')
  .select('id, status, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20)
```

`total_score` fallback: se `total_score` for 0 ou null, soma `c1+c2+c3+c4+c5`.

---

## Decisões de design

### Status badges
- `done` → `bg-green-100 text-green-700` — "Corrigida"
- `processing` → `bg-yellow-100 text-yellow-700` — "Processando"
- `error` → `bg-red-100 text-red-700` — "Com erro"
- `pending` → `bg-slate-100 text-slate-600` — "Aguardando"

### Nota colorida (apenas status `done`)
- ≥800 → `text-green-700`
- ≥600 → `text-yellow-700`
- <600 → `text-red-700`

### Link "Abrir resultado →"
Exibido apenas para redações com `status === 'done'`.

### Filtro ativo
Pílula ativa: `bg-slate-800 text-white`; inativa: `bg-white text-slate-600 border-slate-200`.

---

## Arquivos criados

| Arquivo | Mudança |
|---|---|
| `app/redacoes/page.tsx` | criado |
| `components/EssayHistoryList.tsx` | criado |
| `components/EssayListItem.tsx` | criado |

---

## Como testar

1. `npm run dev` → acessar `/redacoes`
2. Verificar lista de redações com badge de status correto
3. Filtrar por "Corrigidas" → apenas `done` aparece
4. Filtrar por "Processando" → apenas `processing`
5. Clicar "Abrir resultado →" → redireciona para `/redacoes/[id]`
6. Sem redações → "Você ainda não enviou nenhuma redação." + link para /temas
