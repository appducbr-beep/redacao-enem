'use client'

import { useState } from 'react'
import Link from 'next/link'
import EssayListItem from './EssayListItem'
import type { EssayItem } from '@/app/redacoes/page'

type FilterStatus = 'all' | 'done' | 'processing' | 'error'

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Corrigidas' },
  { value: 'processing', label: 'Processando' },
  { value: 'error', label: 'Com erro' },
]

export default function EssayHistoryList({ essays }: { essays: EssayItem[] }) {
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filtered = filter === 'all' ? essays : essays.filter((e) => e.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === value
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-slate-500">
            {filter === 'all'
              ? 'Você ainda não enviou nenhuma redação.'
              : 'Nenhuma redação encontrada com esse filtro.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/temas"
              className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Escrever primeira redação →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((essay) => (
            <EssayListItem key={essay.id} essay={essay} />
          ))}
        </div>
      )}
    </div>
  )
}
