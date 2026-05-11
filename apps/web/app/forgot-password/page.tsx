'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthHero from '@/components/auth/AuthHero'
import AuthCard from '@/components/auth/AuthCard'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined)

  return (
    <AuthShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <AuthHero />

        <AuthCard
          title="Recuperar senha"
          subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
        >
          {state?.success ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-green-700">
                {state.success}
              </div>
              <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  ← Voltar para o login
                </Link>
              </p>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  E-mail cadastrado
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>

              {state?.error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mt-1"
              >
                {pending ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <p className="text-center text-sm text-slate-500 mt-2">
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  ← Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </AuthCard>

      </div>
    </AuthShell>
  )
}
