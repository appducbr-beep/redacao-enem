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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">

        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Início
          </Link>
          <LogoutButton />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Temas de redação
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Escolha um tema para começar seu treino
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              {freeCount} gratuito{freeCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              {proCount} Pro
            </span>
            {!isUserPro && proCount > 0 && (
              <Link href="/planos" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors ml-1">
                Assinar Pro →
              </Link>
            )}
          </div>
        </div>

        {topicsError && (
          <p className="text-sm text-red-500 mb-4">Erro ao carregar temas: {topicsError}</p>
        )}

        {!topicsError && topics.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-3">📝</p>
            <p className="text-sm text-slate-500">Nenhum tema disponível no momento.</p>
          </div>
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
