interface Props {
  avgScore: number | null
  totalEssays: number
  creditsAvailable: number | null
}

function avgScoreColor(score: number): string {
  if (score >= 800) return 'text-green-700'
  if (score >= 600) return 'text-yellow-700'
  return 'text-red-700'
}

export default function DashboardStatsCard({ avgScore, totalEssays, creditsAvailable }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        Seu desempenho
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 text-center">
          <p
            className={`text-2xl font-bold ${avgScore !== null ? avgScoreColor(avgScore) : 'text-slate-300'}`}
          >
            {avgScore !== null ? avgScore : '—'}
          </p>
          <p className="text-xs text-slate-500 leading-tight">Nota média</p>
        </div>

        <div className="space-y-1 text-center border-x border-slate-100">
          <p className="text-2xl font-bold text-slate-800">{totalEssays}</p>
          <p className="text-xs text-slate-500 leading-tight">Redações enviadas</p>
        </div>

        <div className="space-y-1 text-center">
          <p
            className={`text-2xl font-bold ${
              creditsAvailable === null
                ? 'text-slate-300'
                : creditsAvailable > 0
                  ? 'text-slate-800'
                  : 'text-red-600'
            }`}
          >
            {creditsAvailable ?? '—'}
          </p>
          <p className="text-xs text-slate-500 leading-tight">Créditos disponíveis</p>
        </div>
      </div>
    </div>
  )
}
