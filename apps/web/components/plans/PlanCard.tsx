import Link from 'next/link'

interface Props {
  name: string
  tagline?: string
  price: string
  priceNote?: string
  savingsText?: string
  badge?: string
  features: string[]
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void
  ctaVariant?: 'solid' | 'outlined' | 'subtle'
  highlighted?: boolean
  isCurrent?: boolean
  disabled?: boolean
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-green-600 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PlanCard({
  name,
  tagline,
  price,
  priceNote,
  savingsText,
  badge,
  features,
  ctaLabel,
  ctaHref,
  onCtaClick,
  ctaVariant,
  highlighted = false,
  isCurrent = false,
  disabled = false,
}: Props) {
  const cardClass = [
    'relative flex flex-col h-full rounded-2xl p-7 transition-all duration-200',
    highlighted
      ? 'bg-gradient-to-b from-blue-50 to-white border-2 border-blue-500 shadow-lg md:scale-105 z-10'
      : 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200',
  ].join(' ')

  const ctaBase =
    'mt-auto block w-full rounded-xl py-3.5 text-sm font-semibold text-center transition-colors'

  const resolvedVariant = ctaVariant ?? (highlighted ? 'solid' : 'subtle')

  const CTA_CLASSES: Record<string, string> = {
    solid: `${ctaBase} bg-blue-700 text-white hover:bg-blue-800`,
    outlined: `${ctaBase} border-2 border-blue-600 text-blue-700 bg-white hover:bg-blue-50`,
    subtle: `${ctaBase} bg-slate-800 text-white hover:bg-slate-700`,
  }

  const ctaClass = CTA_CLASSES[resolvedVariant]

  return (
    <div className={cardClass}>
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-700 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap tracking-wide">
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-slate-800">{name}</span>
            {isCurrent && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Plano atual
              </span>
            )}
          </div>
          {tagline && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tagline}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className={`text-4xl font-bold tracking-tight ${highlighted ? 'text-blue-700' : 'text-slate-800'}`}>
            {price}
          </p>
          {priceNote && <p className="text-xs text-slate-400">{priceNote}</p>}
          {savingsText && (
            <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              {savingsText}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <CheckIcon />
            <span className="text-sm text-slate-600 leading-snug">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className={`${ctaBase} bg-slate-100 text-slate-400 cursor-default border border-slate-200`}>
          Plano atual
        </div>
      ) : ctaHref ? (
        <Link href={ctaHref} className={ctaClass}>
          {ctaLabel}
        </Link>
      ) : (
        <button onClick={onCtaClick} className={ctaClass} disabled={disabled}>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
