export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="h-36 rounded-2xl bg-slate-200 animate-pulse mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}
