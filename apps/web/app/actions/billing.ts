'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cancelSubscription as cancelAsaasSubscription } from '@/lib/asaas'

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
    .select('id, asaas_subscription_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub) return { error: 'Nenhuma assinatura ativa encontrada.' }

  const { id: subId, asaas_subscription_id: asaasId } = sub as {
    id: string
    asaas_subscription_id: string
  }

  try {
    await cancelAsaasSubscription(asaasId)
  } catch (err) {
    console.error('[billing] cancelSubscription Asaas error:', err)
    return { error: 'Erro ao cancelar no gateway. Tente novamente.' }
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', subId)

  await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', user.id)

  console.log(`[billing] Cancelled sub ${subId} user=${user.id}`)

  redirect('/perfil?cancelled=1')
}
