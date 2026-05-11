'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthHero from '@/components/auth/AuthHero'
import AuthCard from '@/components/auth/AuthCard'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <AuthShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <AuthHero />

        <AuthCard
          title="Acesse sua conta"
          subtitle="Entre para continuar seus treinos e acompanhar sua evolução."
        >
          <form action={action} className="space-y-4">
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
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
              {pending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Ainda não tem conta?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </AuthCard>

      </div>
    </AuthShell>
  )
}
