import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import LogoutButton from '@/components/LogoutButton'
import DashboardActionCard from '@/components/dashboard/DashboardActionCard'
import DashboardStatsCard from '@/components/dashboard/DashboardStatsCard'
import RecentEssaysTable from '@/components/dashboard/RecentEssaysTable'
import type { RecentEssayRow } from '@/components/dashboard/RecentEssaysTable'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">
              Reda<span className="text-blue-700">1000</span>
            </h1>
            <p className="text-xl font-semibold text-slate-700">
              Treine redação para o ENEM com feedback imediato
            </p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Receba nota por competência, veja onde melhorar e acompanhe sua evolução.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="block w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const [profileResult, walletResult, essaysResult, subscriptionResult] = await Promise.all([
    supabase.from('profiles').select('full_name, plan').eq('id', user.id).single(),
    supabase
      .from('credit_wallets')
      .select('credits_available')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('essays')
      .select(
        'id, status, created_at, essay_topics(title), essay_corrections(total_score, c1, c2, c3, c4, c5)',
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('subscriptions')
      .select('cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  type ProfileRow = { full_name?: string; plan?: string }
  const fullName = (profileResult.data as ProfileRow | null)?.full_name ?? null
  const plan = (profileResult.data as ProfileRow | null)?.plan ?? 'free'
  const isPro = plan === 'pro' || plan === 'school'

  type SubRow = { cancel_at_period_end: boolean; current_period_end: string | null }
  const subRow = subscriptionResult.data as SubRow | null
  const cancelAtPeriodEnd = subRow?.cancel_at_period_end ?? false
  const periodEndIso = subRow?.current_period_end ?? null

  const creditsAvailable =
    (walletResult.data as { credits_available?: number } | null)?.credits_available ?? null

  const totalEssays = essaysResult.count ?? essaysResult.data?.length ?? 0

  type CorrectionRaw = {
    total_score?: number
    c1?: number
    c2?: number
    c3?: number
    c4?: number
    c5?: number
  }

  const essays: RecentEssayRow[] = (essaysResult.data ?? []).map((row) => {
    const correction = (
      Array.isArray(row.essay_corrections) ? row.essay_corrections[0] : row.essay_corrections
    ) as CorrectionRaw | null

    const topic = (
      Array.isArray(row.essay_topics) ? row.essay_topics[0] : row.essay_topics
    ) as { title?: string } | null

    let total_score: number | null = null
    if (correction) {
      total_score =
        correction.total_score ||
        ((correction.c1 ?? 0) +
          (correction.c2 ?? 0) +
          (correction.c3 ?? 0) +
          (correction.c4 ?? 0) +
          (correction.c5 ?? 0)) ||
        null
    }

    return {
      id: row.id as string,
      status: row.status as string,
      created_at: row.created_at as string,
      topic_title: topic?.title ?? 'Tema não identificado',
      total_score,
    }
  })

  const doneEssays = essays.filter((e) => e.status === 'done' && e.total_score !== null)
  const avgScore =
    doneEssays.length > 0
      ? Math.round(
          doneEssays.reduce((sum, e) => sum + (e.total_score ?? 0), 0) / doneEssays.length
        )
      : null

  const recentEssays = essays.slice(0, 5)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {fullName ? `Olá, ${fullName.split(' ')[0]}!` : 'Olá! Complete seu perfil'}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-slate-500">Bem-vindo ao seu painel de treino</p>
              <Link href="/perfil" className="text-xs text-blue-600 hover:underline">
                Editar perfil
              </Link>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Motivational banner */}
        <div className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 text-white">
          <p className="text-lg font-semibold">Treinar redação é o caminho para a nota 1000.</p>
          <p className="text-sm text-blue-200 mt-1">
            Cada redação corrigida é um passo a mais rumo ao ENEM.
          </p>
        </div>

        {/* Action cards */}
        <div className={`grid grid-cols-1 gap-4 ${isPro ? 'sm:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'}`}>
          <DashboardActionCard
            icon="✍️"
            title="Nova redação"
            description="Começar um novo treino agora"
            href="/temas"
          />
          <DashboardActionCard
            icon="📚"
            title="Histórico"
            description="Veja suas redações anteriores"
            href="/redacoes"
          />
          <DashboardActionCard
            icon="📈"
            title="Evolução"
            description="Acompanhe seu progresso ao longo do tempo"
            href="/evolucao"
          />
          {!isPro && (
            <DashboardActionCard
              icon="⭐"
              title="Planos Pro"
              description="Redações ilimitadas e temas exclusivos"
              href="/planos"
            />
          )}
        </div>

        {/* Stats */}
        <DashboardStatsCard
          avgScore={avgScore}
          totalEssays={totalEssays}
          creditsAvailable={creditsAvailable}
        />

        {/* Scheduled cancellation notice */}
        {isPro && cancelAtPeriodEnd && periodEndIso && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-900">Renovação cancelada</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Seu plano Pro continua ativo até{' '}
              <span className="font-semibold">
                {new Date(periodEndIso).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </span>
              . Após essa data, você voltará ao plano Gratuito.
            </p>
          </div>
        )}

        {/* Upgrade CTA — only when out of credits on free plan */}
        {!isPro && creditsAvailable === 0 && (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-orange-900">Créditos esgotados</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Assine o plano Pro para treinar sem limites.
              </p>
            </div>
            <Link
              href="/planos"
              className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              Assinar Pro
            </Link>
          </div>
        )}

        {/* Recent essays */}
        <RecentEssaysTable essays={recentEssays} />

      </div>
    </main>
  )
}
