# Task 030 — Landing Page Pública Premium

**Status:** Concluída  
**Data:** 2026-05-12  
**Branch:** v2-pre-lancamento

---

## Objetivo

Transformar a home pública em uma landing page premium de SaaS educacional voltada para conversão, credibilidade e tráfego de marketing (TikTok, Instagram, YouTube, Google).

---

## Estrutura

### Separação visitante vs. usuário logado

`app/page.tsx` detecta autenticação:
- **Visitante não logado** → renderiza `<LandingPage />`
- **Usuário logado** → continua renderizando o dashboard atual (sem alteração)

Nenhuma lógica de app foi alterada.

---

## Componente principal

**`components/landing/LandingPage.tsx`** — Server Component puro (sem `'use client'`)

### Seções implementadas

| # | Seção | Background | Descrição |
|---|---|---|---|
| 1 | Nav sticky | `bg-white/95 backdrop-blur-md` | Logo + links + "Criar conta grátis" |
| 2 | Hero | `from-slate-900 via-slate-800 to-blue-950` | Badge, headline, 2 CTAs, mockup de score |
| 3 | Trust strip | `bg-slate-900` | 3 afirmações de credibilidade |
| 4 | Como funciona | `bg-white` | 3 passos com ícone + número grande |
| 5 | Benefícios | `bg-slate-50` | 6 benefícios em grid 2×3 |
| 6 | Evolução / resultado | `bg-white` | Copy + mockup de evolução (stats + barras) |
| 7 | Planos resumidos | `bg-slate-50` | 3 cards + link "Ver planos completos" |
| 8 | CTA final | `from-blue-950 via-blue-900 to-slate-900` | Headline + 2 botões |
| 9 | Footer | `bg-slate-900` | Logo + links + copyright |

---

## HeroMockup

Card mockup estilizado (não screenshot real) simulando resultado de uma redação:
- Score `840/1000` em gradiente verde-escuro
- 5 barras de competência (C1–C5) com valores realistas
- Snippet de feedback `C3 — Nota máxima`
- Badge flutuante `"Corrigido em segundos"`
- Glow verde atrás do card

Objetivo: mostrar imediatamente o que o produto entrega, sem precisar de screenshot real.

---

## Copy

### Hero
- **Badge:** "Preparação ENEM • Plataforma de treino"
- **Headline:** "Treine redação com feedback detalhado e acompanhe sua evolução."
- **Subtítulo:** "Receba análises completas baseadas nos critérios do ENEM..."
- **CTAs:** "Começar grátis" (primário, azul) + "Ver como funciona" (secundário, ghost)
- **Microcopy:** "Sem cartão de crédito. Comece grátis com 3 redações."

### Trust strip
- "Baseado nos critérios oficiais do ENEM"
- "Criado para estudantes que querem sair da média"
- "Feedback preciso, sem respostas genéricas"

### Como funciona (3 passos)
1. Escolha um tema
2. Escreva e envie
3. Receba análise detalhada

### Benefícios (6)
Critérios oficiais • Erros no texto • Evolução por competência • Histórico • OCR manuscrito • Sugestões de reescrita

### Planos resumidos
- Gratuito: R$0, "3 redações por mês"
- Pro Mensal: R$19,00/mês
- Pro Anual: R$14,90/mês (destaque + badge "Mais escolhido") — preços reais do sistema

---

## Metadata SEO

Adicionado em `app/page.tsx`:
```ts
export const metadata: Metadata = {
  title: 'Reda1000 — Treine redação para o ENEM com feedback detalhado',
  description: 'Plataforma de treino de redação ENEM com análises detalhadas por competência (C1–C5), evolução por nota e acompanhamento completo. Comece grátis.',
}
```

---

## Decisões de design

- **Server Component puro** — sem hidratação desnecessária; landing é toda estática
- **Mockup sintético** — mais confiável que screenshot (não quebra quando UI muda)
- **Alternância bg branco/slate-50** — ritmo visual entre seções sem cansaço
- **Hero escuro** — contraste máximo, destaque imediato
- **Grid 2×3 nos benefícios** — compacto e legível em mobile e desktop
- **Planos summary** — 3 cards simples com link para `/planos`; sem replicar a lógica de checkout
- **Anchor `#como-funciona`** — link "Ver como funciona" no hero faz scroll suave nativamente

---

## QA

- 90 testes passando, 0 erros de lint, build limpo
- `/` continua dinâmico (ƒ) — server component com autenticação

---

## Limitações

- **Analytics**: sem GA4, pixel ou UTM tracking implementados ainda
- **A/B testing**: copy único, sem variações
- **Screenshots reais**: mockup sintético; poderia ser substituído por screenshot quando UI estiver estável
- **Blog/CMS**: não implementado
- **Testimonials**: sem depoimentos reais (produto em pré-lançamento)

---

## Melhorias futuras

- Integrar GA4 / pixel Meta para medir conversão por canal
- Adicionar UTM params nos CTAs para rastreamento de origem
- Substituir mockup sintético por screenshot real quando UX estiver definitiva
- Adicionar seção de perguntas frequentes (FAQ)
- Adicionar depoimentos reais de usuários beta
- Otimização de Core Web Vitals (LCP do hero)
