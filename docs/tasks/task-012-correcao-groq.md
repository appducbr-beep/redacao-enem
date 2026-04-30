# Task 012 — Pipeline de Correção por IA (Groq)

**Status:** concluída  
**Data:** 2026-04-27  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.5, task-011, docs/prompts/prompt-correcao-enem.md v1.1

---

## Objetivo

Implementar o pipeline inicial de correção de redações por IA via Groq. A correção é acionada manualmente pelo botão "Corrigir agora" na página da redação.

**Fora de escopo nesta task:** fila/background job, streaming, OCR, pagamentos.

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `apps/web/lib/supabaseAdmin.ts` | criado | Cliente Supabase com service_role (bypassa RLS) — somente server-side |
| `apps/web/lib/groq.ts` | criado | Cliente Groq + função `correctEssayWithGroq` |
| `apps/web/app/actions/corrections.ts` | criado | Server Action `runEssayCorrection` |
| `apps/web/components/CorrectNowButton.tsx` | criado | Botão Client Component que dispara a correção |
| `apps/web/app/redacoes/[id]/page.tsx` | alterado | Exibe resultados por status: processing / done / error |
| `apps/web/.env.example` | alterado | Adicionado GROQ_API_KEY, GROQ_MODEL, SUPABASE_SERVICE_ROLE_KEY |
| `docs/prompts/prompt-correcao-enem.md` | alterado | v1.1: modelo e referência de uso atualizados |

**Dependência instalada:** `groq-sdk`

---

## Variáveis de ambiente necessárias

Adicionar ao `.env.local`:

```env
# Supabase admin (service_role — somente servidor)
SUPABASE_SERVICE_ROLE_KEY=<Supabase Dashboard → Settings → API → service_role secret>

# Groq
GROQ_API_KEY=<Groq Console → API Keys>
GROQ_MODEL=llama-3.3-70b-versatile
```

`GROQ_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` **nunca** devem ter o prefixo `NEXT_PUBLIC_`.

---

## Arquitetura

```
[Usuário clica "Corrigir agora"]
        ↓
CorrectNowButton (Client Component)
  useTransition → runEssayCorrection(essayId)
        ↓
runEssayCorrection (Server Action — app/actions/corrections.ts)
  - valida autenticação e ownership
  - valida status = 'processing'
  - chama correctEssayWithGroq(essayId, userId)
  - revalidatePath + router.refresh()
        ↓
correctEssayWithGroq (lib/groq.ts)
  - busca essay + tema (via supabaseAdmin)
  - monta system + user prompt
  - chama Groq API com response_format: json_object
  - valida JSON (notas em [0,40,80,120,160,200])
  - INSERT essay_corrections (via supabaseAdmin)
  - UPDATE essays.status = 'done'
  [se falhar em qualquer ponto]:
  - UPDATE essays.status = 'error'
  - RPC refund_credit(user_id, essay_id, 'ai_correction_failed')
  - relança o erro
```

---

## Fluxo de sucesso

1. Usuário acessa `/redacoes/<id>` com `status = 'processing'`
2. Vê botão "Corrigir agora" e 1 crédito reservado
3. Clica no botão → `pending` no client (useTransition)
4. Groq recebe a redação e retorna JSON com 5 notas + feedbacks
5. `essay_corrections` é inserido com `c1–c5`, `feedback` (jsonb completo), `ai_model`, `tokens_used`
6. `essays.status` atualizado para `'done'`
7. Página recarrega e exibe:
   - Nota total (0–1000)
   - Notas e feedbacks por competência (C1–C5)
   - Comentário geral
   - Pontos positivos
   - Pontos de melhoria

---

## Fluxo de erro com reembolso

1. Qualquer exceção em `correctEssayWithGroq`:
   - JSON malformado
   - Nota fora do padrão (não múltiplo de 40)
   - Falha de rede com Groq
   - Erro de INSERT no banco
2. `essays.status` → `'error'`
3. `refund_credit(user_id, essay_id, 'ai_correction_failed')` executado
4. Erro relançado → `runEssayCorrection` captura e retorna `{ error: "Erro ao corrigir..." }`
5. Página recarrega e exibe: "Não foi possível corrigir sua redação. Seu crédito foi devolvido."

---

## Por que `supabaseAdmin` é necessário

A tabela `essay_corrections` não tem policy INSERT para usuários autenticados (apenas service_role pode inserir — ver migration 010). Como a correção roda 100% server-side (Server Action), o uso de `SUPABASE_SERVICE_ROLE_KEY` no servidor é seguro. A chave nunca é exposta ao browser.

---

## Modelo e parâmetros Groq

| Parâmetro | Valor |
|---|---|
| Modelo padrão | `llama-3.3-70b-versatile` (via `GROQ_MODEL`) |
| `temperature` | `0.3` (baixa criatividade para consistência) |
| `max_tokens` | `2048` |
| `response_format` | `{ type: 'json_object' }` |

---

## Validação do JSON da IA

- Cada nota (`c1` a `c5`) deve pertencer a `{0, 40, 80, 120, 160, 200}`
- Se qualquer nota for inválida, a correção falha e o crédito é reembolsado
- `total_score` no banco é GENERATED — nunca inserido manualmente
- `feedback` (JSONB) armazena o objeto completo retornado pelo Groq

---

## Como testar

### Pré-requisitos

1. Migrations 011 e 012 aplicadas no Supabase remoto
2. Seed `001_essay_topics.sql` aplicado
3. `.env.local` com `GROQ_API_KEY`, `GROQ_MODEL`, `SUPABASE_SERVICE_ROLE_KEY`
4. `cd apps/web && npm run dev`

### Caminho feliz

1. Login com usuário free (credits ≥ 1)
2. Ir para `/temas` → tema gratuito → "Começar redação"
3. Escrever redação ≥ 800 chars → "Enviar redação"
4. Na página `/redacoes/<id>`: clicar "Corrigir agora"
5. Aguardar (~5–20 segundos)
6. **Esperado:**
   - Nota total exibida (0–1000)
   - Notas C1–C5 com cores (verde ≥160, amarelo ≥80, vermelho <80)
   - Feedbacks por competência
   - Comentário geral, pontos positivos e de melhoria
7. Verificar no Supabase:
   - `essays.status = 'done'`
   - `essay_corrections` tem uma linha com `essay_id` correto
   - `credit_wallets.credits_used` = 1 (não reembolsado)

### Fluxo de erro

1. Definir `GROQ_API_KEY=chave_invalida` no `.env.local`
2. Enviar redação e clicar "Corrigir agora"
3. **Esperado:**
   - Página exibe "Não foi possível corrigir sua redação. Seu crédito foi devolvido."
   - `essays.status = 'error'` no banco
   - `credit_wallets.credits_used` decrementado (crédito de volta)

---

## Limitações conhecidas

1. **Sem fila/background job** — a correção bloqueia o browser enquanto o Groq processa (até ~30s)
2. **Sem streaming** — resultado aparece todo de uma vez após a resposta completa do Groq
3. **Crédito não pode ser reusado após erro** — o usuário precisa enviar uma nova redação
4. **Sem retry automático** — JSON inválido resulta em erro imediato (sem retry com temperature menor)
5. **`estimated_cost_cents` não calculado** — `tokens_used` é salvo, mas custo não é estimado
6. **Sem modelo de fallback** — se o modelo configurado não estiver disponível, a correção falha

---

## Próxima task sugerida

**Task 013 — Histórico de Redações**
- Página `/redacoes` listando todas as redações do usuário
- Filtro por status
- Link para `/redacoes/[id]` em cada linha
