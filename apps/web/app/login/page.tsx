'use client'

import { Suspense } from 'react'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthHero from '@/components/auth/AuthHero'
import AuthCard from '@/components/auth/AuthCard'

const inputClass =
  'w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all'

function LoginPageContent() {
  const [state, action, pending] = useActionState(signIn, undefined)
  const searchParams = useSearchParams()

  const signupSuccess = searchParams.get('signup') === 'success'
  const resetSuccess = searchParams.get('reset') === 'success'
  const confirmedSuccess = searchParams.get('confirmed') === 'success'
  const callbackError = searchParams.get('error')

  return (
    <AuthShell
      topbarAction={
        <Link
          href="/register"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Criar conta
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <AuthHero />

        <AuthCard
          icon="✍️"
          title="Acesse sua conta"
          subtitle="Continue sua jornada rumo a uma redação mais forte."
        >

          {/* Query-param banners */}
          {signupSuccess && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 mb-4">
              Conta criada! Confirme seu e-mail para ativar o acesso.
            </div>
          )}
          {resetSuccess && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
              Senha redefinida com sucesso. Faça login para continuar.
            </div>
          )}
          {confirmedSuccess && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
              E-mail confirmado! Você já pode entrar.
            </div>
          )}
          {callbackError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
              Não foi possível validar seu link. Solicite um novo.
            </div>
          )}

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
                placeholder="seu@email.com"
                className={inputClass}
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
                placeholder="••••••••"
                className={inputClass}
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
              {pending ? 'Entrando...' : 'Entrar na plataforma'}
            </button>
          </form>

          <div className="mt-5 bg-slate-50 rounded-2xl px-4 py-3.5 text-center">
            <p className="text-sm text-slate-500">
              Ainda não tem conta?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </AuthCard>

      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
