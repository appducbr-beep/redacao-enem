import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import TopicCard from '@/components/TopicCard'
import LogoutButton from '@/components/LogoutButton'

type Topic = {
  id: string
  title: string
  year: number | null
  is_free: boolean
  description: string | null
}

export default async function TemasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, topicsResult] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', user.id).single(),
    supabase
      .from('essay_topics')
      .select('id, title, year, is_free, description')
      .eq('active', true)
      .order('year', { ascending: false, nullsFirst: false }),
  ])

  const plan = profileResult.data?.plan ?? 'free'
  const isUserPro = plan === 'pro' || plan === 'school'
  const topics: Topic[] = topicsResult.data ?? []
  const topicsError = topicsResult.error?.message ?? null

  const freeCount = topics.filter((t) => t.is_free).length
  const proCount = topics.filter((t) => !t.is_free).length

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Início
          </Link>
          <LogoutButton />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Temas de redação
          </h1>
          <p className="mt-1 text-base text-gray-500">
            Escolha um tema para começar seu treino
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
            <span>{freeCount} gratuito{freeCount !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{proCount} Pro</span>
            {!isUserPro && proCount > 0 && (
              <>
                <span>·</span>
                <Link href="/planos" className="text-blue-600 hover:underline">
                  Assinar Pro
                </Link>
              </>
            )}
          </div>
        </div>

        {topicsError && (
          <p className="text-sm text-red-500 mb-4">Erro ao carregar temas: {topicsError}</p>
        )}

        {!topicsError && topics.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum tema disponível no momento.</p>
        )}

        {topics.length > 0 && (
          <div className="space-y-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} isUserPro={isUserPro} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
