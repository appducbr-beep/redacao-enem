'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/profile'

interface Props {
  email: string
  initialName: string
}

export default function ProfileForm({ email, initialName }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Informações pessoais</h2>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-xs font-medium text-slate-600 mb-1.5">
            Nome completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={initialName}
            placeholder="Seu nome completo"
            required
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
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
