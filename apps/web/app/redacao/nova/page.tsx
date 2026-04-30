import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import EssayForm from '@/components/EssayForm'

type Props = { searchParams: Promise<{ tema_id?: string }> }

export default async function NovaRedacaoPage({ searchParams }: Props) {
  const { tema_id } = await searchParams

  if (!tema_id) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [topicResult, profileResult, creditsResult] = await Promise.all([
    supabase
      .from('essay_topics')
      .select('id, title, year, is_free, description, active')
      .eq('id', tema_id)
      .single(),
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase.rpc('get_available_credits', { p_user_id: user.id }),
  ])

  if (topicResult.error || !topicResult.data || !topicResult.data.active) notFound()

  const topic = topicResult.data
  const plan = profileResult.data?.plan ?? 'free'
  const isUserPro = plan === 'pro' || plan === 'school'
  const accessible = topic.is_free || isUserPro

  if (!accessible) redirect(`/temas/${tema_id}`)

  const credits = creditsResult.data as number | null

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <div className="mb-8">
          <Link href={`/temas/${topic.id}`} className="text-sm text-gray-400 hover:text-gray-600">
            ← {topic.title}
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">Nova redação</h1>
          {topic.year && (
            <p className="text-sm text-gray-500 mt-1">ENEM {topic.year}</p>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Créditos disponíveis</span>
          <span className={`text-sm font-semibold ${(credits ?? 0) > 0 ? 'text-gray-900' : 'text-red-500'}`}>
            {credits ?? 0}
          </span>
        </div>

        {(credits ?? 0) < 1 ? (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-6 py-8 text-center space-y-3">
            <p className="text-sm font-semibold text-orange-900">Você não tem créditos disponíveis</p>
            <p className="text-sm text-orange-700">
              Cada redação consome 1 crédito. Faça upgrade para continuar enviando.
            </p>
            <Link
              href="/planos"
              className="inline-block rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Ver planos
            </Link>
          </div>
        ) : (
          <EssayForm temaId={topic.id} temaTitle={topic.title} />
        )}

      </div>
    </main>
  )
}
