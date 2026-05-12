import Link from 'next/link'

// ─── Mock score card shown in the hero ───────────────────────────────────────

const MOCK_COMPETENCIES = [
  { label: 'C1', score: 180, max: 200 },
  { label: 'C2', score: 160, max: 200 },
  { label: 'C3', score: 200, max: 200 },
  { label: 'C4', score: 160, max: 200 },
  { label: 'C5', score: 140, max: 200 },
]

function HeroMockup() {
  return (
    <div className="relative max-w-sm mx-auto lg:mx-0 lg:ml-auto">
      {/* Glow behind card */}
      <div className="absolute inset-0 rounded-3xl bg-green-500/20 blur-2xl scale-95 pointer-events-none" />

      <div className="relative rounded-3xl bg-gradient-to-br from-green-900 to-green-950 p-6 shadow-2xl border border-green-800/40">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Resultado</p>
            <p className="text-4xl font-bold text-white tabular-nums mt-0.5 leading-none">840</p>
            <p className="text-sm text-green-300 mt-0.5">de 1000 pontos</p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-green-400/30 bg-green-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">✓</span>
          </div>
        </div>

        {/* Competency bars */}
        <div className="space-y-2.5">
          {MOCK_COMPETENCIES.map(({ label, score, max }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-green-300 w-5 shrink-0">{label}</span>
              <div className="flex-1 bg-green-800/50 rounded-full h-2">
                <div
                  className="bg-green-400 rounded-full h-2"
                  style={{ width: `${(score / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-white tabular-nums w-8 text-right shrink-0">{score}</span>
            </div>
          ))}
        </div>

        {/* Feedback snippet */}
        <div className="mt-5 rounded-xl bg-white/10 border border-white/10 px-4 py-3">
          <p className="text-xs font-semibold text-white">C3 — Nota máxima</p>
          <p className="text-xs text-green-200 mt-0.5 leading-relaxed">
            Sua argumentação demonstra consistência e uso eficaz de dados concretos para sustentar a tese.
          </p>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-3 rounded-full bg-blue-600 border-2 border-blue-400/30 px-3 py-1.5 shadow-lg">
        <p className="text-xs font-bold text-white">Corrigido em segundos</p>
      </div>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: '01',
    icon: '🎯',
    title: 'Escolha um tema',
    desc: 'Acesse temas atuais e clássicos do ENEM. Temas gratuitos disponíveis para todos.',
  },
  {
    step: '02',
    icon: '✍️',
    title: 'Escreva e envie',
    desc: 'Digite ou fotografe seu texto manuscrito. Nossa IA interpreta os dois formatos.',
  },
  {
    step: '03',
    icon: '📊',
    title: 'Receba análise detalhada',
    desc: 'Nota por competência C1–C5, trechos identificados, justificativas e sugestões de melhoria.',
  },
]

const BENEFITS = [
  {
    icon: '📋',
    title: 'Critérios oficiais do ENEM',
    desc: 'Baseado na cartilha do MEC. Correção real por C1–C5, sem achismos ou generalizações.',
  },
  {
    icon: '🔍',
    title: 'Erros identificados no texto',
    desc: 'Cada problema é apontado no trecho real da sua redação, não em comentários genéricos.',
  },
  {
    icon: '📈',
    title: 'Evolução por competência',
    desc: 'Veja sua progressão ao longo do tempo em cada uma das 5 competências avaliadas.',
  },
  {
    icon: '📚',
    title: 'Histórico organizado',
    desc: 'Todas as suas redações e correções acessíveis a qualquer momento, em um só lugar.',
  },
  {
    icon: '📷',
    title: 'OCR para texto manuscrito',
    desc: 'Envie uma foto da redação escrita à mão e receba a correção completa.',
  },
  {
    icon: '💡',
    title: 'Sugestões de reescrita',
    desc: 'Orientações práticas de como reescrever para melhorar cada competência avaliada.',
  },
]

const TRUST_ITEMS = [
  { icon: '✓', text: 'Baseado nos critérios oficiais do ENEM' },
  { icon: '✓', text: 'Criado para estudantes que querem sair da média' },
  { icon: '✓', text: 'Feedback preciso, sem respostas genéricas' },
]

const PLANS_SUMMARY = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    note: 'Sempre gratuito',
    highlight: '3 redações por mês',
    cta: 'Começar grátis',
    href: '/register',
    featured: false,
    badge: null,
  },
  {
    name: 'Pro Mensal',
    price: 'R$ 19,00',
    note: 'por mês',
    highlight: 'Redações ilimitadas',
    cta: 'Assinar Pro',
    href: '/planos',
    featured: false,
    badge: null,
  },
  {
    name: 'Pro Anual',
    price: 'R$ 14,90',
    note: 'por mês, cobrado anualmente',
    highlight: 'Economize mais de 20%',
    cta: 'Assinar Pro Anual',
    href: '/planos',
    featured: true,
    badge: 'Mais escolhido',
  },
]

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-bold text-sm leading-none">R</span>
            </div>
            <span className="text-base font-bold text-slate-900">
              Reda<span className="text-blue-600">1000</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/planos"
              className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 transition-colors rounded-lg hover:bg-slate-50"
            >
              Planos
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 transition-colors rounded-lg hover:bg-slate-50"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="ml-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Copy */}
            <div className="space-y-7">
              <span className="inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300">
                Preparação ENEM • Plataforma de treino
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Treine redação com feedback detalhado e acompanhe sua evolução.
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Receba análises completas baseadas nos critérios do ENEM, descubra onde perde pontos e evolua redação após redação.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all"
                >
                  Começar grátis
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-600 hover:border-slate-400 px-7 py-3.5 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Ver como funciona
                </a>
              </div>
              <p className="text-xs text-slate-500">Sem cartão de crédito. Comece grátis com 3 redações.</p>
            </div>

            {/* Mockup */}
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10">
            {TRUST_ITEMS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-sm">{icon}</span>
                <span className="text-sm text-slate-400 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="bg-white py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-14">
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Simples e eficaz
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Do tema à nota em 3 passos
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              Sem complicações. Escolha, escreva e receba — tudo em minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ step, icon, title, desc }) => (
              <div key={step} className="relative rounded-2xl bg-slate-50 border border-slate-100 p-6 hover:border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                    {icon}
                  </div>
                  <span className="text-4xl font-black text-slate-100 tabular-nums leading-none mt-1">{step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section className="bg-slate-50 py-20 lg:py-24 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-14">
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Por que o Reda1000?
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Tudo que você precisa para evoluir
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              Não é só uma nota — é um diagnóstico real da sua escrita, baseado nos critérios que a banca usa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl mb-4 shadow-sm">
                  {icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evolução / resultado ── */}
      <section className="bg-white py-20 lg:py-24 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Copy */}
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Evolução real
              </span>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                Acompanhe sua evolução redação por redação.
              </h2>
              <p className="text-slate-500 leading-relaxed text-sm">
                O Reda1000 registra todo o seu histórico e mostra sua progressão por competência ao longo do tempo. Você sempre sabe o quanto evoluiu e onde ainda precisa melhorar.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Nota média por período',
                  'Melhor e pior competência',
                  'Histórico cronológico completo',
                  'Comparativo entre redações',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                Começar grátis →
              </Link>
            </div>

            {/* Evolution mockup */}
            <div className="space-y-3">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Redações', value: '24' },
                  { label: 'Nota média', value: '780' },
                  { label: 'Melhor', value: 'C3' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {/* Mini evolution bars */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evolução por competência</p>
                {[
                  { label: 'C1 — Língua Portuguesa', pct: 82 },
                  { label: 'C2 — Compreensão da proposta', pct: 74 },
                  { label: 'C3 — Seleção de argumentos', pct: 95 },
                  { label: 'C4 — Coesão textual', pct: 70 },
                  { label: 'C5 — Proposta de intervenção', pct: 65 },
                ].map(({ label, pct }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">{label}</span>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos resumidos ── */}
      <section className="bg-slate-50 py-20 lg:py-24 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Planos
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Escolha seu plano
            </h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Comece grátis. Quando estiver pronto para treinar sem limites, assine o Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PLANS_SUMMARY.map(({ name, price, note, highlight, cta, href, featured, badge }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 flex flex-col gap-5 ${
                  featured
                    ? 'bg-gradient-to-b from-blue-50 to-white border-2 border-blue-500 shadow-lg md:scale-105'
                    : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all'
                }`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-700 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow-md whitespace-nowrap">
                    {badge}
                  </div>
                )}
                <div>
                  <p className={`text-sm font-bold mb-1 ${featured ? 'text-blue-700' : 'text-slate-700'}`}>{name}</p>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">{price}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{note}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{highlight}</p>
                </div>
                <Link
                  href={href}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-colors ${
                    featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8">
            <Link href="/planos" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Ver todos os detalhes dos planos →
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 py-20 lg:py-24">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-7">
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Comece sua próxima redação hoje.
          </h2>
          <p className="text-blue-300 leading-relaxed">
            Crie sua conta gratuita e descubra como sua redação pode evoluir com feedback baseado nos critérios reais do ENEM.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-white text-blue-800 font-semibold text-sm px-7 py-3.5 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-blue-700 text-blue-300 hover:border-blue-500 hover:text-white font-semibold text-sm px-7 py-3.5 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="text-xs text-blue-400">Sem cartão de crédito. Comece grátis com 3 redações.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs leading-none">R</span>
                </div>
                <span className="text-base font-bold text-white">
                  Reda<span className="text-blue-400">1000</span>
                </span>
              </Link>
              <p className="text-xs text-slate-500 max-w-xs">
                Projeto educacional focado em treino de redação para o ENEM.
              </p>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/planos" className="text-sm text-slate-400 hover:text-white transition-colors">Planos</Link>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Entrar</Link>
              <Link href="/register" className="text-sm text-slate-400 hover:text-white transition-colors">Criar conta</Link>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600">© 2026 Reda1000. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
