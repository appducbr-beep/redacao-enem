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

  const freeTopics = topics.filter((t) => t.is_free)
  const proTopics = topics.filter((t) => !t.is_free)
  const freeCount = freeTopics.length
  const proCount = proTopics.length

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">

        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Início
          </Link>
          <LogoutButton />
        </div>

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-7 text-white mb-8 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            ENEM · Banco de temas
          </p>
          <h1 className="text-2xl font-bold leading-snug mb-1.5">
            Seu próximo treino começa aqui
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Escolha um tema e receba análise completa por competência (C1–C5).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {freeCount > 0 && (
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300">
                ✓ {freeCount} tema{freeCount !== 1 ? 's' : ''} gratuito{freeCount !== 1 ? 's' : ''}
              </span>
            )}
            {proCount > 0 && (
              <span className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-300">
                ★ {proCount} tema{proCount !== 1 ? 's' : ''} Pro
              </span>
            )}
            {!isUserPro && proCount > 0 && (
              <Link
                href="/planos"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm"
              >
                Assinar Pro →
              </Link>
            )}
          </div>
        </div>

        {topicsError && (
          <p className="text-sm text-red-500 mb-4">Erro ao carregar temas: {topicsError}</p>
        )}

        {!topicsError && topics.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-3xl">📝</p>
            <p className="text-sm text-slate-500">Nenhum tema disponível no momento.</p>
          </div>
        )}

        {/* Temas acessíveis */}
        {freeTopics.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">
                Disponíveis agora
              </h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="space-y-3">
              {freeTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} isUserPro={isUserPro} />
              ))}
            </div>
          </div>
        )}

        {/* Temas Pro */}
        {proTopics.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">
                  Exclusivo Pro
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {!isUserPro && (
                <Link
                  href="/planos"
                  className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Desbloquear tudo →
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {proTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} isUserPro={isUserPro} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
