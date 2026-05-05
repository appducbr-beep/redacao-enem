'use client'

import { useActionState, useState } from 'react'
import { cancelCurrentSubscription } from '@/app/actions/billing'

export default function CancelSubscriptionButton() {
  const [confirming, setConfirming] = useState(false)
  const [state, action, pending] = useActionState(cancelCurrentSubscription, undefined)

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-slate-400 hover:text-red-600 underline transition-colors"
      >
        Cancelar plano Pro
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 space-y-3">
      <p className="text-sm font-semibold text-red-900">
        Tem certeza que deseja cancelar seu plano Pro?
      </p>
      <p className="text-xs text-red-700">
        Novas cobranças não serão realizadas. Você pode voltar a assinar quando quiser.
      </p>

      {state?.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}

      <form action={action} className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Cancelando...' : 'Confirmar cancelamento'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Voltar
        </button>
      </form>
    </div>
  )
}
