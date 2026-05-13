'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import { correctEssayWithGroq } from '@/lib/groq'
import { logError } from '@/lib/logger'
import { generateErrorId } from '@/lib/errorId'

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
    const errorId = generateErrorId()
    logError('correction failed', { essay_id: essayId, error_id: errorId })
    revalidatePath(`/redacoes/${essayId}`)
    return {
      error:
        err instanceof Error && err.message.includes('OPENAI_API_KEY')
          ? 'Serviço de correção não configurado. Contate o suporte.'
          : `A correção não pôde ser concluída agora. Tente novamente em alguns minutos. Seu crédito foi devolvido. (Ref: ${errorId})`,
    }
  }
}
