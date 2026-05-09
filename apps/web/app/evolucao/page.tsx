import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import EvolutionSummaryCards from '@/components/evolution/EvolutionSummaryCards'
import ScoreEvolutionChart from '@/components/evolution/ScoreEvolutionChart'
import CompetencyAverageBars from '@/components/evolution/CompetencyAverageBars'
import BestEssaysList from '@/components/evolution/BestEssaysList'
import type { BestEssay } from '@/components/evolution/BestEssaysList'

const COMP_LABELS: Record<string, string> = {
  c1: 'C1',
  c2: 'C2',
  c3: 'C3',
  c4: 'C4',
  c5: 'C5',
}

const COMP_FULL_LABELS: Record<string, string> = {
  c1: 'C1 — Domínio da língua escrita',
  c2: 'C2 — Compreensão da proposta',
  c3: 'C3 — Seleção de argumentos',
  c4: 'C4 — Coesão textual',
  c5: 'C5 — Proposta de intervenção',
}

type CorrectionRaw = {
  total_score?: number
  c1?: number
  c2?: number
  c3?: number
  c4?: number
  c5?: number
}

type CorrectedEssay = {
  id: string
  created_at: string
  topic_title: string
  total_score: number
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
}

export default async function EvolucaoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('essays')
    .select(
      'id, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)'
    )
    .eq('user_id', user.id)
    .eq('status', 'done')
    .order('created_at', { ascending: true })

  const essays: CorrectedEssay[] = (rows ?? [])
    .map((row) => {
      const correction = (
        Array.isArray(row.essay_corrections) ? row.essay_corrections[0] : row.essay_corrections
      ) as CorrectionRaw | null

      if (!correction) return null

      const topic = (
        Array.isArray(row.essay_topics) ? row.essay_topics[0] : row.essay_topics
      ) as { title?: string } | null

      const c1 = correction.c1 ?? 0
      const c2 = correction.c2 ?? 0
      const c3 = correction.c3 ?? 0
      const c4 = correction.c4 ?? 0
      const c5 = correction.c5 ?? 0
      const total_score =
        correction.total_score || (c1 + c2 + c3 + c4 + c5) || 0

      return {
        id: row.id as string,
        created_at: row.created_at as string,
        topic_title: topic?.title ?? 'Tema não identificado',
        total_score,
        c1,
        c2,
        c3,
        c4,
        c5,
      }
    })
    .filter((e): e is CorrectedEssay => e !== null && e.total_score > 0)

  if (essays.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              ← Início
            </Link>
          </div>
          <div className="text-center space-y-4 py-16">
            <div className="text-4xl">📈</div>
            <h1 className="text-2xl font-bold text-slate-800">Minha evolução</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Corrija sua primeira redação para começar a acompanhar sua evolução por competência.
            </p>
            <Link
              href="/temas"
              className="inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Começar uma redação
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Stats
  const total = essays.length
  const avgScore = Math.round(essays.reduce((s, e) => s + e.total_score, 0) / total)
  const bestScore = Math.max(...essays.map((e) => e.total_score))

  const compAvgs = {
    c1: Math.round(essays.reduce((s, e) => s + e.c1, 0) / total),
    c2: Math.round(essays.reduce((s, e) => s + e.c2, 0) / total),
    c3: Math.round(essays.reduce((s, e) => s + e.c3, 0) / total),
    c4: Math.round(essays.reduce((s, e) => s + e.c4, 0) / total),
    c5: Math.round(essays.reduce((s, e) => s + e.c5, 0) / total),
  }

  const weakestKey = (
    Object.entries(compAvgs) as [keyof typeof compAvgs, number][]
  ).sort((a, b) => a[1] - b[1])[0][0]

  const weakestShort = COMP_LABELS[weakestKey]
  const weakestFull = COMP_FULL_LABELS[weakestKey]

  // Diagnosis
  let diagnosisTitle: string
  let diagnosisSub: string
  let diagnosisColor: string

  if (avgScore >= 900) {
    diagnosisTitle = 'Você está em nível avançado.'
    diagnosisSub = 'Mantenha o ritmo e refine os detalhes das competências.'
    diagnosisColor = 'border-green-400 bg-green-50'
  } else if (avgScore >= 700) {
    diagnosisTitle = 'Você está em evolução consistente.'
    diagnosisSub = `Seu principal foco agora deve ser ${weakestFull}.`
    diagnosisColor = 'border-blue-400 bg-blue-50'
  } else {
    diagnosisTitle = 'Há pontos importantes para fortalecer.'
    diagnosisSub = `Concentre seus esforços em ${weakestFull}.`
    diagnosisColor = 'border-orange-400 bg-orange-50'
  }

  // Best essays (top 3 by score)
  const bestEssays: BestEssay[] = [...essays]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3)
    .map((e) => ({
      id: e.id,
      topic_title: e.topic_title,
      total_score: e.total_score,
      created_at: e.created_at,
    }))

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Início
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Minha evolução</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe seu progresso nas redações corrigidas
          </p>
        </div>

        {/* Summary cards */}
        <EvolutionSummaryCards
          avgScore={avgScore}
          bestScore={bestScore}
          totalCorrected={total}
          weakestLabel={weakestShort}
        />

        {/* Diagnosis */}
        <div className={`rounded-2xl border-l-4 px-5 py-4 ${diagnosisColor}`}>
          <p className="text-sm font-semibold text-slate-800">{diagnosisTitle}</p>
          <p className="text-sm text-slate-600 mt-0.5">{diagnosisSub}</p>
        </div>

        {/* Score evolution chart */}
        <ScoreEvolutionChart essays={essays} />

        {/* Competency averages */}
        <CompetencyAverageBars avgs={compAvgs} />

        {/* Best essays */}
        <BestEssaysList essays={bestEssays} />

      </div>
    </main>
  )
}
