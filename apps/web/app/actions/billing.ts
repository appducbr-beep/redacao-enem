'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cancelSubscription as cancelAsaasSubscription } from '@/lib/asaas'

export type BillingState = { error: string | null }

const GUARANTEE_DAYS = 7

export async function cancelCurrentSubscription(
  _prev: BillingState | undefined,
  _formData: FormData
): Promise<BillingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  type SubRow = {
    id: string
    asaas_subscription_id: string
    current_period_start: string | null
    current_period_end: string | null
    billing_cycle: string
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, asaas_subscription_id, current_period_start, current_period_end, billing_cycle')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub) return { error: 'Nenhuma assinatura ativa encontrada.' }

  const { id: subId, asaas_subscription_id: asaasId, current_period_start } = sub as SubRow

  // Conservative fallback: no period_start means we treat as within guarantee
  const withinGuarantee = current_period_start
    ? Date.now() - new Date(current_period_start).getTime() <= GUARANTEE_DAYS * 86_400_000
    : true

  if (withinGuarantee) {
    // --- Cancelamento imediato (dentro de 7 dias) ---
    try {
      await cancelAsaasSubscription(asaasId)
    } catch (err) {
      console.error('[billing] cancelSubscription Asaas error:', err)
      return { error: 'Erro ao cancelar no gateway. Tente novamente.' }
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_at_period_end: false,
        refund_required: true,
        refund_reason: '7_day_guarantee',
      })
      .eq('id', subId)

    await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('id', user.id)

    const { error: rpcError } = await supabaseAdmin.rpc('set_credit_balance', {
      target_user_id: user.id,
      available_credits: 0,
      reason: 'cancel_within_7_days',
    })
    if (rpcError) console.error('[billing] set_credit_balance error:', rpcError)

    console.log(`[billing] Immediate cancel sub=${subId} user=${user.id} (within guarantee)`)
    redirect('/perfil?cancelled=immediate')
  } else {
    // --- Cancelamento programado (após 7 dias) ---
    // NÃO deletar no Asaas agora — o cron fará isso em current_period_end.
    // profiles.plan permanece 'pro' até a expiração.
    await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subId)

    console.log(`[billing] Scheduled cancel sub=${subId} user=${user.id} (after guarantee)`)
    redirect('/perfil?cancelled=scheduled')
  }
}
