'use client'

import { useTransition } from 'react'
import { signOut } from '@/app/actions/auth'

export default function LogoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
      className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
    >
      {pending ? 'Saindo...' : 'Sair'}
    </button>
  )
}
