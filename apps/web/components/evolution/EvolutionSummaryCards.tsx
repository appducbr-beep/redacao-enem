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

export default function EvolutionSummaryCards({
  avgScore,
  bestScore,
  totalCorrected,
  weakestLabel,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center space-y-1">
        <p className={`text-2xl font-bold ${avgColor(avgScore)}`}>{avgScore}</p>
        <p className="text-xs text-slate-500 leading-tight">Média geral</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center space-y-1">
        <p className="text-2xl font-bold text-green-700">{bestScore}</p>
        <p className="text-xs text-slate-500 leading-tight">Melhor nota</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center space-y-1">
        <p className="text-2xl font-bold text-slate-800">{totalCorrected}</p>
        <p className="text-xs text-slate-500 leading-tight">Corrigidas</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center space-y-1">
        <p className="text-sm font-semibold text-orange-600 leading-tight">{weakestLabel}</p>
        <p className="text-xs text-slate-500 leading-tight">Competência a focar</p>
      </div>
    </div>
  )
}
