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
  return 'Redação com pontos relevantes a melhorar'
}

function heroColors(score: number) {
  if (score >= 800)
    return {
      gradient: 'from-green-950 to-green-800',
      ring: 'ring-green-500/30',
      bg: 'bg-green-900/40',
      score: 'text-green-300',
      badge: 'bg-green-500/20 text-green-200 border-green-500/30',
    }
  if (score >= 600)
    return {
      gradient: 'from-yellow-950 to-yellow-800',
      ring: 'ring-yellow-500/30',
      bg: 'bg-yellow-900/40',
      score: 'text-yellow-300',
      badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    }
  return {
    gradient: 'from-red-950 to-red-900',
    ring: 'ring-red-500/30',
    bg: 'bg-red-900/40',
    score: 'text-red-300',
    badge: 'bg-red-500/20 text-red-200 border-red-500/30',
  }
}

export default function ScoreHero({ totalScore, topicTitle, createdAt, feedbackGeneral }: Props) {
  const c = heroColors(totalScore)

  const dateFormatted = new Date(createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${c.gradient} px-6 py-10 text-center space-y-6 shadow-lg`}>
      {/* Score circle */}
      <div className={`inline-flex flex-col items-center justify-center w-44 h-44 rounded-full ${c.bg} ring-4 ${c.ring} backdrop-blur-sm`}>
        <span className={`text-7xl font-bold leading-none tabular-nums ${c.score}`}>{totalScore}</span>
        <span className="text-sm text-white/50 mt-1">/ 1000</span>
      </div>

      {/* Interpretation + topic */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-white leading-snug">{interpretation(totalScore)}</p>
        <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">{topicTitle}</p>
        <p className="text-xs text-white/40">{dateFormatted}</p>
      </div>

      {/* General feedback */}
      {feedbackGeneral && (
        <div className="max-w-lg mx-auto rounded-xl bg-white/10 border border-white/10 px-5 py-4 text-left">
          <p className="text-sm text-white/80 leading-relaxed">{feedbackGeneral}</p>
        </div>
      )}
    </div>
  )
}
