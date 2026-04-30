import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { callOpenAI, getOpenAIModel } from '@/lib/openai'

const VALID_SCORES = new Set([0, 40, 80, 120, 160, 200])

type MotivationalText = {
  type: string
  source: string
  content?: string
  url?: string
}

export type RealError = {
  type: string
  excerpt: string
  explanation: string
  correction: string
}

export type StyleImprovement = {
  excerpt: string
  suggestion: string
  example: string
}

export type CompetencyAnalysis = {
  strengths: string
  real_errors: RealError[]
  style_improvements: StyleImprovement[]
  structural_feedback: string
  lost_points_reason: string
  how_to_improve: string
  rewrite_example: string
  rubric_reasoning: string
}

export type GroqCorrection = {
  score_c1: number
  analysis_c1: CompetencyAnalysis
  score_c2: number
  analysis_c2: CompetencyAnalysis
  score_c3: number
  analysis_c3: CompetencyAnalysis
  score_c4: number
  analysis_c4: CompetencyAnalysis
  score_c5: number
  analysis_c5: CompetencyAnalysis
  feedback_general: string
  priority_improvements: string[]
}

// ── System prompts — sincronizados com docs/prompts/competencias/cN.md ────────

const PROMPT_C1 = `Você é um corretor especialista em redações do ENEM, calibrado pela Cartilha do(a) Participante 2025 (Inep/MEC).

Avalie esta redação APENAS na Competência 1 — Domínio da Modalidade Escrita Formal da Língua Portuguesa.

O QUE ESTA COMPETÊNCIA AVALIA
Domínio da norma culta escrita: ortografia, acentuação, pontuação, construção sintática, concordância verbal e nominal, regência, crase, escolha vocabular e adequação ao registro formal.

RUBRICA OFICIAL
200 — Excelente domínio. Eventuais desvios tratados como excepcionalidade, sem reincidência.
160 — Bom domínio. Poucos desvios.
120 — Domínio mediano. Alguns desvios.
 80 — Domínio insuficiente. Muitos desvios.
 40 — Domínio precário. Frequentes e graves desvios.
  0 — Desconhecimento da modalidade escrita formal ou cópia dos textos motivadores.

REGRAS CRÍTICAS
1. Só apontar erro gramatical se houver trecho literal do texto.
2. Não confundir variação estilística com desvio da norma culta.
3. Não penalizar escolha de registro como se fosse erro gramatical.
4. 200 não exige perfeição absoluta — exige excelente domínio com desvios raros e sem reincidência.
5. Se não houver erro verificável: real_errors = [].
6. Não inventar erro para justificar nota abaixo de 200.

JSON ESPERADO
{
  "score": <0|40|80|120|160|200>,
  "strengths": "<o que o candidato fez bem em C1>",
  "real_errors": [{ "type": "...", "excerpt": "<trecho literal>", "explanation": "...", "correction": "..." }],
  "style_improvements": [{ "excerpt": "...", "suggestion": "...", "example": "..." }],
  "structural_feedback": "<como a construção sintática e o registro formal se manifestam neste texto>",
  "lost_points_reason": "<por que perdeu pontos; se score=200, indicar que não houve perda relevante>",
  "how_to_improve": "<orientação concreta>",
  "rewrite_example": "<trecho reescrito>",
  "rubric_reasoning": "<2-3 frases: por que este nível foi atribuído, citando elementos observados no texto>"
}
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`

const PROMPT_C2 = `Você é um corretor especialista em redações do ENEM, calibrado pela Cartilha do(a) Participante 2025 (Inep/MEC).

Avalie esta redação APENAS na Competência 2 — Compreensão da Proposta de Redação e Aplicação de Conceitos das Várias Áreas do Conhecimento para Desenvolver o Tema.

O QUE ESTA COMPETÊNCIA AVALIA
1. Compreensão do tema: o candidato abordou o tema proposto de forma adequada?
2. Domínio do tipo dissertativo-argumentativo: tese, argumentação, defesa de ponto de vista?
3. Repertório sociocultural: utilizou conhecimentos de diversas áreas de forma pertinente e produtiva?

RUBRICA OFICIAL
200 — Desenvolve o tema com argumentação consistente, repertório sociocultural pertinente e produtivo e excelente domínio do tipo dissertativo-argumentativo.
160 — Desenvolve o tema com argumentação consistente, repertório pertinente e bom domínio do tipo.
120 — Desenvolve o tema com argumentação previsível ou repertório pouco produtivo. Domínio mediano do tipo.
 80 — Argumentação insuficiente ou tangencia o tema. Domínio insuficiente do tipo.
 40 — Precário domínio do tipo ou tangencia o tema de forma não produtiva.
  0 — Cópia dos textos motivadores, fuga ao tema ou ausência do tipo dissertativo-argumentativo.

REGRAS CRÍTICAS
1. Não penalizar ausência de estatística se houver repertório sociocultural produtivo de outra forma.
2. Não exigir nomes próprios, datas ou dados específicos como obrigatórios.
3. Avaliar se o repertório é PRODUTIVO (relacionado ao tema e ao argumento), não apenas se é sofisticado.
4. Não exigir aprofundamento extra se o texto já desenvolve o tema de forma consistente.
5. Não confundir argumentação previsível (120) com argumentação insuficiente (80).
6. Não penalizar ausência de elemento opcional.

JSON ESPERADO
{
  "score": <0|40|80|120|160|200>,
  "strengths": "<o que o candidato fez bem em C2>",
  "real_errors": [],
  "style_improvements": [{ "excerpt": "...", "suggestion": "...", "example": "..." }],
  "structural_feedback": "<como a compreensão do tema, o repertório e o tipo dissertativo-argumentativo se manifestam neste texto>",
  "lost_points_reason": "<por que perdeu pontos; se score=200, indicar que não houve perda relevante>",
  "how_to_improve": "<orientação concreta>",
  "rewrite_example": "<trecho reescrito>",
  "rubric_reasoning": "<2-3 frases: por que este nível foi atribuído>"
}
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`

const PROMPT_C3 = `Você é um corretor especialista em redações do ENEM, calibrado pela Cartilha do(a) Participante 2025 (Inep/MEC).

Avalie esta redação APENAS na Competência 3 — Seleção, Relação, Organização e Interpretação de Informações, Fatos, Opiniões e Argumentos em Defesa de um Ponto de Vista.

O QUE ESTA COMPETÊNCIA AVALIA
Capacidade de selecionar, organizar e relacionar informações em torno de um ponto de vista, com progressão temática e marcas de autoria.

RUBRICA OFICIAL
200 — Informações relacionadas ao tema de forma consistente e organizada, com autoria e defesa clara do ponto de vista.
160 — Informações organizadas com indícios de autoria e defesa do ponto de vista.
120 — Informações limitadas, pouco organizadas ou com poucas marcas de autoria.
 80 — Defesa de ponto de vista insuficiente ou com organização precária.
 40 — Articulação muito precária das informações.
  0 — Ausência de projeto de texto ou não defesa de ponto de vista.

REGRAS CRÍTICAS
1. PROIBIDO penalizar por "introdução pouco impactante", "conclusão pouco marcante" ou "texto pouco interessante" — não são critérios da rubrica.
2. Penalizar apenas se houver problema real identificável: lacuna argumentativa, repetição de ideia sem avanço, contradição interna, progressão temática quebrada.
3. Não confundir argumentação simples (legítima) com argumentação insuficiente (penalizável).
4. Citar comportamento observado no texto — não prescrição genérica.
5. Se o texto defende ponto de vista com organização clara, não penalizar por "falta de profundidade" subjetiva.

JSON ESPERADO
{
  "score": <0|40|80|120|160|200>,
  "strengths": "<o que o candidato fez bem em C3>",
  "real_errors": [],
  "style_improvements": [{ "excerpt": "...", "suggestion": "...", "example": "..." }],
  "structural_feedback": "<como a seleção e organização dos argumentos se manifestam neste texto — cite comportamento observado>",
  "lost_points_reason": "<por que perdeu pontos; se score=200, indicar que não houve perda relevante>",
  "how_to_improve": "<orientação concreta>",
  "rewrite_example": "<trecho reescrito>",
  "rubric_reasoning": "<2-3 frases: por que este nível foi atribuído, citando progressão, organização e autoria observadas>"
}
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`

const PROMPT_C4 = `Você é um corretor especialista em redações do ENEM, calibrado pela Cartilha do(a) Participante 2025 (Inep/MEC).

Avalie esta redação APENAS na Competência 4 — Demonstração de Conhecimento dos Mecanismos Linguísticos Necessários para a Construção da Argumentação.

O QUE ESTA COMPETÊNCIA AVALIA
Uso dos mecanismos de coesão textual: conectivos e conjunções, referenciação (pronomes, sinônimos, hiperônimos), substituição lexical, elipse. Esses mecanismos articulam as partes do texto e marcam relações lógicas.

RUBRICA OFICIAL
200 — Articula bem as partes do texto. Repertório diversificado e adequado de recursos coesivos.
160 — Articula bem com poucas inadequações. Repertório diversificado de recursos coesivos.
120 — Articulação mediana com inadequações recorrentes e pouco repertório de recursos coesivos.
 80 — Articulação insuficiente com muitas inadequações.
 40 — Articulação precária comprometendo a progressão do texto.
  0 — Ausência de articulação.

REGRAS CRÍTICAS
1. Não dizer "varie os conectivos" genericamente — só apontar problema se houver trecho com repetição inadequada, conector usado de forma errada ou quebra de referência.
2. Citar o trecho onde o problema coesivo aparece.
3. Não penalizar uso funcional de "Portanto", "Além disso" ou "No entanto" apenas por frequência — só penalizar se o uso for inadequado ou prejudicar a progressão.
4. Diferenciar coesão simples mas funcional (não penalizável) de ausência ou inadequação (penalizável).
5. Não confundir problemas de coerência (C3) com problemas de coesão (C4).

JSON ESPERADO
{
  "score": <0|40|80|120|160|200>,
  "strengths": "<o que o candidato fez bem em C4>",
  "real_errors": [],
  "style_improvements": [{ "excerpt": "<trecho com problema coesivo>", "suggestion": "...", "example": "..." }],
  "structural_feedback": "<análise dos mecanismos coesivos deste texto — cite recursos usados e inadequações concretas>",
  "lost_points_reason": "<por que perdeu pontos; se score=200, indicar que não houve perda relevante>",
  "how_to_improve": "<orientação concreta>",
  "rewrite_example": "<trecho reescrito com melhor coesão>",
  "rubric_reasoning": "<2-3 frases: por que este nível foi atribuído, citando mecanismos coesivos observados>"
}
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`

const PROMPT_C5 = `Você é um corretor especialista em redações do ENEM, calibrado pela Cartilha do(a) Participante 2025 (Inep/MEC).

Avalie esta redação APENAS na Competência 5 — Elaboração de Proposta de Intervenção para o Problema Abordado, Respeitando os Direitos Humanos.

O QUE ESTA COMPETÊNCIA AVALIA
A proposta de intervenção deve: estar relacionada ao tema, articular-se com a discussão desenvolvida, respeitar os direitos humanos e valores democráticos.
Elementos avaliados: agente (quem executa), ação (o que fazer), meio/modo (como), finalidade/efeito (para quê) e detalhamento.

RUBRICA OFICIAL
200 — Proposta muito bem elaborada, detalhada e articulada à discussão e ao tema.
160 — Proposta bem elaborada, com a maioria dos elementos, articulada ao tema.
120 — Proposta mediana, com poucos elementos ou pouco articulada à discussão.
 80 — Proposta vaga ou desconectada do tema e do desenvolvimento.
 40 — Proposta precária ou apenas tangencial ao tema.
  0 — Ausência de proposta, afronta à democracia ou aos direitos humanos, ou cópia.

REGRAS CRÍTICAS
1. Não penalizar se os elementos estiverem presentes sem a terminologia exata "agente, ação, meio, finalidade" — avaliar a substância.
2. Não sugerir intervenção diferente do tema abordado no texto.
3. Não exigir todos os 5 elementos para nota 160 — o critério é "bem elaborada e articulada".
4. Verificar articulação: a proposta segue logicamente da discussão desenvolvida?
5. Se score < 200, citar qual(is) elemento(s) estavam ausentes ou vagos.

JSON ESPERADO
{
  "score": <0|40|80|120|160|200>,
  "strengths": "<o que o candidato fez bem em C5>",
  "real_errors": [],
  "style_improvements": [],
  "structural_feedback": "<análise da proposta: elementos presentes, ausentes ou vagos — cite o texto>",
  "lost_points_reason": "<por que perdeu pontos; se score=200, indicar que não houve perda relevante>",
  "how_to_improve": "<orientação concreta>",
  "rewrite_example": "<exemplo de proposta mais completa baseada no tema deste texto>",
  "rubric_reasoning": "<2-3 frases: por que este nível foi atribuído, citando os elementos da proposta observados>"
}
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`

const PROMPT_SYNTHESIS = `Você é um corretor especialista em redações do ENEM.

Com base nos resultados por competência fornecidos, gere:
1. Uma avaliação geral em 3-4 frases sobre a redação como um todo — específica a este texto, não genérica.
2. As 3 melhorias mais importantes para a próxima redação — concretas e acionáveis.

Retorne SOMENTE o JSON:
{
  "feedback_general": "<avaliação geral em 3-4 frases>",
  "priority_improvements": ["<melhoria concreta 1>", "<melhoria 2>", "<melhoria 3>"]
}
Sem texto adicional.`

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMotivationalTexts(texts: MotivationalText[] | null): string {
  if (!texts || texts.length === 0) return 'Não fornecidos'
  return texts
    .map((t, i) => {
      const parts = [`[Texto ${i + 1}]`]
      if (t.content) parts.push(t.content)
      if (t.source) parts.push(`Fonte: ${t.source}`)
      return parts.join('\n')
    })
    .join('\n\n')
}

function buildCompetencyUserPrompt(
  topicTitle: string,
  topicDescription: string | null,
  motivationalTexts: MotivationalText[] | null,
  essayContent: string
): string {
  return `TEMA: ${topicTitle}
PROPOSTA: ${topicDescription ?? 'Não fornecida'}
TEXTOS MOTIVADORES:
${formatMotivationalTexts(motivationalTexts)}

---

REDAÇÃO DO CANDIDATO:
${essayContent}

---

Avalie esta redação na competência indicada no sistema.
Retorne SOMENTE o JSON. Sem markdown, sem texto adicional.`
}

function buildSynthesisUserPrompt(
  topicTitle: string,
  results: Array<{ label: string; score: number; rubric_reasoning: string }>
): string {
  const lines = results
    .map((r) => `${r.label} (${r.score} pts): ${r.rubric_reasoning}`)
    .join('\n')
  return `Tema: ${topicTitle}

Resultados por competência:
${lines}

Gere a avaliação geral e as 3 prioridades de melhoria conforme as instruções do sistema.`
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeRealError(raw: unknown): RealError | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  if (typeof e.excerpt !== 'string' || !e.excerpt.trim()) return null
  return {
    type: typeof e.type === 'string' ? e.type : 'erro',
    excerpt: e.excerpt.trim(),
    explanation: typeof e.explanation === 'string' ? e.explanation : '',
    correction: typeof e.correction === 'string' ? e.correction : '',
  }
}

function normalizeStyleImprovement(raw: unknown): StyleImprovement | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  return {
    excerpt: typeof e.excerpt === 'string' ? e.excerpt : '',
    suggestion: typeof e.suggestion === 'string' ? e.suggestion : '',
    example: typeof e.example === 'string' ? e.example : '',
  }
}

function normalizeAnalysis(raw: Record<string, unknown>): CompetencyAnalysis {
  const real_errors = Array.isArray(raw.real_errors)
    ? (raw.real_errors as unknown[])
        .map(normalizeRealError)
        .filter((e): e is RealError => e !== null)
    : []

  const style_improvements = Array.isArray(raw.style_improvements)
    ? (raw.style_improvements as unknown[])
        .map(normalizeStyleImprovement)
        .filter((e): e is StyleImprovement => e !== null)
    : []

  return {
    strengths: typeof raw.strengths === 'string' ? raw.strengths : '',
    real_errors,
    style_improvements,
    structural_feedback: typeof raw.structural_feedback === 'string' ? raw.structural_feedback : '',
    lost_points_reason: typeof raw.lost_points_reason === 'string' ? raw.lost_points_reason : '',
    how_to_improve: typeof raw.how_to_improve === 'string' ? raw.how_to_improve : '',
    rewrite_example: typeof raw.rewrite_example === 'string' ? raw.rewrite_example : '',
    rubric_reasoning: typeof raw.rubric_reasoning === 'string' ? raw.rubric_reasoning : '',
  }
}

type CompetencyResult = { score: number; analysis: CompetencyAnalysis }

function validateCompetencyResponse(parsed: unknown): CompetencyResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Resposta da competência não é um objeto JSON válido')
  }
  const p = parsed as Record<string, unknown>
  const score = p.score
  if (typeof score !== 'number') {
    throw new Error(`Campo "score" ausente ou não numérico: ${JSON.stringify(score)}`)
  }
  if (!VALID_SCORES.has(score)) {
    throw new Error(`Score inválido: ${score}. Deve ser 0, 40, 80, 120, 160 ou 200.`)
  }
  return { score, analysis: normalizeAnalysis(p) }
}

function validateSynthesisResponse(
  parsed: unknown
): { feedback_general: string; priority_improvements: string[] } {
  if (!parsed || typeof parsed !== 'object') {
    return { feedback_general: '', priority_improvements: [] }
  }
  const p = parsed as Record<string, unknown>
  return {
    feedback_general: typeof p.feedback_general === 'string' ? p.feedback_general : '',
    priority_improvements: Array.isArray(p.priority_improvements)
      ? (p.priority_improvements as unknown[]).filter((e): e is string => typeof e === 'string')
      : [],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function correctEssayWithGroq(essayId: string, userId: string): Promise<void> {
  const { data: essay, error: fetchError } = await supabaseAdmin
    .from('essays')
    .select('id, user_id, content, essay_topics(title, description, motivational_texts)')
    .eq('id', essayId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !essay) {
    throw new Error(`Essay não encontrada ou acesso negado: ${essayId}`)
  }

  const topic = (essay.essay_topics as unknown) as {
    title: string
    description: string | null
    motivational_texts: MotivationalText[] | null
  } | null

  if (!topic) throw new Error('Tema da redação não encontrado')

  try {
    const userPrompt = buildCompetencyUserPrompt(
      topic.title,
      topic.description,
      topic.motivational_texts,
      essay.content as string
    )

    // 5 competency calls in parallel
    const [call1, call2, call3, call4, call5] = await Promise.all([
      callOpenAI(PROMPT_C1, userPrompt, 2000),
      callOpenAI(PROMPT_C2, userPrompt, 2000),
      callOpenAI(PROMPT_C3, userPrompt, 2000),
      callOpenAI(PROMPT_C4, userPrompt, 2000),
      callOpenAI(PROMPT_C5, userPrompt, 2000),
    ])

    const r1 = validateCompetencyResponse(call1.parsed)
    const r2 = validateCompetencyResponse(call2.parsed)
    const r3 = validateCompetencyResponse(call3.parsed)
    const r4 = validateCompetencyResponse(call4.parsed)
    const r5 = validateCompetencyResponse(call5.parsed)

    // Synthesis call for overall feedback
    const synthesisUserPrompt = buildSynthesisUserPrompt(topic.title, [
      { label: 'C1', score: r1.score, rubric_reasoning: r1.analysis.rubric_reasoning },
      { label: 'C2', score: r2.score, rubric_reasoning: r2.analysis.rubric_reasoning },
      { label: 'C3', score: r3.score, rubric_reasoning: r3.analysis.rubric_reasoning },
      { label: 'C4', score: r4.score, rubric_reasoning: r4.analysis.rubric_reasoning },
      { label: 'C5', score: r5.score, rubric_reasoning: r5.analysis.rubric_reasoning },
    ])
    const callSynthesis = await callOpenAI(PROMPT_SYNTHESIS, synthesisUserPrompt, 600)
    const synthesis = validateSynthesisResponse(callSynthesis.parsed)

    const totalTokens =
      call1.tokens + call2.tokens + call3.tokens + call4.tokens + call5.tokens + callSynthesis.tokens

    const validated: GroqCorrection = {
      score_c1: r1.score,
      analysis_c1: r1.analysis,
      score_c2: r2.score,
      analysis_c2: r2.analysis,
      score_c3: r3.score,
      analysis_c3: r3.analysis,
      score_c4: r4.score,
      analysis_c4: r4.analysis,
      score_c5: r5.score,
      analysis_c5: r5.analysis,
      feedback_general: synthesis.feedback_general,
      priority_improvements: synthesis.priority_improvements,
    }

    const { error: insertError } = await supabaseAdmin.from('essay_corrections').insert({
      essay_id: essayId,
      c1: r1.score,
      c2: r2.score,
      c3: r3.score,
      c4: r4.score,
      c5: r5.score,
      feedback: validated,
      ai_model: getOpenAIModel(),
      tokens_used: totalTokens > 0 ? totalTokens : null,
    })

    if (insertError) throw new Error(`Erro ao salvar correção: ${insertError.message}`)

    await supabaseAdmin.from('essays').update({ status: 'done' }).eq('id', essayId)
  } catch (err) {
    console.error(
      `[correctEssayWithGroq] essay=${essayId} falhou:`,
      err instanceof Error ? err.message : 'erro desconhecido'
    )

    await supabaseAdmin.from('essays').update({ status: 'error' }).eq('id', essayId)

    await supabaseAdmin.rpc('refund_credit', {
      p_user_id: userId,
      p_essay_id: essayId,
      p_reason: 'ai_correction_failed',
    })

    throw err
  }
}
