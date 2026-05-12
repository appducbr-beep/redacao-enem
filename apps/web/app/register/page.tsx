'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import AuthShell from '@/components/auth/AuthShell'
import AuthHero from '@/components/auth/AuthHero'
import AuthCard from '@/components/auth/AuthCard'

const TARGET_SCORES = [600, 700, 800, 900, 950, 1000]

const SCHOOL_STAGES = [
  '1º ano do Ensino Médio',
  '2º ano do Ensino Médio',
  '3º ano do Ensino Médio',
  'Vestibulando',
  'Outro',
]

const ACQUISITION_SOURCES = [
  'TikTok',
  'Instagram',
  'YouTube',
  'Google',
  'Professor',
  'Escola',
  'Indicação',
  'Outro',
]

const inputClass =
  'w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all'

const selectClass =
  'w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all appearance-none'

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

            {/* Required fields */}
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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>

            {/* Optional fields */}
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-medium text-slate-400 shrink-0">Personalização opcional</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(11) 99999-8888"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Opcional. Poderá ser usado para lembretes e comunicações importantes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="target_score" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Objetivo de nota
                    </label>
                    <select id="target_score" name="target_score" className={selectClass} defaultValue="">
                      <option value="">Selecionar</option>
                      {TARGET_SCORES.map((s) => (
                        <option key={s} value={s}>{s} pontos</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="school_stage" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Situação escolar
                    </label>
                    <select id="school_stage" name="school_stage" className={selectClass} defaultValue="">
                      <option value="">Selecionar</option>
                      {SCHOOL_STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="acquisition_source" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Como conheceu o Reda1000?
                  </label>
                  <select id="acquisition_source" name="acquisition_source" className={selectClass} defaultValue="">
                    <option value="">Selecionar</option>
                    {ACQUISITION_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="marketing_consent"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100 shrink-0"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    Quero receber dicas, novidades e lembretes sobre redação.
                  </span>
                </label>
              </div>
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
