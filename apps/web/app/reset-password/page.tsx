'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthCard from '@/components/auth/AuthCard'

const inputClass =
  'w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm_password') as HTMLInputElement).value
    if (password !== confirm) {
      e.preventDefault()
      setConfirmError('As senhas não coincidem.')
      return
    }
    setConfirmError(null)
  }

  return (
    <AuthShell
      topbarAction={
        <Link
          href="/login"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Entrar
        </Link>
      }
    >
      <div className="flex justify-center">
        <AuthCard
          icon="🔒"
          title="Nova senha"
          subtitle="Escolha uma senha segura para sua conta Reda1000."
        >
          <form action={action} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nova senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirmar nova senha
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Repita a nova senha"
                className={inputClass}
              />
            </div>

            {confirmError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {confirmError}
              </div>
            )}

            {state?.error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
            >
              {pending ? 'Salvando...' : 'Definir nova senha'}
            </button>
          </form>

          <div className="mt-5 bg-slate-50 rounded-2xl px-4 py-3.5 text-center">
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              ← Voltar para o login
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthShell>
  )
}
