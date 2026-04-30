'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import { correctEssayWithGroq } from '@/lib/groq'

type CorrectionState = { error: string | null }

export async function runEssayCorrection(essayId: string): Promise<CorrectionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const { data: essay, error: fetchError } = await supabase
    .from('essays')
    .select('id, status')
    .eq('id', essayId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !essay) return { error: 'Redação não encontrada.' }
  if (essay.status !== 'processing') {
    return { error: 'Esta redação não está disponível para correção.' }
  }

  try {
    await correctEssayWithGroq(essayId, user.id)
    revalidatePath(`/redacoes/${essayId}`)
    return { error: null }
  } catch (err) {
    // Erro já foi registrado em correctEssayWithGroq; crédito já foi reembolsado.
    revalidatePath(`/redacoes/${essayId}`)
    return {
      error:
        err instanceof Error && err.message.includes('OPENAI_API_KEY')
          ? 'Serviço de correção não configurado. Contate o suporte.'
          : 'Erro ao corrigir redação. Seu crédito foi devolvido.',
    }
  }
}
