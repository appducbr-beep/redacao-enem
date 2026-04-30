# Task 013.5 — Migração da Correção para OpenAI

**Status:** concluída  
**Data:** 2026-04-28  
**Responsável:** Claude Code (operador técnico)  
**Referências:** task-013.3, apps/web/lib/openai.ts

---

## Problema resolvido

O Groq apresentava limitações que inviabilizavam o uso em produção para correção ENEM:

- **Rate limits** — chamadas paralelas para 5 competências atingiam cotas rapidamente
- **Qualidade de julgamento** — modelos disponíveis no Groq não calibravam as rubricas ENEM com precisão suficiente para nota 1000

Solução: substituir Groq por OpenAI (`gpt-4o`) na correção. OCR continua no Groq (Vision).

---

## Arquitetura após migração

| Funcionalidade | Antes | Depois |
|---|---|---|
| Correção C1–C5 | Groq (`llama-3.3-70b-versatile`) | OpenAI (`gpt-4o`) |
| Síntese final | Groq | OpenAI (`gpt-4o`) |
| OCR (manuscrito) | Groq Vision | Groq Vision (sem alteração) |

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `apps/web/lib/openai.ts` | criado — cliente OpenAI com retry e timeout |
| `apps/web/lib/groq.ts` | remove import `groq-sdk`; importa `callOpenAI`/`getOpenAIModel`; `call()` delega para `callOpenAI`; `ai_model` usa `getOpenAIModel()` |
| `apps/web/app/actions/corrections.ts` | erro de chave atualizado: `GROQ_API_KEY` → `OPENAI_API_KEY` |
| `apps/web/.env.example` | `OPENAI_API_KEY=`, `OPENAI_MODEL=gpt-4o`; `GROQ_MODEL` removido; `GROQ_API_KEY` apenas para OCR |
| `apps/web/package.json` | `openai` adicionado como dependência |

---

## `lib/openai.ts` — detalhes

```typescript
callOpenAI(systemPrompt, userPrompt, maxTokens)
  → new OpenAI({ apiKey, maxRetries: 2, timeout: 60_000 })
  → response_format: { type: 'json_object' }
  → retorna { parsed: unknown; tokens: number }
```

- `maxRetries: 2` — SDK trata automaticamente erros 429 e 5xx com backoff exponencial
- `timeout: 60_000` — 60s máximo por chamada (gpt-4o gera ~2000 tokens em ~10-20s)
- `response_format: json_object` — garante JSON válido na saída

---

## Como configurar

### `.env.local`

```env
# Correção ENEM
OPENAI_API_KEY=sk-...

# Opcional — padrão é gpt-4o
OPENAI_MODEL=gpt-4o

# OCR apenas
GROQ_API_KEY=gsk_...
```

### Chave OpenAI

1. Acessar platform.openai.com → API Keys
2. Criar chave com permissão de escrita
3. Adicionar créditos na conta (mínimo recomendado: $10)

---

## Custo estimado por redação

| Fase | Chamadas | Tokens (estimativa) | Custo (gpt-4o) |
|---|---|---|---|
| 5 competências (paralelas) | 5 | ~1500 input + ~800 output cada | ~$0.055 |
| Síntese | 1 | ~500 input + ~200 output | ~$0.005 |
| **Total** | **6** | **~11.000 tokens** | **~$0.06** |

Preços de referência (gpt-4o, abril 2026): $2.50/1M input, $10.00/1M output.

---

## Tempo médio de resposta

As 5 chamadas de competência rodam em paralelo. Tempos esperados:

| Cenário | Tempo total |
|---|---|
| gpt-4o, rede boa | 8–15s |
| gpt-4o, pico de tráfego | 20–40s |
| Fallback por retry (1 falha) | +5s (backoff SDK) |

O timeout de 60s garante que a chamada falha de forma controlada antes de atingir o timeout do servidor Next.js.

---

## Como testar

1. Adicionar `OPENAI_API_KEY` em `.env.local`
2. `npm run dev` → enviar redação → "Corrigir agora"
3. Verificar no banco:
```sql
SELECT ai_model, feedback->'score_c1', feedback->'score_c2'
FROM essay_corrections ORDER BY created_at DESC LIMIT 1;
```
`ai_model` deve mostrar `gpt-4o`.

---

## Limitações conhecidas

1. **Custo por correção ~$0.06** — para volume alto (>1000 correções/mês), avaliar batching ou cache.
2. **Sem streaming** — a resposta JSON completa é aguardada antes de processar; não há feedback progressivo ao usuário.
3. **Dependência de OpenAI** — rate limits e outages da OpenAI afetam a correção; o Groq de OCR não é afetado.
4. **`groq.ts` mantém o nome** — o módulo se chama `groq.ts` por compatibilidade com imports existentes, mas não usa mais o Groq SDK para correção.
