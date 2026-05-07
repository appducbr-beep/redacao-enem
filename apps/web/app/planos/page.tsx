import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'
import PricingSection from '@/components/plans/PricingSection'
import CancelSubscriptionButton from '@/app/perfil/CancelSubscriptionButton'

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
  console.log("ASAAS_ENV:", process.env.ASAAS_ENV)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userPlan: string | null = null
  let cancelAtPeriodEnd = false
  let periodEndIso: string | null = null

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

      {/* Hero */}
      <section className="px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4 mt-12 mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Alcance a nota 1000{' '}
            <span className="text-blue-700">com feedback de verdade</span>
          </h1>
          <p className="text-lg text-slate-500">
            Receba diagnósticos rápidos e precisos baseados nos critérios do ENEM
          </p>
          <p className="text-sm text-slate-400">
            Descubra exatamente onde você perde pontos e como melhorar.
          </p>

          {user && userPlan === 'free' && (
            <div className="pt-1 space-y-1">
              <p className="text-sm font-semibold text-blue-700">
                Seu plano atual: Gratuito
              </p>
              <p className="text-xs text-slate-500">
                Desbloqueie mais redações e evolua mais rápido.
              </p>
            </div>
          )}
          {user && userPlan === 'pro' && (
            <div className="pt-1 space-y-3">
              <p className="text-sm font-semibold text-green-700">
                Você já tem o plano Pro ✓
              </p>
              {cancelAtPeriodEnd && periodEndIso ? (
                <p className="text-xs text-slate-500">
                  Renovação cancelada. Acesso ativo até{' '}
                  <span className="font-semibold">
                    {new Date(periodEndIso).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                  .
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    Você pode cancelar seu plano a qualquer momento.
                  </p>
                  <CancelSubscriptionButton />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 pb-12">
        <PricingSection userPlan={userPlan} isLoggedIn={!!user} />
      </section>

      {/* Differentials */}
      <section className="bg-white border-t border-slate-100 px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
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
                className="flex gap-4 bg-slate-50 border border-slate-100 rounded-xl p-5"
              >
                <span className="text-2xl shrink-0">{icon}</span>
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
        <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-12 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">
            Comece agora e veja sua evolução em poucas redações
          </h2>
          <p className="text-sm text-blue-200">
            Sem cartão de crédito. Sem compromisso. Comece hoje mesmo.
          </p>
          <Link
            href={user ? '/temas' : '/register'}
            className="inline-block rounded-xl bg-white text-blue-800 font-semibold text-sm px-7 py-3.5 hover:bg-blue-50 transition-colors"
          >
            Começar gratuitamente
          </Link>
        </div>
      </section>

    </main>
  )
}
