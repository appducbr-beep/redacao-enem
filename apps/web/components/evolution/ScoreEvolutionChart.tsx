interface ChartEssay {
  id: string
  created_at: string
  total_score: number
}

interface Props {
  essays: ChartEssay[]
}

const W = 540
const H = 200
const PAD = { top: 28, right: 20, bottom: 16, left: 44 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

function toX(i: number, total: number): number {
  return PAD.left + (total === 1 ? PLOT_W / 2 : (i / (total - 1)) * PLOT_W)
}

function toY(score: number): number {
  return PAD.top + PLOT_H - (score / 1000) * PLOT_H
}

const Y_GRID = [0, 200, 400, 600, 800, 1000]

function lineColor(score: number): string {
  if (score >= 800) return '#15803d'
  if (score >= 600) return '#b45309'
  return '#dc2626'
}

export default function ScoreEvolutionChart({ essays }: Props) {
  if (essays.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-6 py-10 text-center">
        <p className="text-sm text-slate-400">
          Corrija pelo menos duas redações para visualizar sua evolução.
        </p>
      </div>
    )
  }

  const displayed = essays.slice(-20)
  const n = displayed.length

  const points = displayed.map((e, i) => ({
    x: toX(i, n),
    y: toY(e.total_score),
    score: e.total_score,
  }))

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lastScore = displayed[displayed.length - 1].total_score
  const strokeColor = lineColor(lastScore)

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Evolução da nota total
        </h2>
        {essays.length > 20 && (
          <span className="text-xs text-slate-400">últimas 20 redações</span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[300px]"
          aria-label="Gráfico de evolução da nota"
        >
          {/* Y grid lines */}
          {Y_GRID.map((val) => {
            const y = toY(val)
            return (
              <g key={val}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={val === 0 || val === 1000 ? 1.5 : 1}
                />
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#94a3b8"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <polyline
            points={`${PAD.left},${toY(0)} ${polyline} ${toX(n - 1, n).toFixed(1)},${toY(0)}`}
            fill={strokeColor}
            fillOpacity={0.06}
            stroke="none"
          />

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + score labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={strokeColor} strokeWidth={2} />
              {(n <= 10 || i === 0 || i === n - 1) && (
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fontSize={9}
                  fill={strokeColor}
                  fontWeight="600"
                >
                  {p.score}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-center">
        Cada ponto representa uma redação corrigida, da mais antiga à mais recente.
      </p>
    </div>
  )
}
