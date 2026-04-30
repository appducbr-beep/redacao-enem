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

  return (
    <div className={`rounded-xl border px-5 py-4 flex flex-col gap-3 ${accessible ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium leading-snug ${accessible ? 'text-gray-900' : 'text-gray-400'}`}>
            {topic.title}
          </h3>
          {topic.year && (
            <p className="text-xs text-gray-400 mt-0.5">ENEM {topic.year}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            topic.is_free
              ? 'bg-green-50 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {planLabel}
        </span>
      </div>

      {topic.description && (
        <p className={`text-xs leading-relaxed ${accessible ? 'text-gray-500' : 'text-gray-400'}`}>
          {topic.description}
        </p>
      )}

      <div className="mt-1">
        {accessible ? (
          <Link
            href={`/temas/${topic.id}`}
            className="inline-block rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Ver tema
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Exclusivo Pro</span>
            <Link
              href="/planos"
              className="inline-block rounded-lg border border-blue-200 px-4 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Ver planos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
