import Link from 'next/link'

interface Props {
  children: React.ReactNode
  topbarAction?: React.ReactNode
  compact?: boolean
}

export default function AuthShell({ children, topbarAction, compact = false }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white relative overflow-hidden">
      {/* Decorative blur shapes */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-blue-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-violet-200/20 blur-3xl" />

      {/* Topbar */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm leading-none">R</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold text-slate-900 leading-none">
                Reda<span className="text-blue-600">1000</span>
              </span>
              <span className="text-[10px] text-slate-400 leading-none tracking-wide">
                Correção de redação ENEM
              </span>
            </div>
          </Link>
          {topbarAction}
        </div>
      </header>

      {/* Content */}
      <main className={`relative z-10 max-w-6xl mx-auto px-4 min-h-[calc(100vh-68px)] flex ${compact ? 'items-start' : 'items-center'}`}>
        <div className={`w-full ${compact ? 'py-6 lg:py-8' : 'py-10 lg:py-14'}`}>
          {children}
        </div>
      </main>
    </div>
  )
}
