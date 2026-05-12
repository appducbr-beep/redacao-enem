'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthHero from '@/components/auth/AuthHero'
import AuthCard from '@/components/auth/AuthCard'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined)

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
          icon="✍️"
          title="Crie sua conta grátis"
          subtitle="Comece com créditos gratuitos e veja como sua redação pode evoluir."
        >
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="Seu nome"
                className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                E-mail
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

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
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
              {pending ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <div className="mt-5 bg-slate-50 rounded-2xl px-4 py-3.5 text-center">
            <p className="text-sm text-slate-500">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </AuthCard>

      </div>
    </AuthShell>
  )
}
