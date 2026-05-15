'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cancelSubscription as cancelAsaasSubscription } from '@/lib/asaas'
import { trackServerEvent } from '@/lib/analytics'
import { sendSubscriptionCancelledEmail } from '@/lib/brevo'
import {
  processUserCancellation,
  type ActiveSubForCancellation,
  type CancellationDeps,
} from '@/lib/subscriptionCancellationProcessor'

export type BillingState = { error: string | null }

export async function cancelCurrentSubscription(
  _prev: BillingState | undefined,
  _formData: FormData
): Promise<BillingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const [{ data: sub }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from('subscriptions')
      .select('id, asaas_subscription_id, current_period_start, current_period_end, billing_cycle')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])

  if (!sub) return { error: 'Nenhuma assinatura ativa encontrada.' }

  const userName: string | null = (profile as { full_name?: string } | null)?.full_name ?? null

  const deps: CancellationDeps = {
    now: () => new Date(),
    cancelAsaasSubscription: async (asaasId) => {
      await cancelAsaasSubscription(asaasId)
    },
    updateSub: async (id, data) => {
      await supabaseAdmin.from('subscriptions').update(data).eq('id', id)
    },
    updateProfile: async (userId, plan) => {
      await supabaseAdmin.from('profiles').update({ plan }).eq('id', userId)
    },
    setCreditBalance: async (userId, available, reason) => {
      const { error } = await supabaseAdmin.rpc('set_credit_balance', {
        target_user_id: userId,
        available_credits: available,
        reason,
      })
      if (error) console.error('[billing] set_credit_balance error:', error)
    },
  }

  let result
  try {
    result = await processUserCancellation(sub as ActiveSubForCancellation, deps)
  } catch (err) {
    console.error('[billing] processUserCancellation error:', err)
    return { error: 'Erro ao cancelar no gateway. Tente novamente.' }
  }

  console.log(`[billing] cancel sub=${sub.id} user=${user.id} type=${result.type}`)

  if (result.type === 'immediate') {
    trackServerEvent('subscription_cancelled', user.id, { cancellation_type: 'immediate' })
    sendSubscriptionCancelledEmail(user.email!, userName, 'immediate').catch(() => {})
    redirect('/perfil?cancelled=immediate')
  } else {
    trackServerEvent('subscription_cancel_scheduled', user.id, { cancellation_type: 'scheduled' })
    sendSubscriptionCancelledEmail(
      user.email!,
      userName,
      'scheduled',
      sub.current_period_end ?? undefined
    ).catch(() => {})
    redirect('/perfil?cancelled=scheduled')
  }
}
