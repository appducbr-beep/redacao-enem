import Link from 'next/link'
import type { EssayItem } from '@/app/redacoes/page'

const STATUS_LABEL: Record<string, string> = {
  done: 'Corrigida',
  processing: 'Processando',
  error: 'Com erro',
  pending: 'Aguardando',
}

const STATUS_CLASSES: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  processing: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
}

function scoreColor(score: number): string {
  if (score >= 800) return 'text-green-700'
  if (score >= 600) return 'text-yellow-700'
  return 'text-red-700'
}

export default function EssayListItem({ essay }: { essay: EssayItem }) {
  const dateFormatted = new Date(essay.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusKey = essay.status in STATUS_LABEL ? essay.status : 'pending'

  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm hover:shadow transition-shadow">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-slate-800 truncate">{essay.topic_title}</p>
        <p className="text-xs text-slate-400">{dateFormatted}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${STATUS_CLASSES[statusKey]}`}>
          {STATUS_LABEL[statusKey]}
        </span>

        {essay.status === 'done' && essay.total_score !== null && (
          <span className={`text-sm font-bold w-16 text-right ${scoreColor(essay.total_score)}`}>
            {essay.total_score}/1000
          </span>
        )}

        {essay.status === 'done' && (
          <Link
            href={`/redacoes/${essay.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
          >
            Abrir resultado →
          </Link>
        )}
      </div>
    </div>
  )
}
