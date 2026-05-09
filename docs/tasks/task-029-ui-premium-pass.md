# Task 029 — UI Premium Pass

**Branch:** v2-pre-lancamento  
**Data:** 2026-05-09  
**Status:** ✅ Concluída

---

## Objetivo

Elevar a percepção de valor e sensação de produto premium sem redesenhar o sistema do zero. Polimento visual em todas as páginas e componentes críticos.

---

## Princípios visuais adotados

| Princípio | Antes | Depois |
|---|---|---|
| Background de página | `bg-white` (temas, temas/[id]) | `bg-slate-50` consistente |
| Cards | `border-slate-200 rounded-xl` | `border-slate-100 rounded-2xl shadow-sm` |
| Hover em cards interativos | `hover:shadow-md` só | `hover:shadow-md hover:border-slate-200 transition-all duration-200` |
| Badges/pills | `rounded-md` | `rounded-full` (pills mais suaves) |
| Tipografia stat | `text-2xl font-bold` | `text-3xl font-bold tracking-tight tabular-nums` |
| Ícones de ação | Emoji solto `text-2xl` | Container `w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50` |
| Gradientes | `from-blue-900 to-blue-700` | `from-blue-950 via-blue-900 to-blue-800` (mais profundo) |
| Transitions | `transition-shadow` ou `transition-colors` | `transition-all duration-200` |

---

## Páginas alteradas

### `app/page.tsx` — Dashboard
- **Landing (não logado):** `bg-white` → `bg-slate-50`; botão principal reordenado (Criar conta > Entrar); adicionado ícone logo, tagline "Sem cartão de crédito"; CTA principal com `rounded-2xl shadow-sm`
- **Dashboard (logado):** banner motivacional com gradiente mais profundo (`from-blue-950`); radius `rounded-xl` → `rounded-2xl`; badges de cancelamento/créditos com radius atualizado

### `app/temas/page.tsx`
- `bg-white` → `bg-slate-50`
- Contadores de temas em pills visuais (`rounded-full bg-green-50 border border-green-100`)
- Empty state com emoji 📝
- Hover nas cores dos links

### `app/temas/[id]/page.tsx`
- `bg-white` → `bg-slate-50`
- Badges ENEM + Gratuito/Pro redesenhados como pills com borda
- Locked state: ícone 🔒, gradiente suave `from-blue-50 to-blue-100/50`, botão `rounded-xl shadow-sm`
- Textos motivadores: `rounded-xl bg-white shadow-sm` (separação visual do fundo)
- CTA "Começar redação": `rounded-2xl py-3.5 shadow-sm`

### `app/redacoes/page.tsx`
- Cor de back link: `text-gray-400` → `text-slate-400 transition-colors`
- Título: `text-slate-800` → `text-slate-900`

### `app/evolucao/page.tsx`
- Adicionado **"← Início"** no header (tela preenchida e vazia)
- Empty state: ícone 📈, descrição melhorada, CTA `rounded-2xl`
- Diagnosis block: `rounded-xl` → `rounded-2xl`

### `app/planos/page.tsx`
- Hero: `text-blue-700` → `text-blue-600`
- Differentials: ícones em containers `w-10 h-10 rounded-xl bg-white shadow-sm`; cards `rounded-2xl hover:border-slate-200`
- CTA final: `from-blue-950 via-blue-900 to-blue-800 shadow-xl`

### `app/perfil/page.tsx`
- Card de plano: `border-slate-200 rounded-xl` → `border-slate-100 rounded-2xl shadow-sm`
- "Plano atual" label: uppercase tracking-wider
- Badge "Ativo" em verde para usuários Pro
- Botão "Ver planos Pro": `rounded-xl shadow-sm`

### `app/redacoes/[id]/page.tsx`
- Card "Notas por competência": `rounded-xl border-slate-200` → `rounded-2xl border-slate-100`
- Header section: `text-gray-400` → `text-slate-400`

---

## Componentes alterados

### `components/dashboard/DashboardActionCard.tsx`
- Ícone em container `w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50`
- Hover: `hover:shadow-md hover:border-slate-200 transition-all duration-200`
- Radius: `rounded-xl` → `rounded-2xl`
- Border: `border-slate-200` → `border-slate-100`

### `components/dashboard/DashboardStatsCard.tsx`
- Cards internos: fundo colorido por contexto (`bg-green-50/yellow-50/red-50`) em vez de `bg-white`
- Números: `text-2xl` → `text-3xl tracking-tight`
- Radius: `rounded-xl` → `rounded-2xl border-slate-100`

### `components/dashboard/RecentEssaysTable.tsx`
- Hover nas linhas: `hover:bg-slate-50 transition-colors duration-150`
- Status badges: `rounded-md` → `rounded-full`
- Empty state com emoji ✍️
- Divisor: `divide-slate-100` → `divide-slate-50`
- Score: apenas número (sem `/1000`) para economizar espaço

### `components/TopicCard.tsx`
- **Temas acessíveis:** card inteiro clicável (`<Link>`) com hover `shadow-md`, título `group-hover:text-blue-700`, botão "Ver tema →" como texto inline
- **Temas bloqueados:** card opaco (`opacity-70`), ícone 🔒 no texto
- Radius: `rounded-xl` → `rounded-2xl`
- Border: `border-gray-100 bg-white` com `shadow-sm`

### `components/EssayListItem.tsx`
- `hover:shadow-md hover:border-slate-200 transition-all duration-200`
- Status badges: `rounded-md` → `rounded-full`
- Score: `tabular-nums` para alinhamento consistente
- Links para `done` e não-`done` sempre presentes

### `components/plans/PlanCard.tsx`
- Card highlighted: `from-blue-50 to-white` gradiente suave + `shadow-lg`
- Cards normais: `border-slate-100 hover:shadow-md hover:border-slate-200`
- Badge: gradiente `from-blue-700 to-blue-600`, `font-bold`, padding maior

### `components/evolution/EvolutionSummaryCards.tsx`
- Fundo colorido por contexto (score card com `bg-green/yellow/red-50`)
- Melhor nota sempre `bg-green-50 border-green-100`
- Foco de melhoria `bg-orange-50 border-orange-100`
- Números: `text-3xl font-bold tracking-tight`
- Radius: `rounded-xl` → `rounded-2xl`

### `components/evolution/BestEssaysList.tsx`
- Rank badges: ouro/prata/bronze (`bg-yellow-100`, `bg-slate-200`, `bg-orange-100`)
- Hover nas linhas: `hover:bg-slate-50 transition-colors`
- Radius: `rounded-xl` → `rounded-2xl border-slate-100`

### `components/result/ScoreHero.tsx`
- **Redesenho significativo:** fundo escuro gradiente por faixa de nota (verde-escuro/amarelo-escuro/vermelho-escuro)
- Score em `text-7xl tabular-nums` sobre fundo colorido com ring
- Feedback geral em caixa `bg-white/10 border-white/10`
- Sensação "wow" preservando mesma lógica

### `components/result/CompetencyBar.tsx`
- Barra: `h-2` → `h-2.5` (mais visível)
- Fundo: `bg-slate-200` → `bg-slate-100`
- Score: `tabular-nums`
- Label: `w-36` → `w-40` (mais espaço)
- Barra com `transition-all duration-500`

---

## NÃO alterado

- Toda lógica de backend (Server Actions, API Routes, billing, webhook)
- Lógica de IA/OCR
- Lógica de pagamentos Asaas
- Stack tecnológica
- Testes (75 passando)
- Formulários (EssayForm, ProfileForm, LoginForm, RegisterForm — já bem implementados)

---

## Resultado do `npm run qa`

```
Tests:  75 passed (75)
Lint:   2 warnings (0 errors) — warnings pré-existentes
Build:  ✓ Compiled successfully — 16 rotas, 0 erros TypeScript
```

---

## Melhorias futuras

1. **Fonte premium:** trocar para `Inter` ou `Geist` via `next/font` para tipografia mais refinada
2. **Micro-animações:** `framer-motion` leve em transições de rota (Page Transitions)
3. **Resultado "wow" expandido:** animação do score ao carregar (count-up)
4. **Dark mode:** sistema de cores já usa Tailwind, adaptação seria natural
5. **Ilustrações:** estados vazios com SVG (ao invés de emojis)
6. **Gráfico de evolução:** ScoreEvolutionChart (Recharts) — já funcional, poderia ter estilo premium
