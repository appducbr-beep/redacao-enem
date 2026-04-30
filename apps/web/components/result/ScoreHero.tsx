interface Props {
  totalScore: number
  topicTitle: string
  createdAt: string
  feedbackGeneral?: string
}

function interpretation(score: number): string {
  if (score >= 900) return 'Excelente redação — nível muito alto'
  if (score >= 800) return 'Boa redação — com pontos a melhorar'
  if (score >= 600) return 'Redação mediana — atenção aos pontos indicados'
  return 'Redação com problemas relevantes — foco nas melhorias'
}

function heroColors(score: number) {
  if (score >= 800) return { score: 'text-green-600', ring: 'ring-green-200', bg: 'bg-green-50' }
  if (score >= 600) return { score: 'text-yellow-600', ring: 'ring-yellow-200', bg: 'bg-yellow-50' }
  return { score: 'text-red-600', ring: 'ring-red-200', bg: 'bg-red-50' }
}

export default function ScoreHero({ totalScore, topicTitle, createdAt, feedbackGeneral }: Props) {
  const colors = heroColors(totalScore)

  const dateFormatted = new Date(createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-slate-200 shadow-md bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center space-y-5">
      <div
        className={`inline-flex flex-col items-center justify-center w-40 h-40 rounded-full ${colors.bg} ring-4 ${colors.ring}`}
      >
        <span className={`text-6xl font-bold leading-none ${colors.score}`}>{totalScore}</span>
        <span className="text-sm text-slate-400 mt-1">de 1000</span>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-800">{interpretation(totalScore)}</p>
        <p className="text-sm text-slate-500">{topicTitle}</p>
        <p className="text-xs text-slate-400">{dateFormatted}</p>
      </div>

      {feedbackGeneral && (
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto border-l-2 border-slate-300 pl-4 text-left">
          {feedbackGeneral}
        </p>
      )}
    </div>
  )
}
