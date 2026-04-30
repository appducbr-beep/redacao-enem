'use server'

import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  findCustomerByEmail,
  createCustomer,
  createSubscription as createAsaasSubscription,
  getFirstPendingPayment,
} from '@/lib/asaas'

export type SubscribeResult =
  | { checkoutUrl: string; error?: never }
  | { error: string; checkoutUrl?: never }

const PLAN_CONFIG = {
  'pro-monthly': { value: 19.0, cycle: 'MONTHLY' as const, billingCycle: 'monthly' as const, label: 'Mensal' },
  'pro-annual': { value: 178.8, cycle: 'YEARLY' as const, billingCycle: 'yearly' as const, label: 'Anual' },
}

export async function createProSubscription(
  plan: 'pro-monthly' | 'pro-annual'
): Promise<SubscribeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Você precisa estar autenticado.' }

  // Block if already has active subscription
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existingSub) return { error: 'Você já possui um plano Pro ativo.' }

  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const name =
    (profileRow as { full_name?: string } | null)?.full_name ?? user.email ?? 'Usuário'
  const email = user.email!

  try {
    // Reuse existing customer or create new one
    let customer = await findCustomerByEmail(email)
    if (!customer) {
      customer = await createCustomer({ name, email })
    }

    const { value, cycle, billingCycle, label } = PLAN_CONFIG[plan]
    const nextDueDate = new Date().toISOString().split('T')[0]

    const subscription = await createAsaasSubscription({
      customer: customer.id,
      billingType: 'UNDEFINED',
      nextDueDate,
      value,
      cycle,
      description: `Reda1000 Plano Pro — ${label}`,
    })

    const firstPayment = await getFirstPendingPayment(subscription.id)

    if (!firstPayment?.invoiceUrl) {
      throw new Error('Link de pagamento não disponível. Tente novamente em instantes.')
    }

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: user.id,
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
        plan: 'pro',
        billing_cycle: billingCycle,
        amount: value,
        status: 'pending',
        environment: process.env.ASAAS_ENV ?? 'sandbox',
      },
      { onConflict: 'user_id' }
    )

    return { checkoutUrl: firstPayment.invoiceUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado ao criar assinatura.'
    console.error('[subscribe] createProSubscription:', message)
    return { error: message }
  }
}
