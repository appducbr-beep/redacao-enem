# Task 029.4 — Expansão Estratégica do Perfil do Usuário

**Status:** Concluída  
**Data:** 2026-05-12  
**Branch:** v2-pre-lancamento

---

## Objetivo

Adicionar campos estratégicos ao perfil do usuário para preparar o produto para ações futuras de retenção, segmentação, notificações, marketing e onboarding, mantendo baixa fricção no cadastro e UX limpa no perfil.

---

## Migration

**Arquivo:** `supabase/migrations/20260512000016_profile_expansion.sql`

Campos adicionados em `profiles` via `ADD COLUMN IF NOT EXISTS`:

| Coluna | Tipo | Default | Propósito |
|---|---|---|---|
| `phone` | `text` | null | Lembretes futuros, comunicação |
| `target_score` | `integer` | null | Segmentação, personalização |
| `school_stage` | `text` | null | Segmentação, conteúdo |
| `marketing_consent` | `boolean` | `false` | LGPD, opt-in comunicação |
| `acquisition_source` | `text` | null | Atribuição de canal |

---

## Utilitário de Telefone

**Arquivo:** `lib/phoneUtils.ts`

- `sanitizePhone(raw)` — remove não-dígitos
- `formatPhone(digits)` — formata 10 ou 11 dígitos no padrão `(XX) XXXX-XXXX`
- `isValidOptionalPhone(raw)` — válido se vazio ou entre 10-11 dígitos; não bloqueia cadastro por formato imperfeito

**Testes:** `tests/utils/phoneUtils.test.ts` — 15 casos cobrindo sanitização, formatação e validação opcional.

---

## Server Actions atualizadas

### `app/actions/auth.ts` — `signUp`
Salva em `profiles` após signup:
- `full_name`, `phone` (sanitizado), `target_score`, `school_stage`, `acquisition_source`, `marketing_consent`
- Campos opcionais são salvos apenas se preenchidos (sem sobrescrever com null desnecessariamente)
- `marketing_consent` é sempre salvo (padrão `false`)

### `app/actions/profile.ts` — `updateProfile`
Atualiza campos adicionais junto com `full_name`:
- `phone`, `target_score`, `school_stage`, `marketing_consent`
- `acquisition_source` não editável no perfil (campo de primeira coleta)

---

## Cadastro — `/register`

Seção "Personalização opcional" separada por divisor horizontal:

**Campos obrigatórios:** nome, e-mail, senha  
**Campos opcionais (nova seção):**
- Telefone — com microcopy sobre uso futuro
- Objetivo de nota (select: 600, 700, 800, 900, 950, 1000)
- Situação escolar (select: 3 anos EM, Vestibulando, Outro) — grid 2 colunas com objetivo
- Como conheceu o Reda1000 (select: TikTok, Instagram, YouTube, Google, Professor, Escola, Indicação, Outro)
- Checkbox: "Quero receber dicas, novidades e lembretes sobre redação."

---

## Perfil — `/perfil`

`ProfileForm` reorganizado em 3 seções com divisores `SectionHeader`:

**A — Dados da conta:** nome completo, e-mail (read-only), telefone  
**B — Objetivo de estudo:** objetivo de nota (select), situação escolar (select)  
**C — Comunicação:** checkbox de consentimento de marketing

`acquisition_source` não aparece no perfil — campo de primeira coleta, não editável.

---

## Dashboard — `/`

O banner motivacional exibe discretamente a meta do usuário:
- Se `target_score` existe: mostra "Meta / 900+" no canto direito do banner
- Se não existe: mostra link "Definir meta →" para `/perfil`
- Não polui o layout — integrado no banner já existente

---

## Privacidade / LGPD

- Telefone claramente marcado como opcional com microcopy explicativo
- Consentimento de marketing: opt-in explícito (default false), linguagem clara
- Nenhum dado coletado é usado nesta task (apenas armazenado)
- Nenhuma integração com WhatsApp, SMS ou CRM implementada

---

## Testes

**7 arquivos de teste, 90 testes totais (+15 novos vs. 029.3)**

Novos: `tests/utils/phoneUtils.test.ts`
- `sanitizePhone`: 4 casos
- `formatPhone`: 4 casos
- `isValidOptionalPhone`: 7 casos

---

## Limitações

- `acquisition_source` só é coletado no cadastro; não editável após
- Telefone armazenado como dígitos sanitizados (sem formatação no banco)
- Validação de telefone é permissiva (10-11 dígitos) — não verifica operadora ou DDD válido
- Nenhuma lógica de envio de mensagem implementada

---

## Pontos futuros

- Integração com WhatsApp Business API (lembretes de treino)
- Segmentação por `school_stage` para mostrar temas por série
- Dashboard personalizado com meta vs. nota média atual
- Relatório de `acquisition_source` para marketing
- Opt-out de comunicação via link no e-mail
