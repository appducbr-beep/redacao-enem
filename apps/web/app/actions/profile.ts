'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type ProfileState = { error: string | null; success?: string }

export async function updateProfile(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autenticado.' }

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return { error: 'Nome é obrigatório.' }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao salvar. Tente novamente.' }

  revalidatePath('/perfil')
  revalidatePath('/')

  return { error: null, success: 'Perfil atualizado com sucesso.' }
}
