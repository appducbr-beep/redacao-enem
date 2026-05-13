import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">

        <div className="space-y-1">
          <p className="text-8xl font-black text-slate-100 select-none leading-none">404</p>
          <h1 className="text-xl font-bold text-slate-800">Página não encontrada</h1>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            O endereço que você tentou acessar não existe ou foi removido.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </Link>
          <Link
            href="/temas"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ver temas
          </Link>
        </div>

      </div>
    </main>
  )
}
