# Task 018 — Evolução do Aluno

**Status:** concluída  
**Data:** 2026-04-29  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Criar a página `/evolucao` onde o aluno visualiza seu progresso real ao longo das redações corrigidas, incluindo evolução da nota total, médias por competência e diagnóstico automático.

---

## Estrutura da página

```
1. Header — "Minha evolução" + subtítulo
2. Cards de resumo — média, melhor nota, total corrigidas, competência a focar
3. Diagnóstico rápido — banner colorido com mensagem contextual
4. Gráfico de evolução — SVG line chart com área preenchida
5. Média por competência — barras horizontais C1–C5
6. Melhores redações — top 3 por nota
```

---

## Componentes criados

| Componente | Localização | Responsabilidade |
|---|---|---|
| `EvolutionSummaryCards` | `components/evolution/EvolutionSummaryCards.tsx` | 4 cards: média, melhor nota, total, competência mais fraca |
| `ScoreEvolutionChart` | `components/evolution/ScoreEvolutionChart.tsx` | SVG puro — linha + área + pontos com score |
| `CompetencyAverageBars` | `components/evolution/CompetencyAverageBars.tsx` | Barras horizontais C1–C5 com médias |
| `BestEssaysList` | `components/evolution/BestEssaysList.tsx` | Top 3 redações por nota com link para resultado |

Todos são Server Components (sem `'use client'`).

---

## Query Supabase (1 query)

```typescript
supabase
  .from('essays')
  .select('id, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)')
  .eq('user_id', user.id)
  .eq('status', 'done')
  .order('created_at', { ascending: true })
```

Sem paginação — todos os ensaios corrigidos do usuário são carregados para cálculos precisos. Filtro por `status = 'done'` garante que apenas redações com correção são incluídas.

---

## Cálculos implementados

| Métrica | Cálculo |
|---|---|
| Média geral | `round(sum(total_score) / n)` |
| Melhor nota | `max(total_score)` |
| Total corrigidas | `count` de essays com correction válida |
| Médias C1–C5 | `round(sum(cN) / n)` para cada competência |
| Competência mais fraca | `min` das médias por competência |
| `total_score` fallback | Se `total_score` é 0, soma `c1+c2+c3+c4+c5` |

---

## Diagnóstico automático

| Condição | Mensagem |
|---|---|
| Média ≥ 900 | "Você está em nível avançado." — banner verde |
| 700 ≤ média < 900 | "Você está em evolução consistente." — banner azul |
| Média < 700 | "Há pontos importantes para fortalecer." — banner laranja |

Sempre indica a competência mais fraca no subtítulo.

---

## Gráfico SVG

- SVG puro, sem biblioteca externa
- `viewBox="0 0 540 200"` + `w-full` → responsivo
- Linha colorida baseada na nota da última redação (verde/amarelo/vermelho)
- Área preenchida com opacidade 6% (visual premium sem poluição)
- Labels de score exibidos: sempre em ≤10 pontos; somente primeiro e último em >10 pontos
- Exibe até as últimas 20 redações; se houver mais, exibe badge "últimas 20 redações"
- Se < 2 redações: placeholder "Corrija pelo menos duas redações..."

---

## Arquivos criados/alterados

| Arquivo | Mudança |
|---|---|
| `app/evolucao/page.tsx` | criado |
| `components/evolution/EvolutionSummaryCards.tsx` | criado |
| `components/evolution/ScoreEvolutionChart.tsx` | criado |
| `components/evolution/CompetencyAverageBars.tsx` | criado |
| `components/evolution/BestEssaysList.tsx` | criado |
| `app/page.tsx` | card "Evolução" atualizado: `/redacoes` → `/evolucao`, badge "em breve" removido |

---

## Como testar

1. `npm run dev` → acessar `/evolucao`
2. **Sem correções:** ver estado vazio + botão "Começar uma redação → /temas"
3. **1 correção:** gráfico mostra placeholder "Corrija pelo menos duas..."
4. **2+ correções:** gráfico com linha, pontos e área colorida
5. Verificar cards de resumo: médias, melhor nota, competência mais fraca
6. Verificar diagnóstico com cor correta para a faixa de média
7. Verificar barras C1–C5 proporcionais com cores por nível
8. Top 3 com link "Ver resultado" → `/redacoes/[id]`
9. Dashboard `/`: card "Evolução" agora aponta para `/evolucao`

---

## Limitações conhecidas

1. **Sem paginação:** todos os ensaios corrigidos são carregados. Para usuários com centenas de correções, pode ser lento. Limite prático: 100+ correções é incomum no estágio atual.
2. **Gráfico limitado a 20 pontos:** com >20 correções, apenas as 20 mais recentes aparecem no gráfico. Isso evita crowding visual. Os cálculos de média/melhor nota usam todos os dados.
3. **Sem gráfico de tendência:** apenas pontos individuais; sem regressão linear ou média móvel.
4. **Diagnóstico por regra simples:** não usa IA — baseado apenas na média geral e na competência mais fraca.
