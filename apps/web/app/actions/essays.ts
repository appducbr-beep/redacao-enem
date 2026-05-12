'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { trackServerEvent } from '@/lib/analytics'

type SubmitState = { error: string | null }

export async function submitEssay(
  _prev: SubmitState | undefined,
  formData: FormData
): Promise<SubmitState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Você precisa estar autenticado para enviar uma redação.' }
  if (!user.email_confirmed_at) return { error: 'Confirme seu e-mail antes de enviar redações.' }

  const temaId = formData.get('tema_id') as string | null
  const content = ((formData.get('content') as string) ?? '').trim()

  if (!temaId) return { error: 'Tema não informado.' }
  if (content.length < 800) {
    return { error: `Redação muito curta. Mínimo de 800 caracteres (você escreveu ${content.length}).` }
  }
  if (content.length > 4500) return { error: 'Redação muito longa. Máximo de 4.500 caracteres.' }

  const [topicResult, profileResult, creditsResult] = await Promise.all([
    supabase
      .from('essay_topics')
      .select('id, is_free, active')
      .eq('id', temaId)
      .single(),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.rpc('get_available_credits', { p_user_id: user.id }),
  ])

  if (topicResult.error || !topicResult.data) return { error: 'Tema não encontrado.' }
  if (!topicResult.data.active) return { error: 'Este tema não está disponível.' }

  const plan = profileResult.data?.plan ?? 'free'
  const isUserPro = plan === 'pro' || plan === 'school'
  if (!topicResult.data.is_free && !isUserPro) {
    return { error: 'Este tema é exclusivo do plano Pro.' }
  }

  const credits = creditsResult.data as number | null
  if (credits === null || credits < 1) {
    return { error: 'Você não tem créditos disponíveis para enviar esta redação.' }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const { data: essay, error: insertError } = await supabase
    .from('essays')
    .insert({
      user_id: user.id,
      topic_id: temaId,
      content,
      modality: 'text',
      word_count: wordCount,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !essay) return { error: 'Erro ao salvar redação. Tente novamente.' }

  const { error: consumeError } = await supabase.rpc('consume_credit', {
    p_user_id: user.id,
    p_essay_id: essay.id,
    p_reason: 'essay_correction',
  })

  if (consumeError) {
    // Crédito não foi debitado. A redação fica orphan em 'pending' sem credit_consumed.
    // O pipeline de IA ignora essays sem credit_consumed=true, portanto não há risco.
    return { error: 'Erro ao consumir crédito. Tente novamente — nenhum crédito foi debitado.' }
  }

  await supabase.from('essays').update({ status: 'processing' }).eq('id', essay.id)

  trackServerEvent('essay_submitted', user.id, { essay_id: essay.id, topic_id: temaId })
  redirect(`/redacoes/${essay.id}`)
}
