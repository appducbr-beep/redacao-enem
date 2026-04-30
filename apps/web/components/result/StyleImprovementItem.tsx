import type { StyleImprovement } from '@/lib/groq'

export default function StyleImprovementItem({ item }: { item: StyleImprovement }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
      {item.excerpt && (
        <blockquote className="border-l-2 border-blue-300 pl-3 text-sm text-blue-900 italic">
          &ldquo;{item.excerpt}&rdquo;
        </blockquote>
      )}
      {item.suggestion && <p className="text-sm text-gray-700">{item.suggestion}</p>}
      {item.example && (
        <div className="rounded bg-white border border-blue-100 px-3 py-2">
          <p className="text-xs font-medium text-blue-700 mb-1">Versão melhorada</p>
          <p className="text-sm text-gray-800">{item.example}</p>
        </div>
      )}
    </div>
  )
}
