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

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function TopicCard({ topic, isUserPro }: Props) {
  const accessible = topic.is_free || isUserPro

  if (!accessible) {
    return (
      <div className="relative rounded-2xl border border-slate-100 bg-white px-5 py-5 flex flex-col gap-3 overflow-hidden">
        {/* Subtle premium overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-snug text-slate-700">
              {topic.title}
            </h3>
          </div>
          {topic.year && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 whitespace-nowrap">
              ENEM {topic.year}
            </span>
          )}
        </div>

        {/* Description — visible to generate desire */}
        {topic.description && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
            {topic.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            <LockIcon className="w-3 h-3" />
            Pro
          </span>
          <Link
            href="/planos"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            Desbloquear
            <ArrowIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Link
      href={`/temas/${topic.id}`}
      className="group rounded-2xl border border-slate-100 bg-white px-5 py-5 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors duration-200">
            {topic.title}
          </h3>
        </div>
        {topic.year && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 whitespace-nowrap group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-200">
            ENEM {topic.year}
          </span>
        )}
      </div>

      {/* Description */}
      {topic.description && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
          {topic.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {topic.is_free ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            Gratuito
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Pro
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 group-hover:text-blue-800 group-hover:gap-2 transition-all duration-200">
          Treinar agora
          <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
        </span>
      </div>
    </Link>
  )
}
