# Task 015 — Página de Resultado Premium

**Status:** concluída  
**Data:** 2026-04-29  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo de UX

A página deve responder em segundos:

1. Qual foi minha nota?
2. Estou indo bem ou mal?
3. Onde errei?
4. O que devo fazer agora?

---

## Estrutura da página (estado "done")

```
1. HERO — Nota total em círculo colorido + interpretação + tema + data + feedback geral
2. BARRAS — Notas C1–C5 com barras horizontais e cores por nível
3. PRIORIDADES — Lista numerada das 3 ações mais importantes
4. DETALHE — Cards individuais por competência
5. CTA — Botões "Nova redação" e "Refazer esta redação"
```

---

## Componentes criados

| Componente | Localização | Responsabilidade |
|---|---|---|
| `ScoreHero` | `components/result/ScoreHero.tsx` | Nota total, interpretação, meta e feedback geral |
| `CompetencyBar` | `components/result/CompetencyBar.tsx` | Barra horizontal por competência |
| `CompetencyCard` | `components/result/CompetencyCard.tsx` | Card completo de análise por competência |
| `RealErrorItem` | `components/result/RealErrorItem.tsx` | Exibição de erro gramatical com trecho e correção |
| `StyleImprovementItem` | `components/result/StyleImprovementItem.tsx` | Exibição de melhoria de estilo |
| `PriorityList` | `components/result/PriorityList.tsx` | Lista numerada de prioridades |

Todos são Server Components (sem `'use client'`).

---

## Decisões de design

### Hero score colorido
- `>= 800`: verde (`text-green-600`, `bg-green-50`, `ring-green-200`)
- `600–799`: amarelo (`text-yellow-600`, etc.)
- `< 600`: vermelho (`text-red-600`, etc.)

### Barras por competência
- 200 → `bg-green-600`
- 160 → `bg-green-400`
- 120 → `bg-yellow-400`
- 80 → `bg-orange-400`
- ≤40 → `bg-red-400`

### Regras de exibição em CompetencyCard
- `lost_points_reason`: somente se `score < 200`
- `structural_feedback`: somente se `>= 50 chars`
- `rubric_reasoning`: somente se `>= 20 chars`
- `style_improvements`: filtradas por `excerpt.length > 0` e `suggestion+example >= 40 chars`
- `real_errors`: vazio → "Nenhum erro gramatical relevante identificado."

### Fallback de total_score
Se o campo `total_score` for null ou 0 no banco, a página calcula `c1+c2+c3+c4+c5` como fallback.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `app/redacoes/[id]/page.tsx` | Redesign completo do estado "done"; estados processing/error/pending mantidos |
| `components/result/ScoreHero.tsx` | criado |
| `components/result/CompetencyBar.tsx` | criado |
| `components/result/CompetencyCard.tsx` | criado |
| `components/result/RealErrorItem.tsx` | criado (extraído do page.tsx anterior) |
| `components/result/StyleImprovementItem.tsx` | criado (extraído do page.tsx anterior) |
| `components/result/PriorityList.tsx` | criado (extraído do page.tsx anterior) |

---

## Como testar

1. `npm run dev` → enviar redação → corrigir
2. Verificar:
   - Nota total no círculo colorido (verde/amarelo/vermelho)
   - 5 barras proporcionais com cor correta
   - Lista de 3 prioridades antes do detalhe
   - Cards expandidos com todas as seções
   - "Onde perdeu pontos" ausente nas competências com 200
   - "Nenhum erro..." quando real_errors vazio
3. Correção antiga (sem `rubric_reasoning`): seção "Por que essa nota?" não aparece, resto renderiza normalmente

---

## Refinamento visual (Task 015.1)

**Objetivo:** profundidade e hierarquia sem alterar lógica ou estrutura.

### Camadas visuais
```
bg-slate-50 (página)
  └── bg-white border border-slate-200 shadow-sm (cards)
        └── bg-purple-50 / bg-blue-50 / bg-slate-50 (blocos internos)
```

### Mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| `page.tsx` | `bg-white` → `bg-slate-50`; `max-w-2xl` → `max-w-4xl`; barras section com `bg-white border-slate-200` |
| `ScoreHero.tsx` | Card com `bg-gradient-to-b from-white to-slate-50 border border-slate-200 shadow-md rounded-xl py-8`; textos para slate |
| `CompetencyBar.tsx` | Track: `bg-gray-100` → `bg-slate-200` |
| `CompetencyCard.tsx` | `border-slate-200 bg-white`; header `bg-slate-50`; badge `rounded-md`; análise estrutural em card `bg-purple-50 border border-purple-100`; reescrita em `bg-blue-50 border-l-4 border-blue-400`; dividers `divide-slate-100` |
| `PriorityList.tsx` | `shadow-sm` adicionado |

### Hierarquia de contraste resultante
```
Fundo da página:   bg-slate-50   (#f8fafc)
Cards:             bg-white      (#ffffff)  → contraste claro
Headers de card:   bg-slate-50   (#f8fafc)  → sutil
Blocos internos:
  estrutural:      bg-purple-50  (#faf5ff)
  reescrita:       bg-blue-50    (#eff6ff) + border-l-4 blue-400
  rubric:          bg-slate-50   (#f8fafc)
  erros:           bg-red-50     (via RealErrorItem)
  estilo:          bg-blue-50    (via StyleImprovementItem)
```

---

## Melhorias futuras possíveis

1. **Accordion nos cards** — colapsar seções longas para reduzir scroll
2. **Gráfico radar** — visualização radial das 5 competências
3. **Comparação com redação anterior** — "você melhorou X pontos em C3"
4. **Compartilhamento** — gerar imagem do resultado para redes sociais
5. **Download PDF** — resultado formatado para impressão
6. **"Refazer esta redação"** — lógica de pré-preenchimento do textarea com conteúdo anterior
