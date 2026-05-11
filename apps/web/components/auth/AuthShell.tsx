import Link from 'next/link'

interface Props {
  children: React.ReactNode
}

export default function AuthShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm leading-none">R</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              Reda<span className="text-blue-600">1000</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-10 lg:py-16">
        {children}
      </main>
    </div>
  )
}
