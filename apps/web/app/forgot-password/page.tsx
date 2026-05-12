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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <AuthHero />

        <AuthCard
          icon="🔑"
          title="Recuperar senha"
          subtitle="Enviaremos um link seguro para você redefinir sua senha."
        >
          {state?.success ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-green-700">
                {state.success}
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3.5 text-center">
                <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  ← Voltar para o login
                </Link>
              </div>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-2.5 items-start">
                <span className="text-blue-500 text-base shrink-0 mt-0.5">ℹ</span>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Você receberá um e-mail com um link para redefinir sua senha. Verifique também a caixa de spam.
                </p>
              </div>

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
                  placeholder="seu@email.com"
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
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
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
              >
                {pending ? 'Enviando...' : 'Enviar instruções'}
              </button>

              <div className="bg-slate-50 rounded-2xl px-4 py-3.5 text-center">
                <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  ← Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </AuthCard>

      </div>
    </AuthShell>
  )
}
