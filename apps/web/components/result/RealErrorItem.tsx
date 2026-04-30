import type { RealError } from '@/lib/groq'

export default function RealErrorItem({ error }: { error: RealError }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4 space-y-2">
      {error.type && (
        <span className="inline-block text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
          {error.type}
        </span>
      )}
      <blockquote className="border-l-2 border-red-300 pl-3 text-sm text-red-900 italic">
        &ldquo;{error.excerpt}&rdquo;
      </blockquote>
      {error.explanation && <p className="text-sm text-gray-700">{error.explanation}</p>}
      {error.correction && (
        <div className="rounded bg-white border border-red-100 px-3 py-2">
          <p className="text-xs font-medium text-blue-700 mb-1">Correção sugerida</p>
          <p className="text-sm text-gray-800">{error.correction}</p>
        </div>
      )}
    </div>
  )
}
