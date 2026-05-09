import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { processWebhookEvent, type WebhookProcessorDeps } from '@/lib/asaasWebhookProcessor'

function createDeps(): WebhookProcessorDeps {
  return {
    now: () => new Date(),

    insertWebhookLog: async (event, eventId, payload) => {
      const { data, error } = await supabaseAdmin
        .from('webhook_logs')
        .insert({
          event,
          asaas_event_id: eventId,
          payload: payload as Record<string, unknown>,
        })
        .select('id')
        .single()
      if (error?.code === '23505') return { duplicate: true }
      if (error) return { dbError: true }
      return { logId: data.id }
    },

    updateWebhookLog: async (logId, result) => {
      await supabaseAdmin
        .from('webhook_logs')
        .update(
          'errorMessage' in result
            ? { error_message: result.errorMessage }
            : { processed: true, processed_at: new Date().toISOString() }
        )
        .eq('id', logId)
    },

    findSubByAsaasId: async (asaasId) => {
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('id, user_id, billing_cycle, status')
        .eq('asaas_subscription_id', asaasId)
        .maybeSingle()
      return data as { id: string; user_id: string; billing_cycle: string; status: string } | null
    },

    updateSub: async (id, data) => {
      await supabaseAdmin.from('subscriptions').update(data).eq('id', id)
    },

    updateProfile: async (userId, plan) => {
      await supabaseAdmin.from('profiles').update({ plan }).eq('id', userId)
    },

    upsertPayment: async (data) => {
      await supabaseAdmin
        .from('asaas_payments')
        .upsert(data as Record<string, unknown>, { onConflict: 'asaas_payment_id' })
    },

    setCreditBalance: async (userId, available, reason) => {
      const { error } = await supabaseAdmin.rpc('set_credit_balance', {
        target_user_id: userId,
        available_credits: available,
        reason,
      })
      if (error) throw new Error(`set_credit_balance: ${error.message}`)
    },
  }
}

export async function POST(request: NextRequest) {
  const receivedToken = request.headers.get('asaas-access-token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  console.log('[webhook/asaas] token received:', Boolean(receivedToken))

  if (!expectedToken || receivedToken !== expectedToken) {
    console.warn('[webhook/asaas] Unauthorized request — invalid token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventId = body?.id ?? body?.payment?.id ?? null
  console.log('[webhook/asaas] event:', body?.event, 'id:', eventId)

  const result = await processWebhookEvent(body, createDeps())

  if (result.duplicate) {
    console.log('[webhook/asaas] Duplicate event, skipping:', eventId)
  }
  if (result.error) {
    console.error('[webhook/asaas] Handler error:', result.error)
  }

  // Always return 200 so Asaas doesn't retry — errors logged for manual review
  return NextResponse.json({ ok: result.ok, error: result.error ?? undefined })
}
