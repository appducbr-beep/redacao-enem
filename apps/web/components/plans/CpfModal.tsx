'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCpf, sanitizeCpf } from '@/lib/cpfUtils'

interface Props {
  planLabel: string
  isLoading: boolean
  onConfirm: (cpfCnpj: string) => void
  onCancel: () => void
}

export default function CpfModal({ planLabel, isLoading, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(formatCpf(e.target.value))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = sanitizeCpf(value)
    if (digits.length !== 11) {
      setError('CPF inválido. Informe os 11 dígitos.')
      return
    }
    onConfirm(digits)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Assinar — {planLabel}
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          O gateway de pagamento exige CPF para emitir cobranças. Ele é enviado apenas ao Asaas e não fica armazenado aqui.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cpf-modal-input" className="block text-xs font-medium text-slate-600 mb-1.5">
              CPF
            </label>
            <input
              id="cpf-modal-input"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={value}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-70 transition-colors"
            >
              {isLoading ? 'Aguarde...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
