import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import PricingSection from '@/components/plans/PricingSection'
import CancelSubscriptionButton from '@/app/perfil/CancelSubscriptionButton'
import { trackServerEvent } from '@/lib/analytics'

const DIFFERENTIALS = [
  {
    icon: '📋',
    title: 'Baseado na cartilha oficial do ENEM',
    description: 'Critérios reais do MEC, sem achismos ou generalizações.',
  },
  {
    icon: '🔍',
    title: 'Feedback com trechos do seu texto',
    description: 'Veja exatamente onde e por quê você perdeu pontos.',
  },
  {
    icon: '✂️',
    title: 'Erros identificados com precisão',
    description: 'Cada erro é apontado no trecho real — sem feedback genérico.',
  },
  {
    icon: '💡',
    title: 'Sugestões práticas de melhoria',
    description: 'Como reescrever para melhorar cada competência avaliada.',
  },
]

export default async function PlanosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userPlan: string | null = null
  let cancelAtPeriodEnd = false
  let periodEndIso: string | null = null

  trackServerEvent('plans_viewed', user?.id)

  if (user) {
    const [profileData, subData] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase
        .from('subscriptions')
        .select('cancel_at_period_end, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])
    userPlan = (profileData.data as { plan?: string } | null)?.plan ?? 'free'
    type SubRow = { cancel_at_period_end: boolean; current_period_end: string | null }
    const sub = subData.data as SubRow | null
    cancelAtPeriodEnd = sub?.cancel_at_period_end ?? false
    periodEndIso = sub?.current_period_end ?? null
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Back link */}
      <div className="px-4 pt-6 max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Início
        </Link>
      </div>

      {/* Hero */}
      <section className="px-4 mt-6 mb-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl px-6 py-10 sm:px-10 text-center">

            {/* Badge */}
            <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 mb-6">
              Planos Reda1000
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Alcance a nota 1000{' '}
              <span className="text-blue-600">com feedback de verdade</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Receba diagnósticos rápidos e precisos baseados nos critérios oficiais do ENEM.
            </p>

            {/* Aux text */}
            <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">
              Descubra onde você perde pontos, acompanhe sua evolução e treine com mais consistência.
            </p>

            {/* Plan status */}
            {user && userPlan === 'free' && (
              <div className="mt-6 space-y-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Seu plano atual: Gratuito
                </span>
                <p className="text-xs text-slate-400 block">
                  Desbloqueie mais redações e evolua mais rápido.
                </p>
              </div>
            )}
            {user && userPlan === 'pro' && (
              <div className="mt-6 space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  ✓ Você já tem o plano Pro
                </span>
                {cancelAtPeriodEnd && periodEndIso ? (
                  <p className="text-xs text-slate-500 block">
                    Renovação cancelada. Acesso ativo até{' '}
                    <span className="font-semibold">
                      {new Date(periodEndIso).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </span>.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      Você pode cancelar seu plano a qualquer momento.
                    </p>
                    <CancelSubscriptionButton />
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 pb-12">
        <PricingSection userPlan={userPlan} isLoggedIn={!!user} />
      </section>

      {/* Differentials */}
      <section className="bg-white border-t border-slate-100 px-4 py-14">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Por que o Reda1000 é diferente?
            </h2>
            <p className="text-sm text-slate-500">
              Não é só uma nota — é um diagnóstico real da sua escrita.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIFFERENTIALS.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {icon}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-8 py-12 text-center space-y-5 shadow-xl">
          <h2 className="text-2xl font-bold text-white leading-snug">
            Comece agora e veja sua evolução em poucas redações
          </h2>
          <p className="text-sm text-blue-300">
            Sem cartão de crédito. Sem compromisso. Comece hoje mesmo.
          </p>
          <Link
            href={user ? '/temas' : '/register'}
            className="inline-block rounded-xl bg-white text-blue-800 font-semibold text-sm px-7 py-3.5 hover:bg-blue-50 transition-colors shadow-sm"
          >
            Começar gratuitamente
          </Link>
        </div>
      </section>

    </main>
  )
}
