'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { runEssayCorrection } from '@/app/actions/corrections'

export default function CorrectNowButton({ essayId }: { essayId: string }) {
  const [pending, startTransition] = useTransition()
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    setCorrectionError(null)
    startTransition(async () => {
      const result = await runEssayCorrection(essayId)
      if (result.error) {
        setCorrectionError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Corrigindo... (pode levar até 30 segundos)' : 'Corrigir agora'}
      </button>
      {correctionError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{correctionError}</p>
        </div>
      )}
    </div>
  )
}
