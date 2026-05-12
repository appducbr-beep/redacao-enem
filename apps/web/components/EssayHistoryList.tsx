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
        <div className="text-center py-16 space-y-4">
          {filter === 'all' ? (
            <>
              <div className="text-4xl">✍️</div>
              <div className="space-y-1.5">
                <p className="text-base font-semibold text-slate-700">Nenhuma redação enviada ainda</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Envie sua primeira redação e comece a acompanhar sua evolução por competência.
                </p>
              </div>
              <Link
                href="/temas"
                className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Enviar primeira redação
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhuma redação encontrada com esse filtro.
            </p>
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
