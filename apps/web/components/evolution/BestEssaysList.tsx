import Link from 'next/link'

export interface BestEssay {
  id: string
  topic_title: string
  total_score: number
  created_at: string
}

function scoreColor(score: number): string {
  if (score >= 800) return 'text-green-700'
  if (score >= 600) return 'text-yellow-700'
  return 'text-red-700'
}

const RANK_STYLES = [
  'bg-yellow-100 text-yellow-700',
  'bg-slate-200 text-slate-600',
  'bg-orange-100 text-orange-700',
]

export default function BestEssaysList({ essays }: { essays: BestEssay[] }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Suas melhores redações</h2>
      </div>
      <ul className="divide-y divide-slate-50">
        {essays.map((essay, rank) => {
          const dateFormatted = new Date(essay.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          return (
            <li key={essay.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors duration-150">
              <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${RANK_STYLES[rank] ?? 'bg-slate-100 text-slate-500'}`}>
                {rank + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 truncate">{essay.topic_title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{dateFormatted}</p>
              </div>
              <span className={`text-sm font-bold shrink-0 tabular-nums ${scoreColor(essay.total_score)}`}>
                {essay.total_score}/1000
              </span>
              <Link
                href={`/redacoes/${essay.id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 transition-colors"
              >
                Ver →
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
