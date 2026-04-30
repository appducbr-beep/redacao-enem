import type { CompetencyAnalysis } from '@/lib/groq'
import RealErrorItem from './RealErrorItem'
import StyleImprovementItem from './StyleImprovementItem'

interface Props {
  label: string
  score: number
  analysis: CompetencyAnalysis | undefined
}

function scoreChipClass(score: number): string {
  if (score >= 160) return 'bg-green-100 text-green-800'
  if (score >= 120) return 'bg-yellow-100 text-yellow-800'
  if (score >= 80) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export default function CompetencyCard({ label, score, analysis }: Props) {
  if (!analysis) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${scoreChipClass(score)}`}>
            {score}/200
          </span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-400">Análise não disponível para esta competência.</p>
        </div>
      </div>
    )
  }

  const strengths = analysis.strengths ?? ''
  const structuralFeedback = analysis.structural_feedback ?? ''
  const lostPointsReason = analysis.lost_points_reason ?? ''
  const howToImprove = analysis.how_to_improve ?? ''
  const rewriteExample = analysis.rewrite_example ?? ''
  const rubricReasoning = analysis.rubric_reasoning ?? ''

  const realErrors = analysis.real_errors ?? []
  const styleImprovements = (analysis.style_improvements ?? []).filter(
    (item) =>
      item.excerpt.trim().length > 0 &&
      item.suggestion.trim().length + item.example.trim().length >= 40
  )

  const showStructural = structuralFeedback.trim().length >= 50
  const showRubric = rubricReasoning.trim().length >= 20

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${scoreChipClass(score)}`}>
          {score}/200
        </span>
      </div>

      <div className="divide-y divide-slate-100">

        {/* O que você fez bem */}
        {strengths && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">
              O que você fez bem
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{strengths}</p>
          </div>
        )}

        {/* Onde perdeu pontos — apenas se score < 200 */}
        {score < 200 && lostPointsReason && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2">
              Onde perdeu pontos
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{lostPointsReason}</p>
          </div>
        )}

        {/* Análise estrutural */}
        {showStructural && (
          <div className="px-5 py-4">
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                Análise estrutural
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{structuralFeedback}</p>
            </div>
          </div>
        )}

        {/* Por que essa nota? */}
        {showRubric && (
          <div className="px-5 py-4 bg-slate-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Por que essa nota?
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">{rubricReasoning}</p>
          </div>
        )}

        {/* Erros identificados */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-3">
            Erros identificados
          </p>
          {realErrors.length > 0 ? (
            <div className="space-y-3">
              {realErrors.map((err, i) => (
                <RealErrorItem key={i} error={err} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Nenhum erro gramatical relevante identificado.
            </p>
          )}
        </div>

        {/* Melhorias de estilo */}
        {styleImprovements.length > 0 && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Melhorias de estilo
            </p>
            <div className="space-y-3">
              {styleImprovements.map((item, i) => (
                <StyleImprovementItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Como melhorar */}
        {howToImprove && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
              Como melhorar
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{howToImprove}</p>
          </div>
        )}

        {/* Exemplo de reescrita */}
        {rewriteExample && (
          <div className="px-5 py-4">
            <div className="rounded-lg bg-blue-50 border-l-4 border-blue-400 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Exemplo de reescrita
              </p>
              <p className="text-sm text-blue-900 leading-relaxed">{rewriteExample}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
