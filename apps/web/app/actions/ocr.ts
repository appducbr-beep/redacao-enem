'use server'

import { createClient } from '@/lib/supabaseServer'
import { extractTextFromImage } from '@/lib/groqOcr'
import { trackServerEvent } from '@/lib/analytics'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMimeType = (typeof ALLOWED_TYPES)[number]
const MAX_BYTES = 8 * 1024 * 1024

type OcrResult = { text: string; error?: never } | { text?: never; error: string }

export async function extractEssayTextFromImage(formData: FormData): Promise<OcrResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const file = formData.get('image')
  if (!(file instanceof File)) return { error: 'Nenhuma imagem enviada.' }

  if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return { error: 'Formato não suportado. Use JPEG, PNG ou WebP.' }
  }

  if (file.size > MAX_BYTES) {
    return { error: 'Imagem muito grande. Máximo 8 MB.' }
  }

  trackServerEvent('ocr_started', user.id, { file_type: file.type, file_size: file.size })
  try {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const text = await extractTextFromImage(base64, file.type as AllowedMimeType)
    trackServerEvent('ocr_completed', user.id)
    return { text }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[OCR] falhou:', msg)
    trackServerEvent('ocr_failed', user.id, { error: msg })
    return {
      error:
        'Não foi possível extrair o texto automaticamente. Você ainda pode digitar ou colar sua redação manualmente.',
    }
  }
}
