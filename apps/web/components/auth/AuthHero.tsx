const METRICS = [
  {
    label: 'C1–C5 avaliadas',
    sub: 'Todas as competências do ENEM',
  },
  {
    label: 'Histórico completo',
    sub: 'Consulte suas redações anteriores',
  },
  {
    label: 'Evolução por nota',
    sub: 'Acompanhe sua progressão ao longo do tempo',
  },
]

export default function AuthHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`hidden lg:flex flex-col ${compact ? 'gap-4' : 'gap-6'}`}>

      {/* Badge + copy */}
      <div className="space-y-3">
        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Preparação ENEM • Feedback por competência
        </span>
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          Treine redação com clareza, método e evolução real.
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Receba diagnósticos objetivos, entenda onde perde pontos e acompanhe sua evolução em cada competência do ENEM.
        </p>
      </div>

      {/* Premium dark panel */}
      <div className={`rounded-3xl bg-gradient-to-br from-blue-800 to-blue-950 shadow-2xl ${compact ? 'p-5 space-y-3' : 'p-7 space-y-5'}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl shrink-0">
            ✍️
          </div>
          <div>
            <p className="text-base font-bold text-white leading-snug">
              Seu próximo treino começa aqui
            </p>
            <p className="text-sm text-blue-200 mt-1 leading-relaxed">
              Envie sua redação e receba uma análise detalhada por competência.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-4 py-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white leading-none">{m.label}</p>
                <p className="text-xs text-blue-200 mt-0.5 leading-relaxed">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
