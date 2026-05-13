export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-12 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-10 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-80 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-12 rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </main>
  )
}
