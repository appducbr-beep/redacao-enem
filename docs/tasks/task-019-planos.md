# Task 019 — Página de Planos (Paywall)

**Status:** concluída  
**Data:** 2026-04-29  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Criar a página `/planos` para apresentar o valor do produto, permitir comparação entre planos e preparar a estrutura para integração com pagamento (Task 020).

---

## Estrutura da página

```
1. Hero — título + subtítulo + indicador do plano atual (se logado)
2. PricingSection — toggle mensal/anual + 2 cards de plano
3. Seção "Por que o Reda1000 é diferente?" — 4 diferenciais
4. CTA final — banner gradiente azul com botão
```

---

## Planos definidos

### Gratuito
| Campo | Valor |
|---|---|
| Preço | R$ 0 |
| Correções | 3 por mês |
| Benefícios | Análise C1–C5, OCR, Histórico, Dashboard |
| CTA logado | "Ir para redações" → /temas |
| CTA não logado | "Começar grátis" → /register |

### Pro
| Campo | Mensal | Anual |
|---|---|---|
| Preço | R$ 19,00/mês | R$ 14,90/mês |
| Cobrança | Mensal | R$ 178,80/ano |
| Correções | 30 por mês | 30 por mês |
| Benefícios | + análise avançada, prioridade, suporte | idem |
| CTA | `console.log` — aguardando Task 020 | idem |

---

## Lógica mensal/anual

- Estado `cycle: 'monthly' | 'annual'` em `PricingSection.tsx` (Client Component)
- Default: `'monthly'`
- Toggle exibe badge "-22%" no botão Anual quando está no modo mensal
- Quando anual ativo: exibe economia "R$ 49,20 por ano"
- Preço do Pro altera dinamicamente; Free não muda

---

## Componentes criados

| Componente | Localização | Tipo | Responsabilidade |
|---|---|---|---|
| `PricingToggle` | `components/plans/PricingToggle.tsx` | Client | Toggle mensal/anual com badge de desconto |
| `PlanCard` | `components/plans/PlanCard.tsx` | Shared | Card de plano com features, badge, CTA flexível (Link ou button) |
| `PricingSection` | `components/plans/PricingSection.tsx` | Client | Estado `cycle`, renderiza toggle + 2 cards |

---

## Estado do usuário

| Estado | Comportamento |
|---|---|
| Não logado | Sem indicador de plano atual; Free CTA → /register |
| Logado, plano free | Banner "Você está no plano Gratuito"; Free card mostra badge "Plano atual" |
| Logado, plano pro | Banner "Você já tem o plano Pro ✓"; Pro card mostra badge "Plano atual" |

---

## Próximos passos — Task 020

O botão "Assinar plano Pro" atualmente chama:
```typescript
console.log('TODO Task 020: integrate Asaas payment — cycle:', cycle)
```

Task 020 deve:
1. Integrar Asaas para criação de assinatura
2. Criar Server Action `createSubscription(cycle)`
3. Redirecionar para checkout do Asaas
4. Webhook para atualizar `profiles.plan` após pagamento confirmado

---

## Arquivos criados

| Arquivo | Mudança |
|---|---|
| `app/planos/page.tsx` | criado |
| `components/plans/PricingToggle.tsx` | criado |
| `components/plans/PlanCard.tsx` | criado |
| `components/plans/PricingSection.tsx` | criado |

---

## Como testar

1. `npm run dev` → acessar `/planos`
2. Verificar hero com título e subtítulo
3. Toggle "Mensal → Anual": preço do Pro muda para R$ 14,90/mês + nota anual
4. Badge "-22%" aparece no botão Anual quando em modo mensal
5. Logado com plano free: Free card mostra "Plano atual", Pro não
6. Não logado: Free CTA leva a /register; Pro CTA console.log
7. Clicar "Assinar plano Pro" → `console.log` no DevTools com o ciclo selecionado
8. Seção "Por que o Reda1000 é diferente?" com 4 diferenciais
9. CTA final leva a /register (não logado) ou /temas (logado)
10. Responsivo: cards empilhados em mobile, lado a lado em desktop

---

## Limitações conhecidas

1. **Sem integração de pagamento:** botão Pro é fake (console.log) — aguarda Task 020
2. **Plano "school" não exibido:** plano School é para instituições; não faz parte do pricing público
3. **Sem trial/período gratuito do Pro:** pode ser adicionado em Task 020
4. **Limites não enforçados no backend:** créditos ainda são manuais via `credit_wallets`

---

## Refinamento de conversão (Task 019.2)

### Problema corrigido: altura inconsistente dos cards

Causa: `items-center` no grid + ausência de `h-full` nos cards.

Correção:
- Grid: `items-center` → `items-stretch`
- `PlanCard`: adicionado `h-full` no container raiz
- `items-center` → `py-8 overflow-visible` para acomodar `md:scale-105` do Pro Anual sem clip

### Novos props em PlanCard

| Prop | Tipo | Uso |
|---|---|---|
| `tagline` | `string?` | Micro-copy abaixo do nome do plano |
| `ctaVariant` | `'solid' \| 'outlined' \| 'subtle'` | Controle explícito do estilo do botão |

`ctaVariant` substituiu a inferência implícita via `highlighted`:
- `subtle` → Free: `bg-slate-800 text-white` (visível, contrastante)
- `outlined` → Pro Mensal: `border-2 border-blue-600 text-blue-700` (diferenciado)
- `solid` → Pro Anual: `bg-blue-700 text-white` (primário, destaque máximo)

### Mudanças de copy

| Elemento | Antes | Depois |
|---|---|---|
| Hero sub | "Receba diagnósticos rápidos..." | mantido + linha emocional "Descubra exatamente onde você perde pontos e como melhorar." |
| Status free | "Você está no plano Gratuito" | "Seu plano atual: Gratuito" + "Desbloqueie mais redações e evolua mais rápido." |
| Micro-copy Free | ausente | "Ideal para começar" |
| Micro-copy Pro Mensal | ausente | "Para quem quer evoluir de forma contínua" |
| Micro-copy Pro Anual | ausente | "Melhor custo-benefício para quem quer chegar na nota 1000" |

### Prova de valor

Adicionada segunda linha abaixo dos planos:
> "Estudantes que treinam regularmente alcançam notas acima de 900."

### Hierarquia visual resultante

```
Fundo:          bg-slate-50
Cards Free/Pro Mensal: bg-white border-slate-200 shadow-sm
Card Pro Anual: bg-blue-50 border-2 border-blue-500 shadow-md md:scale-105

Botões:
  Free:         bg-slate-800 text-white (sólido escuro)
  Pro Mensal:   border-2 border-blue-600 text-blue-700 (outlined)
  Pro Anual:    bg-blue-700 text-white (primário — mais destaque)
  Plano atual:  bg-slate-100 text-slate-400 (desabilitado)
```
