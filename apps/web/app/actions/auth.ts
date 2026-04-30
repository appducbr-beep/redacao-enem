'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type AuthState = { error: string | null; success?: string }

export async function signIn(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/')
}

export async function signUp(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const fullName = (formData.get('full_name') as string)?.trim()
  if (fullName && data.user) {
    await supabaseAdmin
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', data.user.id)
  }

  redirect('/')
}

export async function forgotPassword(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${appUrl}/auth/callback?next=/update-password` }
  )

  if (error) return { error: error.message }

  return { error: null, success: 'Verifique seu e-mail para redefinir a senha.' }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
