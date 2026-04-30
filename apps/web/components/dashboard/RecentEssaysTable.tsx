import Link from 'next/link'

export interface RecentEssayRow {
  id: string
  status: string
  topic_title: string
  created_at: string
  total_score: number | null
}

const STATUS_LABEL: Record<string, string> = {
  done: 'Corrigida',
  processing: 'Processando',
  pending: 'Aguardando',
  error: 'Erro',
}

const STATUS_CLASSES: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-slate-100 text-slate-600',
  error: 'bg-red-100 text-red-700',
}

function scoreColor(score: number): string {
  if (score >= 800) return 'text-green-700'
  if (score >= 600) return 'text-yellow-700'
  return 'text-red-700'
}

export default function RecentEssaysTable({ essays }: { essays: RecentEssayRow[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Últimas redações</h2>
        <Link href="/redacoes" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          Ver todas →
        </Link>
      </div>

      {essays.length === 0 ? (
        <div className="px-5 py-8 text-center space-y-2">
          <p className="text-sm text-slate-400">Nenhuma redação enviada ainda.</p>
          <Link href="/temas" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Escrever primeira redação →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {essays.map((essay) => {
            const statusKey = essay.status in STATUS_LABEL ? essay.status : 'pending'
            const dateFormatted = new Date(essay.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })

            return (
              <li key={essay.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 truncate">{essay.topic_title}</p>
                  <p className="text-xs text-slate-400">{dateFormatted}</p>
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md shrink-0 ${STATUS_CLASSES[statusKey]}`}
                >
                  {STATUS_LABEL[statusKey]}
                </span>

                {essay.status === 'done' && essay.total_score !== null && (
                  <span
                    className={`text-sm font-bold shrink-0 w-16 text-right ${scoreColor(essay.total_score)}`}
                  >
                    {essay.total_score}/1000
                  </span>
                )}

                <Link
                  href={`/redacoes/${essay.id}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
                >
                  {essay.status === 'done' ? 'Ver resultado' : 'Abrir'}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
