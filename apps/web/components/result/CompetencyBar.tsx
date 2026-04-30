interface Props {
  label: string
  score: number
}

function barColor(score: number): string {
  if (score >= 200) return 'bg-green-600'
  if (score >= 160) return 'bg-green-400'
  if (score >= 120) return 'bg-yellow-400'
  if (score >= 80) return 'bg-orange-400'
  return 'bg-red-400'
}

function scoreTextColor(score: number): string {
  if (score >= 160) return 'text-green-700'
  if (score >= 120) return 'text-yellow-700'
  if (score >= 80) return 'text-orange-700'
  return 'text-red-700'
}

export default function CompetencyBar({ label, score }: Props) {
  const pct = Math.round((score / 200) * 100)

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-sm text-gray-600 shrink-0 w-36 truncate">{label}</span>
      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden min-w-0">
        <div
          className={`h-full rounded-full ${barColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-semibold shrink-0 w-16 text-right ${scoreTextColor(score)}`}>
        {score}/200
      </span>
    </div>
  )
}
