# Task 023 — Setup de testes automáticos com Vitest + regras financeiras

**Status:** concluída  
**Data:** 2026-05-07  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Criar base de testes automáticos para as regras financeiras do Reda1000, evitando regressões manuais a cada mudança no fluxo de assinatura, créditos e cancelamento.

---

## Dependências instaladas

| Pacote | Versão | Motivo |
|---|---|---|
| `vitest` | ^4.1.5 | Test runner |
| `@vitest/ui` | ^4.1.5 | Interface visual (opcional) |

---

## Scripts adicionados — `apps/web/package.json`

| Script | Comando | Uso |
|---|---|---|
| `npm test` | `vitest run` | CI — roda uma vez e sai |
| `npm run test:watch` | `vitest --watch` | Desenvolvimento — re-roda ao salvar |
| `npm run test:ui` | `vitest --ui` | Interface visual no browser |

---

## Arquivos criados

| Arquivo | Descrição |
|---|---|
| `apps/web/vitest.config.ts` | Config do Vitest (env: node, alias `@/`) |
| `apps/web/lib/billingRules.ts` | Helpers puros de regras de cobrança |
| `apps/web/lib/cpfUtils.ts` | Helpers puros de formatação e validação de CPF |
| `apps/web/tests/billing/billingRules.test.ts` | Testes das regras financeiras |
| `apps/web/tests/asaas/cpfUtils.test.ts` | Testes das funções de CPF |

### Refatoração

`CpfModal.tsx` foi atualizado para importar `formatCpf` e `sanitizeCpf` de `lib/cpfUtils.ts` (sem mudança de comportamento).

---

## O que foi testado

### `tests/billing/billingRules.test.ts` — 21 testes

**A) Garantia de 7 dias (`isWithinGuaranteePeriod`)**
- 1 dia após início → `true`
- Exatamente 7 dias → `true` (limite inclusivo, `<= 7 * 86_400_000`)
- 8 dias → `false`
- 7 dias + 1ms → `false`

**B) Cancelamento (`shouldCancelImmediately` / `shouldKeepAccessUntilPeriodEnd`)**
- Dentro de 7 dias → `shouldCancelImmediately = true`
- Após 7 dias → `shouldCancelImmediately = false`
- `startDate = null` → fallback conservador → `shouldCancelImmediately = true`, `shouldKeepAccessUntilPeriodEnd = false`
- Após 7 dias → `shouldKeepAccessUntilPeriodEnd = true`
- Dentro de 7 dias → `shouldKeepAccessUntilPeriodEnd = false`

**C) Datas (`getPeriodEnd`, `getNextCreditResetDate`)**
- Mensal: `current_period_end = +1 mês` (dia do mês preservado)
- Anual: `current_period_end = +1 ano` (dia preservado)
- `getPeriodEnd` não muta o `startDate` original
- Anual: `next_credit_reset_at = +1 mês`
- Mensal: `next_credit_reset_at = null`

**D) Créditos**
- Pro activation → sempre 20 (independente de saldo anterior)
- Ativar Pro duas vezes → resultado é 20 (não acumula)
- Free downgrade → 3

### `tests/asaas/cpfUtils.test.ts` — 15 testes

**`formatCpf`**
- Entrada de 11 dígitos → `XXX.XXX.XXX-XX`
- Entrada já com máscara → normaliza
- Entradas parciais (3, 6, 9 dígitos) → formatos intermediários
- Entrada com mais de 11 dígitos → trunca em 11
- Entrada vazia → string vazia

**`sanitizeCpf`**
- Remove pontos e hífen
- Entrada já limpa → retorna igual
- Entrada vazia → string vazia

**`isValidCpfLength`**
- 11 dígitos → `true`
- 11 dígitos com máscara → `true`
- 10 dígitos → `false`
- 12 dígitos → `false`
- Vazio → `false`

---

## Como rodar

```bash
cd apps/web

# Roda uma vez (CI)
npm test

# Re-roda ao salvar (desenvolvimento)
npm run test:watch

# Interface visual no browser
npm run test:ui
```

---

## Resultado atual

```
Test Files  2 passed (2)
     Tests  36 passed (36)
  Duration  ~933ms
```

---

## Limitações conhecidas

1. **`getCreditBalanceAfterFreeDowngrade()` retorna 3** e o código em `billing.ts` agora usa o mesmo valor (3 créditos ao cancelar dentro de 7 dias). A função SQL `process_subscription_expirations()` (cancelamento após 7 dias via cron) ainda usa 0 — comportamento intencional, pois o usuário manteve acesso Pro até o fim do período.

2. **Sem testes de integração com Supabase**: `billingRules.ts` contém apenas lógica pura. As queries ao banco (`set_credit_balance`, `process_subscription_expirations`) não são testadas.

3. **Sem testes de componentes React**: `CpfModal.tsx`, `CancelSubscriptionButton.tsx` e outros não têm cobertura de UI — exigiria `@testing-library/react` + `jsdom`.

4. **Sem testes do webhook**: `handlePaymentConfirmed` e `handleSubscriptionCancelled` dependem de `supabaseAdmin` e do Asaas; precisariam de mocks ou ambiente de staging.

---

## Próximos testes recomendados

| Prioridade | Teste | Complexidade |
|---|---|---|
| Alta | Verificar se `process_subscription_expirations()` deve retornar 3 créditos ao expirar (alinhamento com o cancelamento dentro de 7 dias) | Baixa |
| Alta | Testa `process_subscription_expirations` via Supabase local (`supabase start`) | Média |
| Média | Testa `handlePaymentConfirmed` com mock do `supabaseAdmin` | Média |
| Média | Testa `CancelSubscriptionButton` com `@testing-library/react` + `jsdom` | Média |
| Baixa | E2E com Playwright: checkout → webhook → cancelamento | Alta |
