'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cancelSubscription as cancelAsaasSubscription } from '@/lib/asaas'
import { trackServerEvent } from '@/lib/analytics'
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

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, asaas_subscription_id, current_period_start, current_period_end, billing_cycle')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub) return { error: 'Nenhuma assinatura ativa encontrada.' }

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
    redirect('/perfil?cancelled=immediate')
  } else {
    trackServerEvent('subscription_cancel_scheduled', user.id, { cancellation_type: 'scheduled' })
    redirect('/perfil?cancelled=scheduled')
  }
}
