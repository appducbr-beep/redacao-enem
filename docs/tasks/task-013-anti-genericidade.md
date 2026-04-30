# Task 013.2 — Anti-genericidade + Precisão Pedagógica

**Status:** concluída  
**Data:** 2026-04-27  
**Responsável:** Claude Code (operador técnico)  
**Referências:** task-013.1, docs/prompts/prompt-correcao-enem.md v3.2

---

## Problema resolvido

Mesmo com as regras anti-alucinação da Task 013.1, o modelo produzia feedback genérico:

- "Melhorar a coesão textual" — sem citar trecho
- "Aprofundar a argumentação" — sem referenciar o texto
- `style_improvements` sem `excerpt` — sugestões flutuantes desvinculadas do texto
- `structural_feedback` de uma frase: "A estrutura poderia ser melhorada"

Esse tipo de feedback é inútil pedagogicamente: o aluno não sabe **o quê** melhorar **onde**.

---

## Solução implementada

### 1. System prompt v3.2 — regra de especificidade

Nova regra crítica antes de qualquer outra:

> "Todo comentário deve ser ESPECÍFICO ao texto do aluno."
> Validação obrigatória: "Isso se aplica especificamente a este texto?"
> Se genérico → NÃO incluir.

Lista de frases proibidas por nome:
- "melhorar coesão", "variar conectivos", "aprofundar argumentação", "usar mais repertório", "melhorar estrutura", "utilizar linguagem mais formal"
- Permitidas apenas se acompanhadas de trecho, problema específico e melhoria concreta.

Objetivo final reformulado:
> "O aluno deve pensar: 'Isso foi escrito especificamente para o meu texto.'"

### 2. Novo campo `structural_feedback` por competência

Adicionado em `CompetencyAnalysis`. Diferente dos outros campos:
- Foco macro: como a competência se manifesta na estrutura deste texto
- Deve citar **comportamento observado**, não prescrição genérica
- Exemplos válidos: "O candidato iniciou com tese clara mas não retomou na conclusão", "C4 está prejudicado pela ausência de conectivos causais — todas as orações foram coordenadas com 'e'"
- Exemplos inválidos: "Melhorar a coesão", "Usar mais conectivos"

### 3. Filtragem de `style_improvements` genéricas no frontend

Heurística aplicada no `CompetencyBlock`:
```typescript
const styleImprovements = (analysis.style_improvements ?? []).filter(
  (item) =>
    item.excerpt.trim().length > 0 &&               // tem trecho específico
    (item.suggestion.trim().length + item.example.trim().length) >= 40  // tem conteúdo
)
```

Se um `style_improvement` não tem `excerpt` ou tem conteúdo trivial, é silenciosamente ocultado.

### 4. Filtragem de `structural_feedback` curtos

```typescript
const showStructuralFeedback = structuralFeedback.trim().length >= 50
```

Textos < 50 chars são tipicamente genéricos ("Estrutura poderia ser melhorada."). Ocultar e mostrar "Análise não disponível" é mais honesto que exibir conteúdo vazio.

---

## Campos atualizados por competência

```typescript
type CompetencyAnalysis = {
  strengths: string
  real_errors: RealError[]
  style_improvements: StyleImprovement[]
  structural_feedback: string           // ← novo
  lost_points_reason: string
  how_to_improve: string
  rewrite_example: string
}
```

---

## Exemplo real de saída esperada (C3)

```json
{
  "score_c3": 120,
  "analysis_c3": {
    "strengths": "O candidato organiza o texto em três partes distintas: introdução com contextualização, dois parágrafos de desenvolvimento e conclusão com proposta.",
    "real_errors": [],
    "style_improvements": [
      {
        "excerpt": "Além disso, o problema é grave. Por isso, precisamos agir.",
        "suggestion": "As orações estão corretas mas a progressão é abrupta — falta transição que conecte a gravidade do problema à necessidade de ação.",
        "example": "Dado o impacto socioeconômico descrito, torna-se urgente que medidas sejam adotadas."
      }
    ],
    "structural_feedback": "A introdução apresenta contextualização adequada mas não formula tese explícita — o leitor não sabe qual posição o candidato defende antes do segundo parágrafo. O desenvolvimento tem dois argumentos mas o segundo não aprofunda: retoma a ideia do primeiro com vocabulário diferente. A conclusão propõe intervenção mas não retoma os argumentos desenvolvidos.",
    "lost_points_reason": "Perda de 80 pontos por progressão temática limitada: o segundo parágrafo não avança sobre o primeiro, e a conclusão está desconectada do desenvolvimento.",
    "how_to_improve": "Formule tese na introdução (ex: 'Neste texto, defendo que...'). No segundo parágrafo, parta de onde o primeiro terminou e aprofunde a causa ou a consequência, não repita. Na conclusão, retome os dois argumentos antes da proposta.",
    "rewrite_example": "Versão da conclusão: 'Diante da exclusão digital que afeta jovens de baixa renda (arg. 1) e da ausência de infraestrutura em escolas públicas (arg. 2), propõe-se que o governo federal implante laboratórios de informática nas 5.000 escolas com menor IDH...'"
  }
}
```

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `docs/prompts/prompt-correcao-enem.md` | v3.2: regra de especificidade, proibição de frases genéricas, `structural_feedback` definido por competência |
| `apps/web/lib/groq.ts` | `structural_feedback: string` em `CompetencyAnalysis`; `normalizeAnalysis` extrai com fallback `''`; `SYSTEM_PROMPT` e `buildUserPrompt` sincronizados com v3.2 |
| `apps/web/app/redacoes/[id]/page.tsx` | Seção "Análise estrutural" em roxo; filtro de `style_improvements` por `excerpt + tamanho`; `structural_feedback` oculto se < 50 chars |

---

## Rendering atualizado por competência

```
┌──────────────────────────────────────────────────┐
│  C3 — Seleção e organização          [120 pts]   │
├──────────────────────────────────────────────────┤
│  O QUE VOCÊ FEZ BEM          [verde]             │
│  O candidato organiza o texto em...              │
├──────────────────────────────────────────────────┤
│  ERROS IDENTIFICADOS         [vermelho]          │
│  Não foram identificados...                      │
├──────────────────────────────────────────────────┤
│  ANÁLISE ESTRUTURAL          [roxo]              │
│  A introdução apresenta contextualização...      │
│  [ou: "Análise não disponível." se < 50 chars]   │
├──────────────────────────────────────────────────┤
│  MELHORIAS DE ESTILO         [azul]              │
│  "Além disso, o problema é grave..."             │
│  [oculto se sem excerpt ou conteúdo < 40 chars]  │
├──────────────────────────────────────────────────┤
│  ONDE PERDEU PONTOS          [laranja]           │
├──────────────────────────────────────────────────┤
│  COMO MELHORAR               [azul escuro]       │
├──────────────────────────────────────────────────┤
│  EXEMPLO DE REESCRITA        [fundo azul]        │
└──────────────────────────────────────────────────┘
```

---

## Como testar

1. `npm run dev` → enviar redação → "Corrigir agora"
2. Para cada competência, verificar:
   - "Análise estrutural" mostra texto específico ao essay (> 50 chars)
   - "Melhorias de estilo" não aparecem se não houver `excerpt`
   - "Não foram identificados erros..." quando `real_errors` vazio
3. Verificar no banco:
```sql
SELECT feedback->'analysis_c3'->'structural_feedback' AS struct
FROM essay_corrections ORDER BY created_at DESC LIMIT 1;
```

---

## Limitações conhecidas

1. **Limiar de 50 chars é arbitrário** — um `structural_feedback` de 45 chars pode ser específico; um de 200 chars pode ser genérico. O limiar é uma heurística, não uma garantia.
2. **O modelo pode ignorar as regras** — o prompt proíbe mas não pode garantir 100% de conformidade.
3. **`style_improvements` filtradas não avisam o aluno** — as sugestões ocultadas desaparecem silenciosamente; não há indicação de que foram filtradas.
4. **Correções antigas (v3.1 ou anterior)** — não têm `structural_feedback`; a seção exibe "Análise não disponível." corretamente.
