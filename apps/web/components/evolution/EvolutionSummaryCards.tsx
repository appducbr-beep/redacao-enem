interface Props {
  avgScore: number
  bestScore: number
  totalCorrected: number
  weakestLabel: string
}

function avgColor(score: number): string {
  if (score >= 800) return 'text-green-700'
  if (score >= 600) return 'text-yellow-700'
  return 'text-red-700'
}

function avgBg(score: number): string {
  if (score >= 800) return 'bg-green-50 border-green-100'
  if (score >= 600) return 'bg-yellow-50 border-yellow-100'
  return 'bg-red-50 border-red-100'
}

export default function EvolutionSummaryCards({
  avgScore,
  bestScore,
  totalCorrected,
  weakestLabel,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className={`border rounded-2xl p-5 text-center space-y-1 ${avgBg(avgScore)}`}>
        <p className={`text-3xl font-bold tracking-tight ${avgColor(avgScore)}`}>{avgScore}</p>
        <p className="text-xs font-medium text-slate-500 leading-tight">Média geral</p>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center space-y-1">
        <p className="text-3xl font-bold tracking-tight text-green-700">{bestScore}</p>
        <p className="text-xs font-medium text-slate-500 leading-tight">Melhor nota</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 text-center space-y-1 shadow-sm">
        <p className="text-3xl font-bold tracking-tight text-slate-800">{totalCorrected}</p>
        <p className="text-xs font-medium text-slate-500 leading-tight">Corrigidas</p>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center space-y-1">
        <p className="text-sm font-bold text-orange-700 leading-tight">{weakestLabel}</p>
        <p className="text-xs font-medium text-slate-500 leading-tight mt-1">Foco de melhoria</p>
      </div>
    </div>
  )
}
