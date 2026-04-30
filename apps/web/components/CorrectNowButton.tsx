'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { runEssayCorrection } from '@/app/actions/corrections'

export default function CorrectNowButton({ essayId }: { essayId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await runEssayCorrection(essayId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Corrigindo... (pode levar até 30 segundos)' : 'Corrigir agora'}
    </button>
  )
}
