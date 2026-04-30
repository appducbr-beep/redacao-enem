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

export default function BestEssaysList({ essays }: { essays: BestEssay[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Suas melhores redações</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {essays.map((essay, rank) => {
          const dateFormatted = new Date(essay.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          return (
            <li key={essay.id} className="flex items-center gap-3 px-5 py-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                {rank + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 truncate">{essay.topic_title}</p>
                <p className="text-xs text-slate-400">{dateFormatted}</p>
              </div>
              <span className={`text-sm font-bold shrink-0 ${scoreColor(essay.total_score)}`}>
                {essay.total_score}/1000
              </span>
              <Link
                href={`/redacoes/${essay.id}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
              >
                Ver resultado
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
