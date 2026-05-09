import Link from 'next/link'

type Topic = {
  id: string
  title: string
  year: number | null
  is_free: boolean
  description: string | null
}

type Props = {
  topic: Topic
  isUserPro: boolean
}

export default function TopicCard({ topic, isUserPro }: Props) {
  const accessible = topic.is_free || isUserPro
  const planLabel = topic.is_free ? 'Gratuito' : 'Pro'

  if (!accessible) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 flex flex-col gap-3 opacity-70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium leading-snug text-slate-400 truncate">
              {topic.title}
            </h3>
            {topic.year && (
              <p className="text-xs text-slate-400 mt-0.5">ENEM {topic.year}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600">
            {planLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-slate-400">🔒 Exclusivo Pro</span>
          <Link
            href="/planos"
            className="inline-block rounded-lg border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Ver planos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={`/temas/${topic.id}`}
      className="group rounded-2xl border border-slate-100 bg-white px-5 py-4 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
            {topic.title}
          </h3>
          {topic.year && (
            <p className="text-xs text-slate-400 mt-0.5">ENEM {topic.year}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
          {planLabel}
        </span>
      </div>

      {topic.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {topic.description}
        </p>
      )}

      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
        Ver tema →
      </span>
    </Link>
  )
}
