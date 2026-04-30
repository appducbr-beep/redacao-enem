'use client'

import { useState, useTransition } from 'react'
import PlanCard from './PlanCard'
import { createProSubscription } from '@/app/actions/subscribe'

const FREE_FEATURES = [
  '3 redações por mês',
  'Correção por competência (C1–C5)',
  'Envie redações escritas à mão',
  'Histórico de redações',
  'Dashboard de evolução',
  'Acesso a temas limitados',
]

const PRO_FEATURES = [
  'Redações ilimitadas',
  'Temas ilimitados',
  'Correção completa por competência',
  'Histórico completo',
  'Evolução detalhada',
]

interface Props {
  userPlan: string | null
  isLoggedIn: boolean
}

export default function PricingSection({ userPlan, isLoggedIn }: Props) {
  const [isPending, startTransition] = useTransition()
  const [loadingPlan, setLoadingPlan] = useState<'pro-monthly' | 'pro-annual' | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleProSubscribe = (plan: 'pro-monthly' | 'pro-annual') => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    setCheckoutError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await createProSubscription(plan)
      if (result.error) {
        setCheckoutError(result.error)
        setLoadingPlan(null)
        return
      }
      // result.checkoutUrl is defined here — error branch returns early above
      window.location.href = result.checkoutUrl!
    })
  }

  const isLoading = isPending

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Cards — py-8 gives breathing room for md:scale-105 on Pro Anual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch py-8 overflow-visible">
        <PlanCard
          name="Gratuito"
          tagline="Ideal para começar"
          price="R$ 0"
          priceNote="Sempre gratuito"
          features={FREE_FEATURES}
          ctaLabel="Começar grátis"
          ctaVariant="subtle"
          ctaHref={isLoggedIn ? '/temas' : '/register'}
          isCurrent={!userPlan || userPlan === 'free'}
        />

        <PlanCard
          name="Pro Mensal"
          tagline="Para quem quer evoluir de forma contínua"
          price="R$ 19,00/mês"
          features={PRO_FEATURES}
          ctaLabel={isLoading && loadingPlan === 'pro-monthly' ? 'Aguarde...' : 'Começar plano Pro'}
          ctaVariant="outlined"
          onCtaClick={() => handleProSubscribe('pro-monthly')}
          disabled={isLoading}
          isCurrent={false}
        />

        <PlanCard
          name="Pro Anual"
          tagline="Melhor custo-benefício para quem quer chegar na nota 1000"
          price="R$ 14,90/mês"
          priceNote="Cobrado anualmente"
          savingsText="Economize mais de 20%"
          badge="Mais escolhido"
          features={PRO_FEATURES}
          ctaLabel={isLoading && loadingPlan === 'pro-annual' ? 'Aguarde...' : 'Começar plano Pro'}
          ctaVariant="solid"
          onCtaClick={() => handleProSubscribe('pro-annual')}
          disabled={isLoading}
          highlighted
          isCurrent={userPlan === 'pro'}
        />
      </div>

      {checkoutError && (
        <p className="text-center text-sm text-red-600 font-medium">{checkoutError}</p>
      )}

      {/* Proof of value */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700">
          Quanto mais você treina, mais sua nota evolui.
        </p>
        <p className="text-xs text-slate-400">
          Estudantes que treinam regularmente alcançam notas acima de 900.
        </p>
      </div>
    </div>
  )
}
