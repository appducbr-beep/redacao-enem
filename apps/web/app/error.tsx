'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { generateErrorId } from '@/lib/errorId'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [errorId] = useState<string>(() => error?.digest ?? generateErrorId())

  useEffect(() => {
    console.error('[reda1000] client error boundary:', error?.message, 'ref:', errorId)
  }, [error, errorId])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800">Algo inesperado aconteceu.</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Ocorreu um erro na página. Tente novamente — se o problema persistir, entre em contato com o suporte.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>

        <p className="text-xs text-slate-400">Erro de referência: {errorId}</p>
      </div>
    </main>
  )
}
