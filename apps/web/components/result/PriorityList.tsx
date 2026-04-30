interface Props {
  items: string[]
}

export default function PriorityList({ items }: Props) {
  if (!items.length) return null

  return (
    <div className="rounded-xl bg-orange-50 border border-orange-100 shadow-sm px-5 py-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-orange-700 mb-4">
        Suas 3 prioridades para a próxima redação
      </h2>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-200 text-orange-800 text-xs font-bold">
              {i + 1}
            </span>
            <span className="text-sm text-orange-900 leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
