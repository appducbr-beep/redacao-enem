export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-10 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    </main>
  )
}
