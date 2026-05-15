'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sanitizePhone } from '@/lib/phoneUtils'
import { trackServerEvent } from '@/lib/analytics'
import { translateAuthError } from '@/lib/authMessages'
import { sendWelcomeEmail } from '@/lib/brevo'

type AuthState = { error: string | null; success?: string }

export async function signIn(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: translateAuthError(error.message) }

  trackServerEvent('login_completed', data.user?.id)
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

  if (error) return { error: translateAuthError(error.message) }

  if (data.user) {
    const fullName = (formData.get('full_name') as string)?.trim() || null
    const rawPhone = (formData.get('phone') as string) ?? ''
    const phone = sanitizePhone(rawPhone) || null
    const rawScore = formData.get('target_score') as string
    const targetScore = rawScore ? parseInt(rawScore, 10) || null : null
    const schoolStage = (formData.get('school_stage') as string) || null
    const acquisitionSource = (formData.get('acquisition_source') as string) || null
    const marketingConsent = formData.get('marketing_consent') === 'on'

    const updates: Record<string, unknown> = { marketing_consent: marketingConsent }
    if (fullName) updates.full_name = fullName
    if (phone) updates.phone = phone
    if (targetScore) updates.target_score = targetScore
    if (schoolStage) updates.school_stage = schoolStage
    if (acquisitionSource) updates.acquisition_source = acquisitionSource

    await supabaseAdmin.from('profiles').update(updates).eq('id', data.user.id)
    trackServerEvent('signup_completed', data.user.id, { plan: 'free' })
    sendWelcomeEmail(data.user.email!, fullName).catch(() => {})
  }

  redirect('/login?signup=success')
}

export async function forgotPassword(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${appUrl}/auth/callback?next=/reset-password` }
  )

  if (error) return { error: translateAuthError(error.message) }

  return { error: null, success: 'Verifique seu e-mail para redefinir a senha.' }
}

export async function updatePassword(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: translateAuthError(error.message) }

  redirect('/login?reset=success')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
