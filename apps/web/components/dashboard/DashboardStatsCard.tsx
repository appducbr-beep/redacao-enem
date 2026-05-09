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

function avgScoreBg(score: number): string {
  if (score >= 800) return 'bg-green-50'
  if (score >= 600) return 'bg-yellow-50'
  return 'bg-red-50'
}

export default function DashboardStatsCard({ avgScore, totalEssays, creditsAvailable }: Props) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5">
        Seu desempenho
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-xl p-4 text-center space-y-1 ${avgScore !== null ? avgScoreBg(avgScore) : 'bg-slate-50'}`}>
          <p className={`text-3xl font-bold tracking-tight ${avgScore !== null ? avgScoreColor(avgScore) : 'text-slate-300'}`}>
            {avgScore !== null ? avgScore : '—'}
          </p>
          <p className="text-xs text-slate-500 leading-tight">Nota média</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-center space-y-1">
          <p className="text-3xl font-bold tracking-tight text-slate-800">{totalEssays}</p>
          <p className="text-xs text-slate-500 leading-tight">Redações enviadas</p>
        </div>

        <div className={`rounded-xl p-4 text-center space-y-1 ${creditsAvailable === 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
          <p
            className={`text-3xl font-bold tracking-tight ${
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
