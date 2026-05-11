const BENEFITS = [
  {
    title: 'Correção completa',
    description: 'Nota geral, competências C1–C5, justificativas e orientações de melhoria.',
  },
  {
    title: 'Histórico organizado',
    description: 'Consulte suas redações anteriores e acompanhe seu desempenho ao longo do tempo.',
  },
  {
    title: 'Evolução real',
    description: 'Veja sua média, pontos fortes e competências que precisam de atenção.',
  },
]

export default function AuthHero() {
  return (
    <div className="hidden lg:flex flex-col gap-7">

      {/* Badge + copy */}
      <div className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Preparação ENEM · Plataforma do aluno
        </span>
        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
          Entre, escreva e acompanhe sua evolução.
        </h2>
        <p className="text-slate-500 leading-relaxed">
          Continue seus treinos, revise suas correções anteriores e avance rumo a uma redação cada vez mais forte no modelo ENEM.
        </p>
      </div>

      {/* Blue panel */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 p-6 space-y-5 shadow-lg">
        <div>
          <p className="text-base font-semibold text-white leading-snug">
            Seu próximo passo começa aqui.
          </p>
          <p className="text-sm text-blue-200 mt-1.5 leading-relaxed">
            Envie sua redação, receba uma análise detalhada por competência e acompanhe sua evolução ao longo dos treinos.
          </p>
        </div>
        <div className="space-y-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl bg-white/15 px-4 py-3.5 space-y-0.5">
              <p className="text-sm font-semibold text-white">{b.title}</p>
              <p className="text-xs text-blue-200 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
