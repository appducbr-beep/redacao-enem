'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/profile'

const TARGET_SCORES = [600, 700, 800, 900, 950, 1000]

const SCHOOL_STAGES = [
  '1º ano do Ensino Médio',
  '2º ano do Ensino Médio',
  '3º ano do Ensino Médio',
  'Vestibulando',
  'Outro',
]

interface Props {
  email: string
  initialName: string
  initialPhone: string | null
  initialTargetScore: number | null
  initialSchoolStage: string | null
  initialMarketingConsent: boolean
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all'

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all appearance-none'

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

export default function ProfileForm({
  email,
  initialName,
  initialPhone,
  initialTargetScore,
  initialSchoolStage,
  initialMarketingConsent,
}: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-6 space-y-6 shadow-sm">
      <form action={action} className="space-y-6">

        {/* A — Dados da conta */}
        <div>
          <SectionHeader label="Dados da conta" />
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome completo
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={initialName}
                placeholder="Seu nome completo"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-400">O e-mail não pode ser alterado aqui.</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Telefone
                <span className="ml-1.5 text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={initialPhone ?? ''}
                placeholder="(11) 99999-8888"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">
                Poderá ser usado futuramente para lembretes e comunicações importantes.
              </p>
            </div>
          </div>
        </div>

        {/* B — Objetivo de estudo */}
        <div>
          <SectionHeader label="Objetivo de estudo" />
          <div className="space-y-4">
            <div>
              <label htmlFor="target_score" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Objetivo de nota
                <span className="ml-1.5 text-slate-400 font-normal">(opcional)</span>
              </label>
              <select
                id="target_score"
                name="target_score"
                defaultValue={initialTargetScore?.toString() ?? ''}
                className={selectClass}
              >
                <option value="">Não definido</option>
                {TARGET_SCORES.map((s) => (
                  <option key={s} value={s}>{s} pontos</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="school_stage" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Situação escolar
                <span className="ml-1.5 text-slate-400 font-normal">(opcional)</span>
              </label>
              <select
                id="school_stage"
                name="school_stage"
                defaultValue={initialSchoolStage ?? ''}
                className={selectClass}
              >
                <option value="">Não informado</option>
                {SCHOOL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* C — Comunicação */}
        <div>
          <SectionHeader label="Comunicação" />
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="marketing_consent"
              defaultChecked={initialMarketingConsent}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-100 shrink-0"
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              Quero receber dicas, novidades e lembretes sobre redação.
            </span>
          </label>
        </div>

        {state?.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-xs text-green-600">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
