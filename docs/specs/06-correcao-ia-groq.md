# Spec 06 — Correção com IA via Groq

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir como a correção automática de redações é realizada usando LLMs via Groq.

## Tecnologia

- **Provedor:** Groq (API compatível com OpenAI)
- **Modelo padrão:** `llama3-70b-8192`
- **SDK:** `groq-sdk` (Node.js)
- **Prompt:** versionado em `docs/prompts/prompt-correcao-enem.md`

## Fluxo de correção

```
1. API Route recebe redacao_id
2. Busca redação e tema no banco
3. Monta o prompt com tema + textos motivadores + texto do aluno
4. Envia para Groq com structured output (JSON)
5. Parseia a resposta: notas C1–C5 + feedbacks
6. Salva resultado em `correcoes`
7. Atualiza `redacoes.status = 'done'`
8. (Se falhar) Atualiza `redacoes.status = 'error'` e estorna crédito
```

## Estrutura do output esperado (JSON)

```json
{
  "competencias": {
    "c1": { "nota": 160, "feedback": "..." },
    "c2": { "nota": 200, "feedback": "..." },
    "c3": { "nota": 120, "feedback": "..." },
    "c4": { "nota": 160, "feedback": "..." },
    "c5": { "nota": 80,  "feedback": "Proposta de intervenção incompleta..." }
  },
  "nota_total": 720,
  "comentario_geral": "...",
  "pontos_positivos": ["...", "..."],
  "pontos_de_melhoria": ["...", "..."]
}
```

## Notas por competência

- Escala: 0, 40, 80, 120, 160 ou 200 (múltiplos de 40, como no ENEM real)
- Total máximo: 1000

## Tratamento de erros

| Cenário                        | Comportamento                             |
|-------------------------------|------------------------------------------|
| Timeout Groq (> 30s)          | Retry 2x, depois marca como `error`      |
| JSON malformado na resposta    | Retry com temperatura menor              |
| Rate limit Groq               | Exponential backoff                      |
| Redação ofensiva/inválida      | Retorna nota 0 com explicação            |

## Escopo desta spec

Pipeline de correção. Prompt detalhado está em `docs/prompts/prompt-correcao-enem.md`.

## Fora de escopo

- Fine-tuning de modelos — versão futura
- Correção com múltiplos modelos em paralelo — versão futura
