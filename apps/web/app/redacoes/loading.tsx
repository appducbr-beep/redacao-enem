export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-44 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}
