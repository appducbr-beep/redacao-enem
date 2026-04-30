interface Props {
  avgs: { c1: number; c2: number; c3: number; c4: number; c5: number }
}

const LABELS: [keyof Props['avgs'], string][] = [
  ['c1', 'C1 — Domínio da língua escrita'],
  ['c2', 'C2 — Compreensão da proposta'],
  ['c3', 'C3 — Seleção de argumentos'],
  ['c4', 'C4 — Coesão textual'],
  ['c5', 'C5 — Proposta de intervenção'],
]

function barColor(score: number): string {
  if (score >= 180) return 'bg-green-600'
  if (score >= 140) return 'bg-green-400'
  if (score >= 100) return 'bg-yellow-400'
  if (score >= 60) return 'bg-orange-400'
  return 'bg-red-400'
}

function scoreTextColor(score: number): string {
  if (score >= 140) return 'text-green-700'
  if (score >= 100) return 'text-yellow-700'
  if (score >= 60) return 'text-orange-700'
  return 'text-red-700'
}

export default function CompetencyAverageBars({ avgs }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        Média por competência
      </h2>
      <div className="space-y-3">
        {LABELS.map(([key, label]) => {
          const score = avgs[key]
          const pct = Math.round((score / 200) * 100)
          return (
            <div key={key} className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-slate-600 shrink-0 w-36 truncate">{label}</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden min-w-0">
                <div
                  className={`h-full rounded-full ${barColor(score)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`text-sm font-semibold shrink-0 w-16 text-right ${scoreTextColor(score)}`}
              >
                {score}/200
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
