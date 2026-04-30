# Task 013.1 — Anti-alucinação + Evidência Obrigatória

**Status:** concluída  
**Data:** 2026-04-27  
**Responsável:** Claude Code (operador técnico)  
**Referências:** task-013, docs/prompts/prompt-correcao-enem.md v3.1

---

## Problema resolvido

LLMs tendem a alucinar erros gramaticais em redações. Sem restrições explícitas, o modelo:

- Afirma "há erros de concordância" sem citar um trecho específico
- Inventa erros que não existem no texto
- Generaliza ("há problemas de coesão") sem evidência verificável
- Mistura erro real com sugestão de estilo no mesmo bloco

O resultado é feedback que não inspira confiança e pode confundir o aluno.

---

## Solução implementada

### 1. System prompt com regras anti-alucinação explícitas

O prompt proíbe afirmar erros gramaticais sem evidência literal:

- Nenhum erro gramatical pode ser mencionado sem apresentar o trecho exato
- Generalização proibida ("há problemas de...")
- Diferenciação obrigatória entre erro real e melhoria de estilo
- Validação interna antes de responder: "O trecho existe? O fenômeno aparece?"

### 2. Separação estrutural no JSON

O antigo campo `evidence: string[]` (genérico) foi substituído por dois arrays com semântica distinta:

**`real_errors`** — somente quando há comprovação no texto:
```json
{
  "type": "concordância verbal",
  "excerpt": "o governo e a sociedade deve agir",
  "explanation": "Sujeito composto exige verbo no plural",
  "correction": "o governo e a sociedade devem agir"
}
```

**`style_improvements`** — sugestões que NÃO são erros:
```json
{
  "excerpt": "É necessário que o Estado tome medidas",
  "suggestion": "A frase é correta mas pode ser mais assertiva",
  "example": "O Estado precisa implementar políticas públicas"
}
```

### 3. Validação defensiva no parser

- `excerpt` é obrigatório em `real_errors` — sem ele, o item é descartado
- `real_errors` e `style_improvements` são arrays vazios como fallback
- Scores continuam com validação estrita (lança exceção se inválido)

---

## Novo formato JSON completo

```json
{
  "score_c1": 120,
  "analysis_c1": {
    "strengths": "O candidato demonstra conhecimento básico da norma culta...",
    "real_errors": [
      {
        "type": "concordância verbal",
        "excerpt": "o governo e a sociedade deve agir",
        "explanation": "Sujeito composto ('o governo e a sociedade') exige verbo no plural.",
        "correction": "o governo e a sociedade devem agir"
      }
    ],
    "style_improvements": [
      {
        "excerpt": "É necessário que medidas sejam tomadas",
        "suggestion": "Voz passiva pode ser substituída por construção mais ativa",
        "example": "O Estado precisa implementar medidas concretas"
      }
    ],
    "lost_points_reason": "Um erro de concordância verbal recorrente reduziu a nota nesta competência.",
    "how_to_improve": "Ao escrever, identifique o núcleo do sujeito. Se for composto, use o verbo no plural.",
    "rewrite_example": "Versão corrigida: 'o governo e a sociedade devem agir em conjunto para...'"
  },
  "score_c2": 160,
  "analysis_c2": { ... },
  ...
  "feedback_general": "Sua redação demonstra domínio do tema e boa argumentação...",
  "priority_improvements": [
    "Revise concordância verbal — um erro recorrente que custou pontos em C1",
    "Desenvolva a proposta de C5 com os 5 elementos ENEM",
    "Use mais conectivos de causa/consequência em C4"
  ]
}
```

---

## Impacto pedagógico

| Antes (v2.0) | Depois (v3.1) |
|---|---|
| `evidence: string[]` — trechos genéricos | `real_errors` — erro + trecho + explicação + correção |
| Sem distinção erro vs. sugestão | `style_improvements` separado de `real_errors` |
| Modelo podia inventar erros | Sem `excerpt` → item descartado pelo parser |
| "há problemas de coesão" | Trecho literal obrigatório |

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `docs/prompts/prompt-correcao-enem.md` | v3.1: regras anti-alucinação, `real_errors`/`style_improvements`, validação interna |
| `apps/web/lib/groq.ts` | Tipos `RealError`, `StyleImprovement`; `normalizeRealError` (excerpt obrigatório); `normalizeStyleImprovement`; `normalizeAnalysis` atualizado |
| `apps/web/app/redacoes/[id]/page.tsx` | `RealErrorItem`, `StyleImprovementItem`; empty state "Não foram identificados erros gramaticais" |

---

## Rendering por competência (atualizado)

```
┌────────────────────────────────────────────────┐
│  C1 — Domínio da língua escrita      [120 pts]  │
├────────────────────────────────────────────────┤
│  O QUE VOCÊ FEZ BEM               [verde]       │
│  O candidato demonstra...                       │
├────────────────────────────────────────────────┤
│  ERROS IDENTIFICADOS NO TEXTO     [vermelho]    │
│  ┌─────────────────────────────────────────┐   │
│  │ concordância verbal                     │   │
│  │ "o governo e a sociedade deve agir"     │   │
│  │ Sujeito composto exige plural.          │   │
│  │ Correção: "devem agir"                  │   │
│  └─────────────────────────────────────────┘   │
│  [se vazio] → "Não foram identificados..."     │
├────────────────────────────────────────────────┤
│  MELHORIAS DE ESTILO              [azul]        │
│  (somente se houver)                            │
├────────────────────────────────────────────────┤
│  ONDE PERDEU PONTOS               [laranja]     │
├────────────────────────────────────────────────┤
│  COMO MELHORAR                    [azul escuro] │
├────────────────────────────────────────────────┤
│  EXEMPLO DE REESCRITA             [fundo azul]  │
└────────────────────────────────────────────────┘
```

---

## Como testar

### Fluxo principal
1. `npm run dev` → enviar redação → "Corrigir agora"
2. Verificar que cada competência mostra a seção "Erros identificados"
3. Se não há erros: "Não foram identificados erros gramaticais relevantes nesta competência."
4. Verificar que `real_errors` sempre têm trecho entre aspas

### Verificar no banco
```sql
SELECT
  feedback->'analysis_c1'->'real_errors' AS erros_reais,
  feedback->'analysis_c1'->'style_improvements' AS melhorias_estilo
FROM essay_corrections
ORDER BY created_at DESC LIMIT 1;
```

### Teste de robustez do parser
Inserir manualmente um `essay_correction` com `real_errors` sem `excerpt`:
```sql
-- O parser descarta itens sem excerpt — a página deve exibir a seção vazia
-- sem lançar erro.
```

---

## Limitações conhecidas

1. **O modelo pode não seguir as regras** — o prompt proíbe alucinação mas não pode garantir 100% de conformidade; revisão humana continua necessária
2. **`real_errors` pode ser vazio mesmo com erros reais** — se o modelo não encontrar o trecho, prefere omitir (comportamento correto segundo o prompt)
3. **Correções antigas (v2.0)** — `real_errors` e `style_improvements` ausentes; a página exibe o empty state graciosamente
4. **`rewrite_example` ainda pode ser parafraseado** — o campo não é validado como trecho literal
