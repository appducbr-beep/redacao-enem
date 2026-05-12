import Link from 'next/link'
import type { OnboardingStatus } from '@/lib/onboardingUtils'

interface Props {
  status: OnboardingStatus
}

function CheckStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          done
            ? 'bg-green-400 text-white'
            : 'border-2 border-white/25 bg-white/10'
        }`}
      >
        {done && '✓'}
      </div>
      <span className={`text-sm ${done ? 'text-white/50 line-through' : 'text-white font-medium'}`}>
        {label}
      </span>
    </div>
  )
}

export default function OnboardingCard({ status }: Props) {
  if (status === 'correction_received') return null

  if (status === 'essay_sent') {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-blue-800 to-blue-900 border border-blue-700/40 px-5 py-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
              <span className="text-green-400 text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Excelente começo!</p>
              <p className="text-xs text-blue-300 mt-0.5">
                Sua primeira redação foi enviada. Aguardando análise completa...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 pl-12 sm:pl-0">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-green-300 font-medium">✓ Tema escolhido</span>
              <span className="text-xs text-green-300 font-medium">✓ Redação enviada</span>
              <span className="text-xs text-blue-400/60">◉ Correção pendente</span>
            </div>
            <Link
              href="/redacoes"
              className="text-xs font-semibold text-blue-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Ver status →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 p-6 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left: header + CTA */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5">
              Primeiros passos
            </p>
            <h2 className="text-lg font-bold text-white leading-snug">
              Vamos começar sua preparação
            </h2>
            <p className="text-sm text-blue-200 mt-1.5 leading-relaxed">
              Siga os passos abaixo para enviar sua primeira redação e começar a acompanhar sua evolução.
            </p>
          </div>
          <Link
            href="/temas"
            className="inline-flex items-center rounded-xl bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 hover:bg-blue-50 transition-colors shadow-sm"
          >
            Começar agora →
          </Link>
        </div>

        {/* Right: checklist */}
        <div className="space-y-3 lg:pt-1">
          <CheckStep label="Escolher um tema" done={false} />
          <CheckStep label="Enviar primeira redação" done={false} />
          <CheckStep label="Receber primeira correção" done={false} />
        </div>

      </div>
    </div>
  )
}
