export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-20 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-7 w-36 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-52 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-200 animate-pulse" />
          ))}
          <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </main>
  )
}
