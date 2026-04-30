import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import CorrectNowButton from '@/components/CorrectNowButton'
import ScoreHero from '@/components/result/ScoreHero'
import CompetencyBar from '@/components/result/CompetencyBar'
import CompetencyCard from '@/components/result/CompetencyCard'
import PriorityList from '@/components/result/PriorityList'
import type { GroqCorrection } from '@/lib/groq'

type Props = { params: Promise<{ id: string }> }

type Correction = {
  c1: number
  c2: number
  c3: number
  c4: number
  c5: number
  total_score: number
  feedback: GroqCorrection
  ai_model: string
}

const COMPETENCY_LABELS = {
  c1: 'C1 — Domínio da língua escrita',
  c2: 'C2 — Compreensão da proposta',
  c3: 'C3 — Seleção de argumentos',
  c4: 'C4 — Coesão textual',
  c5: 'C5 — Proposta de intervenção',
} as const

const COMPETENCY_LABELS_FULL = {
  c1: 'C1 — Domínio da língua escrita',
  c2: 'C2 — Compreensão da proposta',
  c3: 'C3 — Seleção e organização de argumentos',
  c4: 'C4 — Coesão textual',
  c5: 'C5 — Proposta de intervenção',
} as const

export default async function EssayDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: essay, error } = await supabase
    .from('essays')
    .select(
      'id, status, created_at, essay_topics(title), essay_corrections(c1, c2, c3, c4, c5, total_score, feedback, ai_model)'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !essay) notFound()

  const status = essay.status as string
  const topicTitle =
    (essay.essay_topics as unknown as { title: string } | null)?.title ?? 'Tema desconhecido'

  const rawCorrections = essay.essay_corrections
  const correction: Correction | null = Array.isArray(rawCorrections)
    ? (rawCorrections[0] as Correction) ?? null
    : (rawCorrections as Correction | null)

  const feedback = correction?.feedback as GroqCorrection | undefined

  const totalScore =
    correction?.total_score ||
    (correction
      ? correction.c1 + correction.c2 + correction.c3 + correction.c4 + correction.c5
      : 0)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">

        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Início
          </Link>
        </div>

        {/* ── PROCESSANDO ── */}
        {status === 'processing' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Redação enviada!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tema: <span className="font-medium">{topicTitle}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Enviada em{' '}
                {new Date(essay.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-5 text-center">
              <p className="text-sm font-medium text-blue-800 mb-1">Pronto para corrigir</p>
              <p className="text-xs text-blue-600">1 crédito já foi reservado para esta redação.</p>
            </div>
            <CorrectNowButton essayId={essay.id} />
          </div>
        )}

        {/* ── CONCLUÍDA ── */}
        {status === 'done' && correction && (
          <div className="space-y-8">

            {/* 1. HERO */}
            <ScoreHero
              totalScore={totalScore}
              topicTitle={topicTitle}
              createdAt={essay.created_at}
              feedbackGeneral={feedback?.feedback_general}
            />

            {/* 2. BARRAS POR COMPETÊNCIA */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">
                Notas por competência
              </h2>
              <div className="space-y-4">
                {(
                  [
                    { key: 'c1' },
                    { key: 'c2' },
                    { key: 'c3' },
                    { key: 'c4' },
                    { key: 'c5' },
                  ] as const
                ).map(({ key }) => (
                  <CompetencyBar
                    key={key}
                    label={COMPETENCY_LABELS[key]}
                    score={correction[key]}
                  />
                ))}
              </div>
            </div>

            {/* 3. PRIORIDADES */}
            {feedback?.priority_improvements && feedback.priority_improvements.length > 0 && (
              <PriorityList items={feedback.priority_improvements} />
            )}

            {/* 4. DETALHE POR COMPETÊNCIA */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Análise detalhada
              </h2>
              <div className="space-y-4">
                {(
                  [
                    { key: 'c1', analysisKey: 'analysis_c1' },
                    { key: 'c2', analysisKey: 'analysis_c2' },
                    { key: 'c3', analysisKey: 'analysis_c3' },
                    { key: 'c4', analysisKey: 'analysis_c4' },
                    { key: 'c5', analysisKey: 'analysis_c5' },
                  ] as const
                ).map(({ key, analysisKey }) => (
                  <CompetencyCard
                    key={key}
                    label={COMPETENCY_LABELS_FULL[key]}
                    score={correction[key]}
                    analysis={feedback?.[analysisKey]}
                  />
                ))}
              </div>
            </div>

            {/* 5. CALL TO ACTION */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/redacao/nova"
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Escrever nova redação
              </Link>
              <Link
                href="/redacao/nova"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Refazer esta redação
              </Link>
            </div>

            <p className="text-center text-xs text-gray-300">
              Corrigido por {correction.ai_model}
            </p>
          </div>
        )}

        {/* ── ERRO ── */}
        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Erro na correção</h1>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center space-y-1">
              <p className="text-sm font-medium text-red-800">
                Não foi possível corrigir sua redação.
              </p>
              <p className="text-sm text-red-700">Seu crédito foi devolvido automaticamente.</p>
            </div>
            <Link
              href="/"
              className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ir para o início
            </Link>
          </div>
        )}

        {/* ── PENDING ── */}
        {status === 'pending' && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Redação aguardando processamento...</p>
          </div>
        )}

      </div>
    </main>
  )
}
