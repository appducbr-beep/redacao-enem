# Task 013 — Correção Pedagógica (Prompt v2.0)

**Status:** concluída  
**Data:** 2026-04-27  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.5, task-012, docs/prompts/prompt-correcao-enem.md v2.0

---

## Objetivo

Transformar o Reda1000 de corretor de notas em treinador de redação. Cada competência passa a entregar análise pedagógica completa: o que o aluno fez bem, onde perdeu pontos, evidências no texto, orientação prática e exemplo de reescrita.

**Fora de escopo:** alteração de banco, enum, fluxo de créditos, envio de redação.

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `docs/prompts/prompt-correcao-enem.md` | v2.0: sistema prompt pedagógico + novo JSON flat com analysis_cN |
| `apps/web/lib/groq.ts` | Novo tipo `GroqCorrection`, validação score\_cN, `normalizeAnalysis` defensivo, max\_tokens 6000 |
| `apps/web/app/redacoes/[id]/page.tsx` | Componente `CompetencyBlock` com 5 seções por competência |

---

## Novo formato JSON (v2.0)

```json
{
  "score_c1": 120,
  "analysis_c1": {
    "strengths": "O candidato demonstra domínio básico da norma culta...",
    "weaknesses": "Foram identificados erros de concordância nominal...",
    "lost_points_reason": "A perda de 80 pontos se deve principalmente a erros recorrentes de concordância...",
    "evidence": [
      "as problema sociais precisam ser resolvidos",
      "o governo e a sociedade deve agir"
    ],
    "how_to_improve": "Revise concordância nominal e verbal. Para cada substantivo, identifique...",
    "rewrite_example": "Versão corrigida: 'os problemas sociais precisam ser resolvidos' e 'o governo e a sociedade devem agir'"
  },
  "score_c2": 160,
  "analysis_c2": { ... },
  "score_c3": 120,
  "analysis_c3": { ... },
  "score_c4": 80,
  "analysis_c4": { ... },
  "score_c5": 120,
  "analysis_c5": { ... },
  "feedback_general": "Sua redação demonstra boa compreensão do tema e capacidade argumentativa...",
  "priority_improvements": [
    "Revise concordância verbal e nominal — é a maior causa de perda de pontos em C1",
    "Desenvolva a proposta de intervenção com os 5 elementos ENEM em C5",
    "Use mais conectivos de causa e consequência em C4"
  ]
}
```

### Campos por competência

| Campo | Descrição |
|---|---|
| `strengths` | O que o aluno fez bem nesta competência |
| `weaknesses` | Principais problemas identificados |
| `lost_points_reason` | Por que perdeu pontos — critério ENEM violado |
| `evidence` | Trechos literais do texto que exemplificam os problemas |
| `how_to_improve` | Orientação prática com passos concretos |
| `rewrite_example` | Trecho reescrito com o problema corrigido |

---

## Impacto pedagógico

### Antes (v1.0)
- Nota por competência + 1 parágrafo genérico de feedback
- Sem evidências do texto
- Sem exemplo de reescrita
- Sem prioridades claras

### Depois (v2.0)
- Nota + 6 campos de análise por competência (30 campos no total)
- Evidências: trechos reais do texto do aluno (não inventados)
- Exemplo de reescrita: mostra a versão melhorada
- 3 prioridades numeradas para a próxima redação
- Linguagem didática nível ensino médio
- Regras pedagógicas no system prompt (7 regras obrigatórias)

---

## Arquitetura de validação em `lib/groq.ts`

### Scores — validação estrita
- `score_c1` a `score_c5` devem ser `number` ∈ {0, 40, 80, 120, 160, 200}
- Se inválido: exceção → `essays.status = 'error'` + `refund_credit`

### Analysis — fallback defensivo
- Se `analysis_cN` estiver ausente ou malformado: `normalizeAnalysis` retorna objeto com campos em branco
- Erros textuais não disparam refund (apenas scores inválidos fazem isso)
- Warnings no console para diagnóstico

### `max_tokens: 6000`
- O novo formato é ~4× maior que o v1.0 (2048 seria insuficiente e truncaria o JSON)

### Mapeamento JSON → banco
- `score_c1 → c1`, `score_c2 → c2`, ... (colunas `smallint` com CHECK)
- `feedback` (JSONB) armazena o objeto `GroqCorrection` completo
- `total_score` é GENERATED — nunca inserido

---

## Rendering por competência (`CompetencyBlock`)

```
┌─────────────────────────────────────────────┐
│  C1 — Domínio da língua escrita    [120 pts] │  ← header cinza
├─────────────────────────────────────────────┤
│  O QUE VOCÊ FEZ BEM                         │  ← verde
│  strengths...                               │
├─────────────────────────────────────────────┤
│  ONDE PERDEU PONTOS                         │  ← vermelho
│  lost_points_reason + weaknesses...         │
├─────────────────────────────────────────────┤
│  TRECHOS DO SEU TEXTO                       │  ← citações com borda
│  "as problema sociais..."                   │
├─────────────────────────────────────────────┤
│  COMO MELHORAR                              │  ← azul
│  how_to_improve...                          │
├─────────────────────────────────────────────┤
│  EXEMPLO DE REESCRITA               [azul]  │  ← fundo azul claro
│  rewrite_example...                         │
└─────────────────────────────────────────────┘
```

Cores das notas: verde ≥ 160 · amarelo ≥ 80 · vermelho < 80

---

## Como testar

### Pré-requisitos
1. `GROQ_API_KEY`, `GROQ_MODEL`, `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
2. Migrations 011 e 012 aplicadas no Supabase
3. `cd apps/web && npm run dev`

### Fluxo completo
1. Login → `/temas` → tema gratuito → escrever redação ≥ 800 chars → enviar
2. Na página `/redacoes/<id>`: clicar **"Corrigir agora"**
3. Aguardar 10–40s (o novo prompt é maior)
4. **Verificar:**
   - Nota total exibida
   - 5 blocos de competência, cada um com seções coloridas
   - Trechos do texto entre aspas (evidências reais)
   - Exemplo de reescrita em fundo azul
   - Lista numerada de 3 prioridades

### Verificar no banco
```sql
SELECT feedback FROM essay_corrections ORDER BY created_at DESC LIMIT 1;
```
Deve conter `score_c1`, `analysis_c1`, etc. — não mais `competencias.c1.nota`.

### Teste de análise incompleta (simulação)
No SQL Editor, inserir manualmente um `essay_correction` com `feedback` sem `analysis_c1`:
```sql
-- A página deve exibir "Análise não disponível para esta competência."
-- sem lançar erro.
```

---

## Limitações conhecidas

1. **Tempo de resposta maior** — o prompt v2.0 gera ~4× mais tokens (~20–40s vs ~10s antes)
2. **Evidências podem ser imprecisas** — o modelo pode citar trechos parafraseados, não literais
3. **Correções antigas** — essays corrigidas com prompt v1.0 não têm `analysis_cN`; a página exibe "Análise não disponível"
4. **`rewrite_example` pode ser longo** — sem limite de caracteres no campo; UI trunca naturalmente
5. **Sem retry automático** — se o JSON vier com score inválido, a correção falha sem nova tentativa

---

## Próxima task sugerida

**Task 014 — Histórico de Redações**
- Página `/redacoes` listando todas as redações do usuário
- Status visual (badge por `pending/processing/done/error`)
- Nota total quando `done`
- Link para `/redacoes/[id]`
