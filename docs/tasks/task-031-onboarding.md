# Task 031 — Onboarding Guiado do Novo Usuário

**Status:** Concluída  
**Data:** 2026-05-12  
**Branch:** v2-pre-lancamento

---

## Objetivo

Criar onboarding leve, elegante e não-invasivo que guia o usuário novo sem bloquear o uso do app, aumentando a chance de ativação (envio da primeira redação).

---

## Estratégia: onboarding progressivo

O status do onboarding é **derivado dos essays**, não de um flag separado:

| Status | Condição | UI |
|---|---|---|
| `not_started` | Nenhuma redação enviada | Card completo com checklist |
| `essay_sent` | Redação enviada, nenhuma corrigida | Card compacto celebratório |
| `correction_received` | Pelo menos 1 redação corrigida | Card oculto (null) |

O onboarding some naturalmente quando o usuário recebe sua primeira correção.

---

## Migration

**`supabase/migrations/20260512000017_onboarding_flags.sql`**

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_essay_submitted boolean NOT NULL DEFAULT false;
```

Campos para analytics/segmentação futuras. O status atual é derivado dos essays; os flags podem ser gravados assincronamente depois.

---

## Helpers — `lib/onboardingUtils.ts`

```ts
type OnboardingStatus = 'not_started' | 'essay_sent' | 'correction_received'

hasUserSubmittedEssay(essays)      // essays.length > 0
hasUserReceivedCorrection(essays)  // essays.some(e => e.status === 'done')
getOnboardingStatus(essays)        // not_started | essay_sent | correction_received
shouldShowOnboarding(status)       // status !== 'correction_received'
```

---

## Componente — `components/dashboard/OnboardingCard.tsx`

Server Component. Recebe `status: OnboardingStatus` como prop.

### Estado `not_started`
Card premium `from-blue-700 to-blue-900`, duas colunas:
- Esquerda: label "Primeiros passos", título, subtítulo, botão branco "Começar agora →" → `/temas`
- Direita: checklist de 3 etapas (todas desmarcadas)

### Estado `essay_sent`
Card compacto horizontal `from-blue-800 to-blue-900`:
- Ícone verde (✓) + "Excelente começo!" + "Aguardando análise..."
- Desktop: mini checklist com "✓ Tema escolhido / ✓ Redação enviada / ◉ Correção pendente"
- Link "Ver status →" → `/redacoes`

### Estado `correction_received`
Retorna `null` — card some automaticamente.

---

## Integração no dashboard — `app/page.tsx`

```ts
const onboardingStatus = getOnboardingStatus(essays)
// ...
<OnboardingCard status={onboardingStatus} />
// (entre a saudação e o banner motivacional)
```

---

## Empty states melhorados

### `components/EssayHistoryList.tsx`
Estado vazio `filter === 'all'`:
- Ícone ✍️
- Título: "Nenhuma redação enviada ainda"
- Subtítulo descritivo
- Botão "Enviar primeira redação" → `/temas`

### `app/evolucao/page.tsx`
Empty state:
- Card branco com borda `rounded-2xl`
- Ícone 📈
- Subtítulo: "Envie e corrija sua primeira redação para começar a acompanhar..."
- Botão "Enviar primeira redação"

---

## Dica de perfil incompleto — `app/perfil/page.tsx`

Quando `phone` ou `target_score` estão null, exibe:

```
ℹ Adicione seu telefone e objetivo de nota para personalizar sua experiência na plataforma.
```

Caixa `bg-blue-50 border-blue-100` — sutil, não obrigatória.

---

## Testes — `tests/utils/onboardingUtils.test.ts`

16 casos novos cobrindo todos os helpers:
- `hasUserSubmittedEssay`: 4 casos
- `hasUserReceivedCorrection`: 4 casos
- `getOnboardingStatus`: 5 casos (incluindo prioridade correction > sent)
- `shouldShowOnboarding`: 3 casos

---

## QA

- 106 testes passando (+16 novos vs. 031)
- 0 erros de lint, build limpo

---

## Fluxo completo

```
1. Usuário cria conta
2. Abre dashboard → vê OnboardingCard "Primeiros passos" (not_started)
3. Clica "Começar agora" → /temas
4. Escolhe tema, escreve, envia
5. Volta ao dashboard → OnboardingCard compacto "Excelente começo!" (essay_sent)
6. Aguarda correção (pode navegar normalmente)
7. Correção pronta → OnboardingCard desaparece (correction_received)
8. Dashboard limpo com métricas reais
```

---

## Limitações

- `onboarding_completed` e `first_essay_submitted` no DB nunca são gravados por esta task — status derivado de essays
- Sem tour interativo, sem modal
- Sem emails de onboarding/ativação
- Sem streak/gamificação

---

## Expansões futuras

- Gravar `first_essay_submitted = true` quando essay é submetida (webhook/action)
- Gravar `onboarding_completed = true` quando primeira correção chega
- Email de ativação D+1 se `first_essay_submitted = false`
- Email de reengajamento D+7 se `onboarding_completed = false`
- Streak de treino (dias consecutivos com redação)
- Progress bar no header para usuários em onboarding
