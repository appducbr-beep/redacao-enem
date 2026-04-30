# Task 017 — Dashboard do Aluno

**Status:** concluída  
**Data:** 2026-04-29  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Transformar `app/page.tsx` na home/dashboard principal do aluno, exibindo saudação, banner motivacional, ações rápidas, resumo de desempenho e últimas redações.

---

## Estrutura da página

```
1. Greeting — "Olá, [nome]!" + LogoutButton
2. Banner motivacional — gradiente azul escuro, texto branco
3. Cards de ação rápida — Nova redação / Histórico / Evolução (em breve)
4. Card "Seu desempenho" — nota média, total de redações, créditos
5. Últimas redações — lista das 5 mais recentes com status, nota e link
```

---

## Estado não logado

Landing simples com:
- Título "Reda1000"
- Headline: "Treine redação para o ENEM com feedback imediato"
- Subtítulo e dois botões: "Entrar" → /login | "Criar conta grátis" → /register

---

## Componentes criados

| Componente | Localização | Responsabilidade |
|---|---|---|
| `DashboardActionCard` | `components/dashboard/DashboardActionCard.tsx` | Card clicável com ícone, título, descrição, badge opcional "em breve" |
| `DashboardStatsCard` | `components/dashboard/DashboardStatsCard.tsx` | Painel com nota média, total de redações e créditos disponíveis |
| `RecentEssaysTable` | `components/dashboard/RecentEssaysTable.tsx` | Lista das últimas 5 redações com status, nota, link; estado vazio |

Todos são Server Components (sem `'use client'`).

---

## Dados consultados (3 queries em paralelo)

```typescript
// 1. Nome do perfil
supabase.from('profiles').select('full_name').eq('id', user.id).single()

// 2. Créditos
supabase.from('credit_wallets').select('credits_available').eq('user_id', user.id).single()

// 3. Redações com tópico e correção — limit 50, count total
supabase
  .from('essays')
  .select(
    'id, status, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)',
    { count: 'exact' }
  )
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50)
```

`count: 'exact'` retorna o total real de redações do usuário (ignora o limit), garantindo contagem precisa mesmo acima de 50.

---

## Cálculo de nota média

Computed no Server Component a partir dos últimos 50 essays com status `done` e `total_score != null`.

Fallback de `total_score`: se o campo for 0 ou null, soma `c1+c2+c3+c4+c5`.

Se não houver nenhuma redação corrigida, exibe "—".

---

## Rotas conectadas

| Ação | Destino |
|---|---|
| "Nova redação" | `/temas` |
| "Histórico" | `/redacoes` |
| "Evolução" | `/redacoes` (temporário, marcado "em breve") |
| "Ver resultado" | `/redacoes/[id]` |
| "Abrir" (outros status) | `/redacoes/[id]` |
| "Ver todas →" | `/redacoes` |
| "Escrever primeira redação →" | `/temas` (empty state) |

---

## Arquivos alterados/criados

| Arquivo | Mudança |
|---|---|
| `app/page.tsx` | Reescrito — dashboard completo + landing para não logados |
| `components/dashboard/DashboardActionCard.tsx` | criado |
| `components/dashboard/DashboardStatsCard.tsx` | criado |
| `components/dashboard/RecentEssaysTable.tsx` | criado |

---

## Como testar

1. `npm run dev` → acessar `/`
2. **Não logado:** verificar landing com headline e dois botões
3. **Logado:** verificar saudação com primeiro nome (ou e-mail fallback)
4. Verificar banner azul escuro
5. Verificar 3 cards de ação rápida — "Evolução" com badge "em breve"
6. Verificar stats: nota média colorida, total de redações, créditos
7. Verificar lista das últimas 5 redações com badge de status e nota
8. Clicar "Ver resultado" → vai para `/redacoes/[id]`
9. Clicar "Histórico" → vai para `/redacoes`
10. Sem redações: empty state com link para `/temas`

---

## Limitações conhecidas

1. **Nota média:** calculada sobre os últimos 50 essays buscados — usuários com mais de 50 redações terão média parcial (improvável na fase atual)
2. **Evolução:** card "📈 Evolução" aponta para `/redacoes` com badge "em breve" — gráfico de evolução não implementado
3. **Plano:** campo `plan` da tabela `profiles` não é exibido no dashboard (removido da home anterior) — pode ser retomado em uma task de perfil do usuário
