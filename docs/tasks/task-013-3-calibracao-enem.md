# Task 013.3 — Calibração ENEM: Rubricas Oficiais por Competência

**Status:** concluída  
**Data:** 2026-04-28  
**Responsável:** Claude Code (operador técnico)  
**Referências:** Cartilha do(a) Participante 2025 (Inep/MEC), task-013.2

---

## Problema resolvido

A correção anterior (prompt único, v3.2) operava com um único contexto para todas as 5 competências. Os problemas observados:

- **Subavaliação de boas redações**: o modelo inventava penalizações para "parecer rigoroso"
- **Critérios subjetivos**: "introdução mais impactante", "conclusão mais forte", "linguagem mais envolvente" — critérios que não existem na rubrica oficial
- **Contaminação entre competências**: um raciocínio sobre C3 influenciava a nota de C1
- **Ausência de raciocínio explícito**: nenhuma explicação de por que aquele nível de rubrica foi atribuído, não outro

---

## Fontes usadas

- **Cartilha do(a) Participante do ENEM 2025** (Inep/MEC) — rubricas oficiais por competência, critérios de pontuação, exemplos de cada nível

---

## Arquitetura dos 5 prompts

Cada competência tem seu próprio system prompt em `docs/prompts/competencias/`:

| Arquivo | Competência | Foco |
|---|---|---|
| `c1.md` | Domínio da língua escrita formal | Gramática, ortografia, sintaxe, registro |
| `c2.md` | Compreensão da proposta + repertório | Tema, tipo dissertativo-argumentativo, repertório sociocultural |
| `c3.md` | Seleção e organização de argumentos | Progressão temática, autoria, organização |
| `c4.md` | Coesão textual | Conectivos, referenciação, mecanismos coesivos |
| `c5.md` | Proposta de intervenção | Agente, ação, meio, finalidade, detalhamento |

Cada chamada retorna JSON de uma única competência:
```json
{
  "score": 160,
  "strengths": "...",
  "real_errors": [],
  "style_improvements": [],
  "structural_feedback": "...",
  "lost_points_reason": "...",
  "how_to_improve": "...",
  "rewrite_example": "...",
  "rubric_reasoning": "..."
}
```

Após as 5 chamadas paralelas, uma 6ª chamada de síntese gera `feedback_general` e `priority_improvements`.

---

## Fluxo de correção

```
correctEssayWithGroq(essayId, userId)
  │
  ├── buildCompetencyUserPrompt(topic, essay)
  │
  ├── Promise.all([
  │     callGroq(PROMPT_C1, userPrompt, 2000 tokens)  → validateCompetencyResponse
  │     callGroq(PROMPT_C2, userPrompt, 2000 tokens)  → validateCompetencyResponse
  │     callGroq(PROMPT_C3, userPrompt, 2000 tokens)  → validateCompetencyResponse
  │     callGroq(PROMPT_C4, userPrompt, 2000 tokens)  → validateCompetencyResponse
  │     callGroq(PROMPT_C5, userPrompt, 2000 tokens)  → validateCompetencyResponse
  │   ])
  │
  ├── callGroq(PROMPT_SYNTHESIS, synthesisPrompt, 600 tokens)
  │     → validateSynthesisResponse
  │
  └── INSERT essay_corrections → UPDATE essays.status='done'
```

As 5 chamadas rodam em paralelo (`Promise.all`). Latência total ≈ latência da chamada mais lenta (não soma das 5).

---

## Novo campo: `rubric_reasoning`

Adicionado a `CompetencyAnalysis`:

```typescript
type CompetencyAnalysis = {
  strengths: string
  real_errors: RealError[]
  style_improvements: StyleImprovement[]
  structural_feedback: string
  lost_points_reason: string
  how_to_improve: string
  rewrite_example: string
  rubric_reasoning: string  // ← novo
}
```

Exibido na UI na seção "Por que essa nota?" (antes dos pontos fortes, em cinza suave). Oculto se `< 20 chars` (correções antigas sem o campo).

---

## Modelo recomendado

```
GROQ_MODEL=openai/gpt-oss-120b
```

Fallback no código: `llama-3.3-70b-versatile`.

O modelo `openai/gpt-oss-120b` produz raciocínio mais calibrado com rubricas detalhadas. O `llama-3.3-70b-versatile` ainda funciona mas tende a ser mais conservador nas notas altas.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `docs/prompts/competencias/c1.md` | criado — prompt C1 com rubrica oficial |
| `docs/prompts/competencias/c2.md` | criado — prompt C2 com rubrica oficial |
| `docs/prompts/competencias/c3.md` | criado — prompt C3 com rubrica oficial |
| `docs/prompts/competencias/c4.md` | criado — prompt C4 com rubrica oficial |
| `docs/prompts/competencias/c5.md` | criado — prompt C5 com rubrica oficial |
| `apps/web/lib/groq.ts` | arquitetura 5+1 chamadas; `rubric_reasoning` em `CompetencyAnalysis`; `validateCompetencyResponse`; `validateSynthesisResponse`; `callGroq` helper |
| `apps/web/app/redacoes/[id]/page.tsx` | seção "Por que essa nota?" com `rubric_reasoning` |
| `apps/web/.env.example` | `GROQ_MODEL=openai/gpt-oss-120b` |

---

## Como testar

### Configurar `.env.local`

```env
GROQ_MODEL=openai/gpt-oss-120b
```

### Fluxo principal

1. `npm run dev` → enviar redação → "Corrigir agora"
2. Para cada competência, verificar:
   - Seção "Por que essa nota?" aparece com texto específico
   - A nota reflete a rubrica (200 não deve ter `lost_points_reason` com penalização)
   - `real_errors` têm trecho literal
3. Verificar no banco:
```sql
SELECT
  feedback->'analysis_c1'->'rubric_reasoning' AS raciocinio_c1,
  feedback->'score_c1' AS nota_c1
FROM essay_corrections ORDER BY created_at DESC LIMIT 1;
```

### Teste com redação nota 1000

Enviar redação que atenda plenamente às 5 competências. Esperar:
- `score_c1 = 200` com `real_errors = []`
- `score_c2 = 200` com `lost_points_reason` indicando ausência de perda
- `score_c3 = 200` sem menção a "introdução fraca"
- `score_c4 = 200` com `rubric_reasoning` citando repertório coesivo diversificado
- `score_c5 = 200` com todos os elementos da proposta identificados

---

## Limitações conhecidas

1. **6 chamadas de API**: latência das 5 paralelas + 1 síntese. Para o modelo `openai/gpt-oss-120b`, pode ser 15-30s. Para `llama-3.3-70b`, mais rápido mas menos preciso.
2. **Consistência entre chamadas**: as 5 competências são avaliadas de forma independente. O modelo pode ter avaliações que, em conjunto, parecem inconsistentes (ex: C1 com 200 mas C4 com 80 para o mesmo trecho).
3. **Correções antigas incompatíveis**: registros sem `rubric_reasoning` exibem "Por que essa nota?" em branco (oculto por `< 20 chars`).
4. **Tokens**: 6 chamadas × ~2000 tokens = significativamente mais tokens que o prompt único anterior (~6000 tokens). Custo por correção ~2-3× maior.
5. **Prompt fidelidade**: o modelo pode ignorar regras do prompt — a rubrica proíbe critérios subjetivos, mas não garante 100% de conformidade.
